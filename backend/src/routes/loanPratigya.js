import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';
import { notify, usersWithPermission } from '../utils/notify.js';

const router = Router();
router.use(authenticate);

// SQL to fetch loan pratigya list with member and loan info
const LIST_SELECT = `
  SELECT lp.id, lp.MemberNo, lp.LoanNo, lp.EntryDate, lp.RateOfInterest,
         lp.Day1, lp.Day2, lp.AddInterest1, lp.Day3, lp.Day4, lp.AddInterest2,
         lp.Day5, lp.Day6, lp.AddInterest3,
         lp.KistaDay1, lp.Fine1, lp.KistaDay2, lp.Fine2, lp.KistaDay3, lp.Fine3,
         lp.ChangeableInterest,
         lp.StaffID, lp.StaffName, lp.StaffPost,
         lp.ApprovedStatus, lp.ApprovedBy, lp.ApprovedAt, lp.BranchID,
         m.FullName AS MemberName, l.LoanType, l.LoanAmount,
         b.name AS branch_name
    FROM loanpratigyas lp
    LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = lp.MemberNo COLLATE utf8mb4_general_ci
    LEFT JOIN loandetail l ON l.LoanNo COLLATE utf8mb4_general_ci = lp.LoanNo COLLATE utf8mb4_general_ci
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = lp.BranchID COLLATE utf8mb4_general_ci`;

const inScope = (user, item) =>
  canAccessAllBranches(user) || item.BranchID === user.branch?.code;

const withFlags = (user, item) => ({
  ...item,
  can_edit: !item.ApprovedStatus || user.permissions.includes('loanpratigya.approve'),
  can_delete: user.permissions.includes('loanpratigya.delete'),
});

// Helper: full composite detail needed for view/print
async function getLoanPratigyaData(id) {
  const [rows] = await pool.query(
    `SELECT lp.*, b.name AS branch_name, b.id AS branch_table_id
       FROM loanpratigyas lp
       LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = lp.BranchID COLLATE utf8mb4_general_ci
      WHERE lp.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const pratigya = rows[0];

  // Fetch Member Detail
  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [pratigya.MemberNo]);
  const member = memberRows[0] || {};

  // Fetch Loan Detail
  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [pratigya.LoanNo]);
  const loan = loanRows[0] || {};

  // Enterprise / Organization details
  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const enterprise = orgRows[0] || {};

  // Branch
  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [pratigya.BranchID || member.BranchID || '']);
  const branch = branchRows[0] || {};

  // Staffs in this branch
  let staffs = [];
  if (branch.id) {
    const [sRows] = await pool.query('SELECT staffno, name, name_eng, post FROM staffs WHERE branch_id = ?', [branch.id]);
    staffs = sRows;
  } else {
    const [sRows] = await pool.query('SELECT staffno, name, name_eng, post FROM staffs');
    staffs = sRows;
  }

  const posts = [...new Set(staffs.map((s) => s.post).filter(Boolean))];

  return {
    pratigya,
    member,
    loan,
    enterprise,
    branch,
    staffs,
    posts,
  };
}

// ── GET /  –  List loan pratigyas ───────────────────────────────────────────
router.get('/', requirePermission('loanpratigya.view'), wrap(async (req, res) => {
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('lp.BranchID = ?');
    params.push(req.user.branch.code);
  }
  if (req.query.status === 'PENDING') {
    where.push('(lp.ApprovedStatus = 0 OR lp.ApprovedStatus IS NULL)');
  }
  if (req.query.member) {
    where.push('lp.MemberNo = ?');
    params.push(req.query.member);
  }

  const [rows] = await pool.query(
    `${LIST_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY lp.ApprovedStatus ASC, lp.id DESC`,
    params
  );

  res.json({
    loanPratigyas: rows.map((r) => withFlags(req.user, r)),
  });
}));

// ── GET /stats  –  Pending counts ───────────────────────────────────────────
router.get('/stats', requirePermission('loanpratigya.view'), wrap(async (req, res) => {
  const where = [];
  const params = [];
  if (!canAccessAllBranches(req.user)) {
    where.push('BranchID = ?');
    params.push(req.user.branch.code);
  }

  const branchClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN ApprovedStatus = 0 OR ApprovedStatus IS NULL THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN ApprovedStatus = 1 THEN 1 ELSE 0 END) AS approved
      FROM loanpratigyas ${branchClause}`,
    params
  );

  res.json({
    total: Number(rows[0]?.total || 0),
    pending: Number(rows[0]?.pending || 0),
    approved: Number(rows[0]?.approved || 0),
  });
}));

// ── GET /options/members  –  Members who have loans ─────────────────────────
router.get('/options/members', requirePermission('loanpratigya.create'), wrap(async (req, res) => {
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('m.BranchID = ?');
    params.push(req.user.branch.code);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT DISTINCT m.MemberNo, m.FullName, m.BranchID
       FROM memberdetail m
       INNER JOIN loandetail l ON l.MemberNo COLLATE utf8mb4_general_ci = m.MemberNo COLLATE utf8mb4_general_ci
      ${whereClause}
      ORDER BY m.FullName ASC`,
    params
  );

  res.json({ members: rows });
}));

// ── GET /options/loans/:memberNo  –  Loans for a member ────────────────────
router.get('/options/loans/:memberNo', requirePermission('loanpratigya.create'), wrap(async (req, res) => {
  const { memberNo } = req.params;
  const [rows] = await pool.query(
    `SELECT l.LoanNo, l.LoanType, l.LoanAmount, l.RateOfInterest, l.EntryDate
       FROM loandetail l
      WHERE l.MemberNo = ?
      ORDER BY l.id DESC`,
    [memberNo]
  );
  res.json({ loans: rows });
}));

// ── GET /context/:memberNo/:loanNo  –  Pre-fill context for form ────────────
router.get('/context/:memberNo/:loanNo', requirePermission('loanpratigya.create'), wrap(async (req, res) => {
  const { memberNo, loanNo } = req.params;

  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [memberNo]);
  const member = memberRows[0] || null;

  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [loanNo]);
  const loan = loanRows[0] || null;

  // Enterprise details
  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const enterprise = orgRows[0] || {};

  // Branch & staff
  const branchCode = member?.BranchID || req.user.branch?.code || '';
  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [branchCode]);
  const branch = branchRows[0] || {};

  let staffs = [];
  if (branch.id) {
    const [sRows] = await pool.query('SELECT staffno, name, name_eng, post FROM staffs WHERE branch_id = ?', [branch.id]);
    staffs = sRows;
  } else {
    const [sRows] = await pool.query('SELECT staffno, name, name_eng, post FROM staffs');
    staffs = sRows;
  }

  const posts = [...new Set(staffs.map((s) => s.post).filter(Boolean))];

  res.json({
    member,
    loan,
    enterprise,
    branch,
    staffs,
    posts,
  });
}));

// ── GET /:id  –  Fetch single loan pratigya detail ──────────────────────────
router.get('/:id', requirePermission('loanpratigya.view'), wrap(async (req, res) => {
  const data = await getLoanPratigyaData(req.params.id);
  if (!data) return res.status(404).json({ message: 'ऋणको प्रतिज्ञा पत्र फेला परेन।' });

  if (!inScope(req.user, data.pratigya)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण हेर्ने अधिकार छैन।' });
  }

  res.json({
    ...data,
    can_edit: !data.pratigya.ApprovedStatus || req.user.permissions.includes('loanpratigya.approve'),
    can_delete: req.user.permissions.includes('loanpratigya.delete'),
    can_approve: req.user.permissions.includes('loanpratigya.approve') && !data.pratigya.ApprovedStatus,
  });
}));

// ── POST /  –  Create loan pratigya record ───────────────────────────────────
router.post('/', requirePermission('loanpratigya.create'), wrap(async (req, res) => {
  const {
    MemberNo,
    LoanNo,
    EntryDate,
    RateOfInterest,
    Day1,
    Day2,
    AddInterest1,
    Day3,
    Day4,
    AddInterest2,
    Day5,
    Day6,
    AddInterest3,
    KistaDay1,
    Fine1,
    KistaDay2,
    Fine2,
    KistaDay3,
    Fine3,
    ChangeableInterest,
    StaffID,
    StaffName,
    StaffPost,
    Remarks,
  } = req.body;

  if (!MemberNo || !LoanNo) {
    return res.status(400).json({ message: 'सदस्यता नं. र ऋण नं. अनिवार्य छन्।' });
  }

  const [memberRows] = await pool.query('SELECT BranchID FROM memberdetail WHERE MemberNo = ?', [MemberNo]);
  const branchId = memberRows[0]?.BranchID || req.user.branch?.code || null;

  // Resolve branch table id for notifications
  const [bRows] = await pool.query('SELECT id, name FROM branches WHERE code = ?', [branchId]);
  const branchTableId = bRows[0]?.id || req.user.branch?.id || null;
  const branchName = bRows[0]?.name || req.user.branch?.name || '';

  const [result] = await pool.query(
    `INSERT INTO loanpratigyas (
       MemberNo, LoanNo, EntryDate, RateOfInterest,
       Day1, Day2, AddInterest1, Day3, Day4, AddInterest2, Day5, Day6, AddInterest3,
       KistaDay1, Fine1, KistaDay2, Fine2, KistaDay3, Fine3,
       ChangeableInterest,
       StaffID, StaffName, StaffPost, Remarks,
       BranchID, CreatedBy, CreatedByName
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      MemberNo,
      LoanNo,
      EntryDate || null,
      RateOfInterest || null,
      Day1 || null,
      Day2 || null,
      AddInterest1 || null,
      Day3 || null,
      Day4 || null,
      AddInterest2 || null,
      Day5 || null,
      Day6 || null,
      AddInterest3 || null,
      KistaDay1 || null,
      Fine1 || null,
      KistaDay2 || null,
      Fine2 || null,
      KistaDay3 || null,
      Fine3 || null,
      ChangeableInterest || null,
      StaffID || null,
      StaffName || null,
      StaffPost || null,
      Remarks || null,
      branchId,
      req.user.id,
      req.user.name || req.user.email,
    ]
  );

  const pratigyaId = result.insertId;

  // Dispatch Notification to approvers
  try {
    const approverIds = await usersWithPermission('loanpratigya.approve', req.user.id, branchTableId);
    if (approverIds.length > 0) {
      await notify(approverIds, {
        type: 'loanpratigya.submitted',
        title: 'नयाँ प्रतिज्ञा पत्र प्रमाणीकरणको लागि',
        body: `ऋण नं. ${LoanNo} (सदस्य नं. ${MemberNo}) को प्रतिज्ञा पत्र ${req.user.name} द्वारा दर्ता गरियो (${branchName})`,
        link: `/loan/pratigya/${pratigyaId}`,
      });
    }
  } catch (err) {
    console.error('Notification dispatch error:', err);
  }

  res.status(201).json({
    id: pratigyaId,
    message: 'ऋणको प्रतिज्ञा पत्र सफलतापूर्वक दर्ता भयो।',
  });
}));

// ── PUT /:id  –  Update loan pratigya record ─────────────────────────────────
router.put('/:id', requirePermission('loanpratigya.edit'), wrap(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM loanpratigyas WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'ऋणको प्रतिज्ञा पत्र फेला परेन।' });

  const existing = rows[0];
  if (!inScope(req.user, existing)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण सम्पादन गर्ने अधिकार छैन।' });
  }

  if (existing.ApprovedStatus && !req.user.permissions.includes('loanpratigya.approve')) {
    return res.status(400).json({ message: 'स्वीकृत भइसकेको विवरण सम्पादन गर्न सकिँदैन।' });
  }

  const {
    MemberNo,
    LoanNo,
    EntryDate,
    RateOfInterest,
    Day1,
    Day2,
    AddInterest1,
    Day3,
    Day4,
    AddInterest2,
    Day5,
    Day6,
    AddInterest3,
    KistaDay1,
    Fine1,
    KistaDay2,
    Fine2,
    KistaDay3,
    Fine3,
    ChangeableInterest,
    StaffID,
    StaffName,
    StaffPost,
    Remarks,
  } = req.body;

  await pool.query(
    `UPDATE loanpratigyas SET
       MemberNo = ?,
       LoanNo = ?,
       EntryDate = ?,
       RateOfInterest = ?,
       Day1 = ?, Day2 = ?, AddInterest1 = ?,
       Day3 = ?, Day4 = ?, AddInterest2 = ?,
       Day5 = ?, Day6 = ?, AddInterest3 = ?,
       KistaDay1 = ?, Fine1 = ?,
       KistaDay2 = ?, Fine2 = ?,
       KistaDay3 = ?, Fine3 = ?,
       ChangeableInterest = ?,
       StaffID = ?, StaffName = ?, StaffPost = ?,
       Remarks = ?
     WHERE id = ?`,
    [
      MemberNo || existing.MemberNo,
      LoanNo || existing.LoanNo,
      EntryDate || existing.EntryDate,
      RateOfInterest !== undefined ? RateOfInterest : existing.RateOfInterest,
      Day1 !== undefined ? Day1 : existing.Day1,
      Day2 !== undefined ? Day2 : existing.Day2,
      AddInterest1 !== undefined ? AddInterest1 : existing.AddInterest1,
      Day3 !== undefined ? Day3 : existing.Day3,
      Day4 !== undefined ? Day4 : existing.Day4,
      AddInterest2 !== undefined ? AddInterest2 : existing.AddInterest2,
      Day5 !== undefined ? Day5 : existing.Day5,
      Day6 !== undefined ? Day6 : existing.Day6,
      AddInterest3 !== undefined ? AddInterest3 : existing.AddInterest3,
      KistaDay1 !== undefined ? KistaDay1 : existing.KistaDay1,
      Fine1 !== undefined ? Fine1 : existing.Fine1,
      KistaDay2 !== undefined ? KistaDay2 : existing.KistaDay2,
      Fine2 !== undefined ? Fine2 : existing.Fine2,
      KistaDay3 !== undefined ? KistaDay3 : existing.KistaDay3,
      Fine3 !== undefined ? Fine3 : existing.Fine3,
      ChangeableInterest !== undefined ? ChangeableInterest : existing.ChangeableInterest,
      StaffID !== undefined ? StaffID : existing.StaffID,
      StaffName !== undefined ? StaffName : existing.StaffName,
      StaffPost !== undefined ? StaffPost : existing.StaffPost,
      Remarks !== undefined ? Remarks : existing.Remarks,
      id,
    ]
  );

  res.json({ message: 'ऋणको प्रतिज्ञा पत्र सफलतापूर्वक अद्यावधिक भयो।' });
}));

// ── POST /:id/approve  –  Approve loan pratigya ─────────────────────────────
router.post('/:id/approve', requirePermission('loanpratigya.approve'), wrap(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM loanpratigyas WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'ऋणको प्रतिज्ञा पत्र फेला परेन।' });

  const existing = rows[0];
  if (!inScope(req.user, existing)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण प्रमाणित गर्ने अधिकार छैन।' });
  }

  await pool.query(
    `UPDATE loanpratigyas SET
       ApprovedStatus = 1,
       ApprovedBy = ?,
       ApprovedAt = NOW()
     WHERE id = ?`,
    [req.user.name || req.user.email, id]
  );

  // Send Notification to creator
  if (existing.CreatedBy && existing.CreatedBy !== req.user.id) {
    try {
      await notify([existing.CreatedBy], {
        type: 'loanpratigya.approved',
        title: 'ऋणको प्रतिज्ञा पत्र प्रमाणित भयो',
        body: `ऋण नं. ${existing.LoanNo} को प्रतिज्ञा पत्र ${req.user.name} द्वारा प्रमाणित/स्वीकृत गरियो।`,
        link: `/loan/pratigya/${id}`,
      });
    } catch (err) {
      console.error('Approval notification error:', err);
    }
  }

  res.json({ message: 'ऋणको प्रतिज्ञा पत्र सफलतापूर्वक स्वीकृत/प्रमाणित गरियो।' });
}));

// ── DELETE /:id  –  Delete loan pratigya record ─────────────────────────────
router.delete('/:id', requirePermission('loanpratigya.delete'), wrap(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM loanpratigyas WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'ऋणको प्रतिज्ञा पत्र फेला परेन।' });

  if (!inScope(req.user, rows[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण मेटाउने अधिकार छैन।' });
  }

  await pool.query('DELETE FROM loanpratigyas WHERE id = ?', [id]);
  res.json({ message: 'ऋणको प्रतिज्ञा पत्र सफलतापूर्वक मेटाइयो।' });
}));

export default router;

