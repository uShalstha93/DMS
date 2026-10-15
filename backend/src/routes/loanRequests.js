import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

// SQL to fetch loan request with member and loan info
const LIST_SELECT = `
  SELECT lr.id, lr.MemberNo, lr.LoanNo, lr.EntryDate, lr.IncomeSource, lr.TotalShareAmount,
         lr.Sifarish8LoanAmount, lr.Sifarish9LoanAmount, lr.UpasamitiApprovedLoanAmount,
         lr.SanchalakApprovedLoanAmount, lr.ApprovedStatus, lr.ApprovedBy, lr.BranchID,
         m.FullName AS MemberName, l.LoanType, l.LoanAmount,
         b.name AS branch_name
    FROM loanrequests lr
    LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = lr.MemberNo COLLATE utf8mb4_general_ci
    LEFT JOIN loandetail l ON l.LoanNo COLLATE utf8mb4_general_ci = lr.LoanNo COLLATE utf8mb4_general_ci
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = lr.BranchID COLLATE utf8mb4_general_ci`;

const inScope = (user, item) =>
  canAccessAllBranches(user) || item.BranchID === user.branch.code;

const withFlags = (user, item) => ({
  ...item,
  can_edit: !item.ApprovedStatus || user.permissions.includes('loanrequest.approve'),
  can_delete: user.permissions.includes('loanrequest.delete'),
});

// Helper: full composite detail needed for view/print
async function getLoanRequestData(id) {
  const [rows] = await pool.query(
    `SELECT lr.*, b.name AS branch_name
       FROM loanrequests lr
       LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = lr.BranchID COLLATE utf8mb4_general_ci
      WHERE lr.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const request = rows[0];

  // Fetch Member Detail
  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [request.MemberNo]);
  const member = memberRows[0] || {};

  // Fetch Loan Detail
  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [request.LoanNo]);
  const loan = loanRows[0] || {};

  // Fetch Dhito Detail
  const [dhitoRows] = await pool.query('SELECT * FROM dhitojamanidetail WHERE LoanNo = ?', [request.LoanNo]);

  // Fetch Sakshi Detail
  const [sakshiRows] = await pool.query('SELECT * FROM sakshidetail WHERE LoanNo = ?', [request.LoanNo]);

  // Enterprise details (from branch or first branch)
  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [request.BranchID || member.BranchID || '']);
  const branch = branchRows[0] || {};

  // Staffs in this branch
  let staffs = [];
  if (branch.id) {
    const [sRows] = await pool.query('SELECT * FROM staffs WHERE branch_id = ?', [branch.id]);
    staffs = sRows;
  }

  return {
    request,
    member,
    loan,
    dhitoDetail: dhitoRows[0] || null,
    dhitoList: dhitoRows,
    sakshiList: sakshiRows,
    branch,
    staffs,
  };
}

// ── GET /  –  List loan requests ─────────────────────────────────────────────
router.get('/', requirePermission('loanrequest.view'), wrap(async (req, res) => {
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('lr.BranchID = ?');
    params.push(req.user.branch.code);
  }
  if (req.query.status === 'PENDING') {
    where.push('(lr.ApprovedStatus = 0 OR lr.ApprovedStatus IS NULL)');
  }
  if (req.query.member) {
    where.push('lr.MemberNo = ?');
    params.push(req.query.member);
  }

  const [rows] = await pool.query(
    `${LIST_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY lr.ApprovedStatus ASC, lr.id DESC`,
    params
  );
  res.json({ loanRequests: rows.map((r) => withFlags(req.user, r)) });
}));

// ── GET /stats  ──────────────────────────────────────────────────────────────
router.get('/stats', requirePermission('loanrequest.approve'), wrap(async (req, res) => {
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('BranchID = ?');
    params.push(req.user.branch.code);
  }

  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(COALESCE(ApprovedStatus, 0) = 0), 0) AS pending
       FROM loanrequests
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`,
    params
  );
  res.json({ total: Number(row.total), pending: Number(row.pending) });
}));

// ── GET /options/members  –  Members who have loans in user's branch ─────────
router.get('/options/members', requirePermission('loanrequest.create'), wrap(async (req, res) => {
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('m.BranchID = ?');
    params.push(req.user.branch.code);
  }

  const [rows] = await pool.query(
    `SELECT DISTINCT m.MemberNo, m.FullName, m.FullNameEng, m.MobileNo, m.BranchID
       FROM memberdetail m
       INNER JOIN loandetail l ON l.MemberNo COLLATE utf8mb4_general_ci = m.MemberNo COLLATE utf8mb4_general_ci
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY m.MemberNo ASC`,
    params
  );
  res.json({ members: rows });
}));

// ── GET /options/loans/:memberNo  –  Loans for a specific member ─────────────
router.get('/options/loans/:memberNo', requirePermission('loanrequest.create'), wrap(async (req, res) => {
  const where = ['l.MemberNo = ?'];
  const params = [req.params.memberNo];

  if (!canAccessAllBranches(req.user)) {
    where.push('l.BranchID = ?');
    params.push(req.user.branch.code);
  }

  const [rows] = await pool.query(
    `SELECT l.LoanNo, l.LoanType, l.LoanAmount, l.LoanPurpose, l.BranchID
       FROM loandetail l
      WHERE ${where.join(' AND ')}
      ORDER BY l.LoanNo DESC`,
    params
  );
  res.json({ loans: rows });
}));

// ── GET /context/:memberNo/:loanNo  –  Autofill context for entry/print ──────
router.get('/context/:memberNo/:loanNo', requirePermission('loanrequest.create', 'loanrequest.view'), wrap(async (req, res) => {
  const { memberNo, loanNo } = req.params;

  const [mRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [memberNo]);
  const [lRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [loanNo]);
  const [dRows] = await pool.query('SELECT * FROM dhitojamanidetail WHERE LoanNo = ?', [loanNo]);
  const [sRows] = await pool.query('SELECT * FROM sakshidetail WHERE LoanNo = ?', [loanNo]);

  const member = mRows[0] || null;
  const loan = lRows[0] || null;

  let branch = null;
  let staffs = [];
  const branchCode = loan?.BranchID || member?.BranchID || req.user.branch.code;
  if (branchCode) {
    const [bRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [branchCode]);
    branch = bRows[0] || null;
    if (branch?.id) {
      const [stRows] = await pool.query('SELECT * FROM staffs WHERE branch_id = ?', [branch.id]);
      staffs = stRows;
    }
  }

  res.json({
    member,
    loan,
    dhitoDetail: dRows[0] || null,
    dhitoList: dRows,
    sakshiList: sRows,
    branch,
    staffs,
  });
}));

// ── GET /:id  –  Get one loan request record with full composite info ────────
router.get('/:id', requirePermission('loanrequest.view'), wrap(async (req, res) => {
  const data = await getLoanRequestData(req.params.id);
  if (!data || !inScope(req.user, data.request)) {
    return res.status(404).json({ message: 'Loan request not found' });
  }
  res.json({
    ...data,
    request: withFlags(req.user, data.request),
  });
}));

// ── POST /  –  Save a new loan request ────────────────────────────────────────
router.post('/', requirePermission('loanrequest.create'), wrap(async (req, res) => {
  const b = req.body || {};

  if (!b.MemberNo?.trim()) return res.status(422).json({ message: 'Member number is required' });
  if (!b.LoanNo?.trim()) return res.status(422).json({ message: 'Loan number is required' });

  // Resolve branch
  let branchCode = req.user.branch.code;
  if (canAccessAllBranches(req.user) && b.BranchID) {
    branchCode = b.BranchID;
  }

  const [result] = await pool.query(
    `INSERT INTO loanrequests (
      MemberNo, LoanNo, EntryDate, IncomeSource, TotalShareAmount, TotalMonthlySaving,
      MonthlySavingRate, DepositUptoDate, RegularSaving, HasDailySaving, HasChildSaving,
      HasFixedSaving, HasOtherSaving, HasRemainingLoan, RemainingInterest, HasOptSavingTrans,
      HasGivenDhitoOrJamani, ConditionOfOldLoan, OtherCondition, Sifarish8LoanAmount,
      Sifarish8LoanDate, Sifarish9LoanAmount, Sifarish9LoanDate, UpasamitiMeetingDate,
      UpasamitiMeetingNo, UpasamitiApprovedLoanAmount, UpasamitiApprovedLoanDate,
      SanchalakMeetingDate, SanchalakMeetingNo, SanchalakApprovedLoanAmount,
      SanchalakApprovedLoanDate, BranchID, CreatedBy, CreatedByName
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?
    )`,
    [
      b.MemberNo.trim(),
      b.LoanNo.trim(),
      b.EntryDate || null,
      b.IncomeSource || null,
      b.TotalShareAmount || null,
      b.TotalMonthlySaving || null,
      b.MonthlySavingRate || null,
      b.DepositUptoDate || null,
      b.RegularSaving || null,
      b.HasDailySaving ? 1 : 0,
      b.HasChildSaving ? 1 : 0,
      b.HasFixedSaving ? 1 : 0,
      b.HasOtherSaving ? 1 : 0,
      b.HasRemainingLoan ? 1 : 0,
      b.RemainingInterest || null,
      b.HasOptSavingTrans ? 1 : 0,
      b.HasGivenDhitoOrJamani ? 1 : 0,
      b.ConditionOfOldLoan || null,
      b.OtherCondition || null,
      b.Sifarish8LoanAmount || null,
      b.Sifarish8LoanDate || null,
      b.Sifarish9LoanAmount || null,
      b.Sifarish9LoanDate || null,
      b.UpasamitiMeetingDate || null,
      b.UpasamitiMeetingNo || null,
      b.UpasamitiApprovedLoanAmount || null,
      b.UpasamitiApprovedLoanDate || null,
      b.SanchalakMeetingDate || null,
      b.SanchalakMeetingNo || null,
      b.SanchalakApprovedLoanAmount || null,
      b.SanchalakApprovedLoanDate || null,
      branchCode,
      req.user.id,
      req.user.name,
    ]
  );

  const fullData = await getLoanRequestData(result.insertId);
  res.status(201).json({
    message: 'Loan request saved successfully',
    id: result.insertId,
    loanRequest: withFlags(req.user, fullData.request),
    ...fullData,
  });
}));

// ── PUT /:id  –  Update an existing loan request ─────────────────────────────
router.put('/:id', requirePermission('loanrequest.edit'), wrap(async (req, res) => {
  const [exists] = await pool.query('SELECT * FROM loanrequests WHERE id = ?', [req.params.id]);
  const current = exists[0];
  if (!current || !inScope(req.user, current)) {
    return res.status(404).json({ message: 'Loan request not found' });
  }

  if (current.ApprovedStatus && !req.user.permissions.includes('loanrequest.approve')) {
    return res.status(403).json({ message: 'An approved loan request can only be modified by an approver' });
  }

  const b = req.body || {};

  await pool.query(
    `UPDATE loanrequests SET
      MemberNo = ?, LoanNo = ?, EntryDate = ?, IncomeSource = ?, TotalShareAmount = ?,
      TotalMonthlySaving = ?, MonthlySavingRate = ?, DepositUptoDate = ?, RegularSaving = ?,
      HasDailySaving = ?, HasChildSaving = ?, HasFixedSaving = ?, HasOtherSaving = ?,
      HasRemainingLoan = ?, RemainingInterest = ?, HasOptSavingTrans = ?,
      HasGivenDhitoOrJamani = ?, ConditionOfOldLoan = ?, OtherCondition = ?,
      Sifarish8LoanAmount = ?, Sifarish8LoanDate = ?, Sifarish9LoanAmount = ?,
      Sifarish9LoanDate = ?, UpasamitiMeetingDate = ?, UpasamitiMeetingNo = ?,
      UpasamitiApprovedLoanAmount = ?, UpasamitiApprovedLoanDate = ?,
      SanchalakMeetingDate = ?, SanchalakMeetingNo = ?,
      SanchalakApprovedLoanAmount = ?, SanchalakApprovedLoanDate = ?
    WHERE id = ?`,
    [
      b.MemberNo ? b.MemberNo.trim() : current.MemberNo,
      b.LoanNo ? b.LoanNo.trim() : current.LoanNo,
      b.EntryDate || null,
      b.IncomeSource || null,
      b.TotalShareAmount || null,
      b.TotalMonthlySaving || null,
      b.MonthlySavingRate || null,
      b.DepositUptoDate || null,
      b.RegularSaving || null,
      b.HasDailySaving ? 1 : 0,
      b.HasChildSaving ? 1 : 0,
      b.HasFixedSaving ? 1 : 0,
      b.HasOtherSaving ? 1 : 0,
      b.HasRemainingLoan ? 1 : 0,
      b.RemainingInterest || null,
      b.HasOptSavingTrans ? 1 : 0,
      b.HasGivenDhitoOrJamani ? 1 : 0,
      b.ConditionOfOldLoan || null,
      b.OtherCondition || null,
      b.Sifarish8LoanAmount || null,
      b.Sifarish8LoanDate || null,
      b.Sifarish9LoanAmount || null,
      b.Sifarish9LoanDate || null,
      b.UpasamitiMeetingDate || null,
      b.UpasamitiMeetingNo || null,
      b.UpasamitiApprovedLoanAmount || null,
      b.UpasamitiApprovedLoanDate || null,
      b.SanchalakMeetingDate || null,
      b.SanchalakMeetingNo || null,
      b.SanchalakApprovedLoanAmount || null,
      b.SanchalakApprovedLoanDate || null,
      current.id,
    ]
  );

  const fullData = await getLoanRequestData(current.id);
  res.json({
    message: 'Loan request updated successfully',
    id: current.id,
    loanRequest: withFlags(req.user, fullData.request),
    ...fullData,
  });
}));

// ── POST /:id/approve  –  Verify/Approve loan request ─────────────────────────
router.post('/:id/approve', requirePermission('loanrequest.approve'), wrap(async (req, res) => {
  const [exists] = await pool.query('SELECT * FROM loanrequests WHERE id = ?', [req.params.id]);
  const current = exists[0];
  if (!current || !inScope(req.user, current)) {
    return res.status(404).json({ message: 'Loan request not found' });
  }

  if (current.ApprovedStatus === 1) {
    return res.status(409).json({ message: 'This loan request is already verified/approved' });
  }

  await pool.query(
    'UPDATE loanrequests SET ApprovedStatus = 1, ApprovedBy = ?, ApprovedAt = NOW() WHERE id = ?',
    [req.user.name, current.id]
  );

  const fullData = await getLoanRequestData(current.id);
  res.json({
    message: 'Loan request verified successfully',
    loanRequest: withFlags(req.user, fullData.request),
    ...fullData,
  });
}));

// ── DELETE /:id  –  Delete loan request ───────────────────────────────────────
router.delete('/:id', requirePermission('loanrequest.delete'), wrap(async (req, res) => {
  const [exists] = await pool.query('SELECT * FROM loanrequests WHERE id = ?', [req.params.id]);
  const current = exists[0];
  if (!current || !inScope(req.user, current)) {
    return res.status(404).json({ message: 'Loan request not found' });
  }

  await pool.query('DELETE FROM loanrequests WHERE id = ?', [current.id]);
  res.json({ ok: true, message: 'Loan request deleted' });
}));

export default router;

