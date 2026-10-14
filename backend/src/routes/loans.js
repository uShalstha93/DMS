/**
 * Loan Detail routes  –  /api/loans
 *
 * Covers loandetail, dhitojamanidetail, and sakshidetail tables.
 *
 * ── Migration note ──────────────────────────────────────────────────────────
 * The existing loandetail table may be missing these columns. Run once:
 *
 *   ALTER TABLE loandetail
 *     ADD COLUMN ApprovedStatus tinyint(1) DEFAULT 0       AFTER HasSakshi,
 *     ADD COLUMN ApprovedBy     varchar(255) DEFAULT NULL  AFTER ApprovedStatus,
 *     ADD COLUMN CreatedBy      int          DEFAULT NULL  AFTER ApprovedBy;
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

// ── SQL fragments ────────────────────────────────────────────────────────────

const LIST_SELECT = `
  SELECT l.MemberNo, l.MemberName, l.LoanNo, l.LoanType, l.LoanAmount, l.LoanPurpose,
         l.ApprovedStatus, l.BranchID, l.EntryDate, b.name AS branch_name
    FROM loandetail l
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = l.BranchID`;

const DETAIL_SELECT = `
  SELECT l.*, b.name AS branch_name
    FROM loandetail l
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = l.BranchID`;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** True when the authenticated user may see loans from every branch. */
const inScope = (user, loan) =>
  canAccessAllBranches(user) || loan.BranchID === user.branch.code;

/** Attach UI-permission flags to a loan row before sending it to the client. */
const withFlags = (user, loan) => ({
  ...loan,
  can_edit:   !loan.ApprovedStatus || user.permissions.includes('loan.approve'),
  can_delete: user.permissions.includes('loan.delete'),
});

/**
 * Fetch the full detail of a single loan (no dhito / sakshi arrays).
 * Returns undefined when not found.
 */
async function getLoan(loanNo) {
  const [rows] = await pool.query(`${DETAIL_SELECT} WHERE l.LoanNo = ?`, [loanNo]);
  return rows[0];
}

/**
 * Generate the next LoanNo for a given branch code.
 * Format: {BranchCode}{6-digit-zero-padded-sequence}  e.g. BKT000001
 */
async function nextLoanNo(branchCode) {
  const [[{ last }]] = await pool.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(LoanNo, ?) AS UNSIGNED)), 0) AS last
       FROM loandetail WHERE BranchID = ? AND LoanNo LIKE ?`,
    [branchCode.length + 1, branchCode, `${branchCode}%`]
  );
  return `${branchCode}${String(last + 1).padStart(6, '0')}`;
}

// ── GET /  –  list ───────────────────────────────────────────────────────────

router.get('/', requirePermission('loan.view'), wrap(async (req, res) => {
  const where  = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('l.BranchID = ?');
    params.push(req.user.branch.code);
  }
  if (req.query.status === 'PENDING') {
    where.push('(l.ApprovedStatus = 0 OR l.ApprovedStatus IS NULL)');
  }

  const [rows] = await pool.query(
    `${LIST_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY l.ApprovedStatus ASC, l.EntryDate DESC`,
    params
  );
  res.json({ loans: rows.map((l) => withFlags(req.user, l)) });
}));

// ── GET /stats  –  counts (must be declared before /:loanNo) ─────────────────

router.get('/stats', requirePermission('loan.approve'), wrap(async (req, res) => {
  const where  = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('l.BranchID = ?');
    params.push(req.user.branch.code);
  }

  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(COALESCE(l.ApprovedStatus, 0) = 0), 0) AS pending
       FROM loandetail l
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`,
    params
  );
  res.json({ total: Number(row.total), pending: Number(row.pending) });
}));

// ── GET /:loanNo  –  full detail ──────────────────────────────────────────────

router.get('/:loanNo', requirePermission('loan.view'), wrap(async (req, res) => {
  const loan = await getLoan(req.params.loanNo);
  if (!loan || !inScope(req.user, loan)) {
    return res.status(404).json({ message: 'Loan not found' });
  }

  // Fetch related records in parallel
  const [[dhitoRows], [sakshiRows]] = await Promise.all([
    pool.query('SELECT * FROM dhitojamanidetail WHERE LoanNo = ?', [loan.LoanNo]),
    pool.query('SELECT * FROM sakshidetail       WHERE LoanNo = ?', [loan.LoanNo]),
  ]);

  res.json({
    loan: withFlags(req.user, {
      ...loan,
      dhitoItems:  dhitoRows,
      sakshiItems: sakshiRows,
    }),
  });
}));

// ── POST /  –  create ────────────────────────────────────────────────────────

router.post('/', requirePermission('loan.create'), wrap(async (req, res) => {
  const body = req.body || {};

  // Resolve branch: branch-scoped users use their own branch; all-access users may pass branch_id
  let branch = req.user.branch;
  if (canAccessAllBranches(req.user) && body.branch_id) {
    const [rows] = await pool.query(
      'SELECT id, code, name FROM branches WHERE id = ? AND is_active = 1',
      [Number(body.branch_id)]
    );
    if (!rows[0]) return res.status(422).json({ message: 'Choose an active branch' });
    branch = rows[0];
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Auto-generate LoanNo (retry up to 3 times in case of a race duplicate)
    let loanNo = null;
    for (let attempt = 0; attempt < 3 && !loanNo; attempt++) {
      const candidate = await nextLoanNo(branch.code);
      try {
        await conn.query(
          `INSERT INTO loandetail
             (MemberNo, MemberName, BusinessPAN, LoanNo,
              HasBusiness, BusinessName, IncomeSource, IncomeSourceRs,
              LoanType, LoanPurpose, LoanAmount,
              HasRateOfInterest, RateOfInterest,
              LoanPeriodYear, LoanPeriodMonth, LoanKista,
              HasDepositJamani,
              JamaniMemberNo, JamaniName, JamaniGrandFatherName,
              JamaniFatherName, JamaniSpouseName,
              JamaniProvince, JamaniDistrict, JamaniVDCMUN,
              JamaniWardNo, JamaniDOB, JamaniType, JamaniTypeRs,
              HasDhitoJamani, HasSakshi,
              BranchID, EntryDate, CreatedBy)
           VALUES
             (?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?,
              ?, ?,
              ?, ?, ?,
              ?,
              ?, ?, ?,
              ?, ?,
              ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?,
              ?, ?, ?)`,
          [
            body.MemberNo       || null,
            body.MemberName     || null,
            body.BusinessPAN    || null,
            candidate,
            body.HasBusiness    ? 1 : 0,
            body.BusinessName   || null,
            body.IncomeSource   || null,
            body.IncomeSourceRs || null,
            body.LoanType       || null,
            body.LoanPurpose    || null,
            body.LoanAmount     || null,
            body.HasRateOfInterest ? 1 : 0,
            body.RateOfInterest || null,
            body.LoanPeriodYear  || null,
            body.LoanPeriodMonth || null,
            body.LoanKista       || null,
            body.HasDepositJamani ? 1 : 0,
            body.JamaniMemberNo        || null,
            body.JamaniName            || null,
            body.JamaniGrandFatherName || null,
            body.JamaniFatherName      || null,
            body.JamaniSpouseName      || null,
            body.JamaniProvince        || null,
            body.JamaniDistrict        || null,
            body.JamaniVDCMUN          || null,
            body.JamaniWardNo          || null,
            body.JamaniDOB             || null,
            body.JamaniType            || null,
            body.JamaniTypeRs          || null,
            body.HasDhitoJamani ? 1 : 0,
            body.HasSakshi      ? 1 : 0,
            branch.code,
            body.EntryDate || null,
            req.user.id,
          ]
        );
        loanNo = candidate;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e; // race condition — try next number
      }
    }
    if (!loanNo) {
      await conn.rollback();
      return res.status(409).json({ message: 'Could not generate a loan number. Try again.' });
    }

    // Dhito jamani items
    if (body.HasDhitoJamani && Array.isArray(body.dhitoItems) && body.dhitoItems.length) {
      for (const item of body.dhitoItems) {
        await conn.query(
          `INSERT INTO dhitojamanidetail
             (MemberNo, LoanNo, DhitoPerson, DhitoFather, DhitoSpouse,
              DhitoType, DhitoProvince, DhitoDistrict, DhitoVDCMUN,
              DhitoWardNo, DhitoBlockNo, DhitoKittaNo, DhitoArea, Remarks, BranchID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            body.MemberNo          || null,
            loanNo,
            item.DhitoPerson       || null,
            item.DhitoFather       || null,
            item.DhitoSpouse       || null,
            item.DhitoType         || null,
            item.DhitoProvince     || null,
            item.DhitoDistrict     || null,
            item.DhitoVDCMUN       || null,
            item.DhitoWardNo       || null,
            item.DhitoBlockNo      || null,
            item.DhitoKittaNo      || null,
            item.DhitoArea         || null,
            item.Remarks           || null,
            branch.code,
          ]
        );
      }
    }

    // Sakshi items
    if (body.HasSakshi && Array.isArray(body.sakshiItems) && body.sakshiItems.length) {
      for (const item of body.sakshiItems) {
        await conn.query(
          `INSERT INTO sakshidetail
             (MemberNo, LoanNo, SakshiPerson, SakshiProvince, SakshiDistrict,
              SakshiVDCMUN, SakshiWardNo, SakshiAge, BranchID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            body.MemberNo          || null,
            loanNo,
            item.SakshiPerson      || null,
            item.SakshiProvince    || null,
            item.SakshiDistrict    || null,
            item.SakshiVDCMUN      || null,
            item.SakshiWardNo      || null,
            item.SakshiAge         || null,
            branch.code,
          ]
        );
      }
    }

    await conn.commit();
    const loan = await getLoan(loanNo);
    res.status(201).json({ loan: withFlags(req.user, loan) });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// ── PUT /:loanNo  –  update ───────────────────────────────────────────────────

router.put('/:loanNo', requirePermission('loan.edit'), wrap(async (req, res) => {
  const loan = await getLoan(req.params.loanNo);
  if (!loan || !inScope(req.user, loan)) {
    return res.status(404).json({ message: 'Loan not found' });
  }
  if (loan.ApprovedStatus && !req.user.permissions.includes('loan.approve')) {
    return res.status(403).json({ message: 'An approved loan can only be changed by someone who can approve loans' });
  }

  const body = req.body || {};
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE loandetail SET
         MemberNo = ?, MemberName = ?, BusinessPAN = ?,
         HasBusiness = ?, BusinessName = ?, IncomeSource = ?, IncomeSourceRs = ?,
         LoanType = ?, LoanPurpose = ?, LoanAmount = ?,
         HasRateOfInterest = ?, RateOfInterest = ?,
         LoanPeriodYear = ?, LoanPeriodMonth = ?, LoanKista = ?,
         HasDepositJamani = ?,
         JamaniMemberNo = ?, JamaniName = ?, JamaniGrandFatherName = ?,
         JamaniFatherName = ?, JamaniSpouseName = ?,
         JamaniProvince = ?, JamaniDistrict = ?, JamaniVDCMUN = ?,
         JamaniWardNo = ?, JamaniDOB = ?, JamaniType = ?, JamaniTypeRs = ?,
         HasDhitoJamani = ?, HasSakshi = ?,
         EntryDate = ?
       WHERE LoanNo = ?`,
      [
        body.MemberNo       || null,
        body.MemberName     || null,
        body.BusinessPAN    || null,
        body.HasBusiness    ? 1 : 0,
        body.BusinessName   || null,
        body.IncomeSource   || null,
        body.IncomeSourceRs || null,
        body.LoanType       || null,
        body.LoanPurpose    || null,
        body.LoanAmount     || null,
        body.HasRateOfInterest ? 1 : 0,
        body.RateOfInterest    || null,
        body.LoanPeriodYear    || null,
        body.LoanPeriodMonth   || null,
        body.LoanKista         || null,
        body.HasDepositJamani  ? 1 : 0,
        body.JamaniMemberNo        || null,
        body.JamaniName            || null,
        body.JamaniGrandFatherName || null,
        body.JamaniFatherName      || null,
        body.JamaniSpouseName      || null,
        body.JamaniProvince        || null,
        body.JamaniDistrict        || null,
        body.JamaniVDCMUN          || null,
        body.JamaniWardNo          || null,
        body.JamaniDOB             || null,
        body.JamaniType            || null,
        body.JamaniTypeRs          || null,
        body.HasDhitoJamani ? 1 : 0,
        body.HasSakshi      ? 1 : 0,
        body.EntryDate      || null,
        loan.LoanNo,
      ]
    );

    // Replace dhito records
    await conn.query('DELETE FROM dhitojamanidetail WHERE LoanNo = ?', [loan.LoanNo]);
    if (body.HasDhitoJamani && Array.isArray(body.dhitoItems) && body.dhitoItems.length) {
      for (const item of body.dhitoItems) {
        await conn.query(
          `INSERT INTO dhitojamanidetail
             (MemberNo, LoanNo, DhitoPerson, DhitoFather, DhitoSpouse,
              DhitoType, DhitoProvince, DhitoDistrict, DhitoVDCMUN,
              DhitoWardNo, DhitoBlockNo, DhitoKittaNo, DhitoArea, Remarks, BranchID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            body.MemberNo || loan.MemberNo || null,
            loan.LoanNo,
            item.DhitoPerson    || null,
            item.DhitoFather    || null,
            item.DhitoSpouse    || null,
            item.DhitoType      || null,
            item.DhitoProvince  || null,
            item.DhitoDistrict  || null,
            item.DhitoVDCMUN    || null,
            item.DhitoWardNo    || null,
            item.DhitoBlockNo   || null,
            item.DhitoKittaNo   || null,
            item.DhitoArea      || null,
            item.Remarks        || null,
            loan.BranchID,
          ]
        );
      }
    }

    // Replace sakshi records
    await conn.query('DELETE FROM sakshidetail WHERE LoanNo = ?', [loan.LoanNo]);
    if (body.HasSakshi && Array.isArray(body.sakshiItems) && body.sakshiItems.length) {
      for (const item of body.sakshiItems) {
        await conn.query(
          `INSERT INTO sakshidetail
             (MemberNo, LoanNo, SakshiPerson, SakshiProvince, SakshiDistrict,
              SakshiVDCMUN, SakshiWardNo, SakshiAge, BranchID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            body.MemberNo || loan.MemberNo || null,
            loan.LoanNo,
            item.SakshiPerson   || null,
            item.SakshiProvince || null,
            item.SakshiDistrict || null,
            item.SakshiVDCMUN   || null,
            item.SakshiWardNo   || null,
            item.SakshiAge      || null,
            loan.BranchID,
          ]
        );
      }
    }

    await conn.commit();
    const updated = await getLoan(loan.LoanNo);
    res.json({ loan: withFlags(req.user, updated) });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// ── POST /:loanNo/approve ─────────────────────────────────────────────────────

router.post('/:loanNo/approve', requirePermission('loan.approve'), wrap(async (req, res) => {
  const loan = await getLoan(req.params.loanNo);
  if (!loan || !inScope(req.user, loan)) {
    return res.status(404).json({ message: 'Loan not found' });
  }
  if (loan.ApprovedStatus === 1) {
    return res.status(409).json({ message: 'This loan is already approved' });
  }

  await pool.query(
    'UPDATE loandetail SET ApprovedStatus = 1, ApprovedBy = ? WHERE LoanNo = ?',
    [req.user.name, loan.LoanNo]
  );
  const updated = await getLoan(loan.LoanNo);
  res.json({ loan: withFlags(req.user, updated) });
}));

// ── DELETE /:loanNo ───────────────────────────────────────────────────────────

router.delete('/:loanNo', requirePermission('loan.delete'), wrap(async (req, res) => {
  const loan = await getLoan(req.params.loanNo);
  if (!loan || !inScope(req.user, loan)) {
    return res.status(404).json({ message: 'Loan not found' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM dhitojamanidetail WHERE LoanNo = ?', [loan.LoanNo]);
    await conn.query('DELETE FROM sakshidetail       WHERE LoanNo = ?', [loan.LoanNo]);
    await conn.query('DELETE FROM loandetail          WHERE LoanNo = ?', [loan.LoanNo]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

export default router;
