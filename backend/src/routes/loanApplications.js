import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);

// SQL to fetch loan application with member and loan info
const LIST_SELECT = `
  SELECT la.id, la.MemberNo, la.LoanNo, la.EntryDate, la.RateOfInterest, la.MeetingNo,
         la.LoanAmount, la.StaffPost, la.StaffName, la.ApprovedStatus, la.ApprovedBy, la.BranchID,
         m.FullName AS MemberName, l.LoanType,
         b.name AS branch_name
    FROM loanapplications la
    LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = la.MemberNo COLLATE utf8mb4_general_ci
    LEFT JOIN loandetail l ON l.LoanNo COLLATE utf8mb4_general_ci = la.LoanNo COLLATE utf8mb4_general_ci
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = la.BranchID COLLATE utf8mb4_general_ci`;

const inScope = (user, item) =>
  canAccessAllBranches(user) || item.BranchID === user.branch?.code;

const withFlags = (user, item) => ({
  ...item,
  can_edit: !item.ApprovedStatus || user.permissions.includes('loanapplication.approve'),
  can_delete: user.permissions.includes('loanapplication.delete'),
});

// Helper: full composite detail needed for view/print
async function getLoanApplicationData(id) {
  const [rows] = await pool.query(
    `SELECT la.*, b.name AS branch_name
       FROM loanapplications la
       LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = la.BranchID COLLATE utf8mb4_general_ci
      WHERE la.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const application = rows[0];

  // Fetch Member Detail
  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [application.MemberNo]);
  const member = memberRows[0] || {};

  // Fetch Loan Detail
  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [application.LoanNo]);
  const loan = loanRows[0] || {};

  // Fetch Loan Request if exists for additional meeting details/entry dates
  const [reqRows] = await pool.query(
    'SELECT * FROM loanrequests WHERE LoanNo COLLATE utf8mb4_general_ci = ? COLLATE utf8mb4_general_ci LIMIT 1',
    [application.LoanNo]
  );
  const loanRequest = reqRows[0] || {};

  // Organization / Enterprise details
  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const enterprise = orgRows[0] || {};

  // Branch
  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [application.BranchID || member.BranchID || '']);
  const branch = branchRows[0] || {};

  // Staffs in this branch
  let staffs = [];
  if (branch.id) {
    const [sRows] = await pool.query('SELECT * FROM staffs WHERE branch_id = ?', [branch.id]);
    staffs = sRows;
  } else {
    const [sRows] = await pool.query('SELECT * FROM staffs');
    staffs = sRows;
  }

  return {
    application,
    member,
    loan,
    loanRequest,
    enterprise,
    branch,
    staffs,
  };
}

// ── GET /  –  List loan applications ─────────────────────────────────────────
router.get('/', requirePermission('loanapplication.view'), wrap(async (req, res) => {
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('la.BranchID = ?');
    params.push(req.user.branch.code);
  }
  if (req.query.status === 'PENDING') {
    where.push('(la.ApprovedStatus = 0 OR la.ApprovedStatus IS NULL)');
  }
  if (req.query.member) {
    where.push('la.MemberNo = ?');
    params.push(req.query.member);
  }

  const [rows] = await pool.query(
    `${LIST_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY la.ApprovedStatus ASC, la.id DESC`,
    params
  );

  res.json({
    loanApplications: rows.map((r) => withFlags(req.user, r)),
  });
}));

// ── GET /stats  –  Pending counts ───────────────────────────────────────────
router.get('/stats', requirePermission('loanapplication.view'), wrap(async (req, res) => {
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
      FROM loanapplications ${branchClause}`,
    params
  );

  res.json({
    total: Number(rows[0]?.total || 0),
    pending: Number(rows[0]?.pending || 0),
    approved: Number(rows[0]?.approved || 0),
  });
}));

// ── GET /options/members  –  Members who have loans ──────────────────────────
router.get('/options/members', requirePermission('loanapplication.create'), wrap(async (req, res) => {
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

// ── GET /options/loans/:memberNo  –  Loans for a member ─────────────────────
router.get('/options/loans/:memberNo', requirePermission('loanapplication.create'), wrap(async (req, res) => {
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

// ── GET /context/:memberNo/:loanNo  –  Pre-fill context for form ─────────────
router.get('/context/:memberNo/:loanNo', requirePermission('loanapplication.create'), wrap(async (req, res) => {
  const { memberNo, loanNo } = req.params;

  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [memberNo]);
  const member = memberRows[0] || null;

  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [loanNo]);
  const loan = loanRows[0] || null;

  // Find linked loan request if any (for meeting info and request date)
  const [requestRows] = await pool.query(
    'SELECT * FROM loanrequests WHERE LoanNo COLLATE utf8mb4_general_ci = ? COLLATE utf8mb4_general_ci LIMIT 1',
    [loanNo]
  );
  const loanRequest = requestRows[0] || null;

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

  // Distinct posts from staffs
  const posts = [...new Set(staffs.map((s) => s.post).filter(Boolean))];

  res.json({
    member,
    loan,
    loanRequest,
    enterprise,
    branch,
    staffs,
    posts,
  });
}));

// ── GET /:id  –  Fetch single application detail ─────────────────────────────
router.get('/:id', requirePermission('loanapplication.view'), wrap(async (req, res) => {
  const data = await getLoanApplicationData(req.params.id);
  if (!data) return res.status(404).json({ message: 'कर्जा प्रस्ताव फेला परेन।' });

  if (!inScope(req.user, data.application)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको कर्जा प्रस्ताव हेर्ने अधिकार छैन।' });
  }

  // Extract distinct staff posts for print / view edit
  const posts = [...new Set(data.staffs.map((s) => s.post).filter(Boolean))];

  res.json({
    ...data,
    posts,
    can_edit: !data.application.ApprovedStatus || req.user.permissions.includes('loanapplication.approve'),
    can_delete: req.user.permissions.includes('loanapplication.delete'),
    can_approve: req.user.permissions.includes('loanapplication.approve') && !data.application.ApprovedStatus,
  });
}));

// ── POST /  –  Create loan application ───────────────────────────────────────
router.post('/', requirePermission('loanapplication.create'), wrap(async (req, res) => {
  const {
    MemberNo,
    LoanNo,
    EntryDate,
    RateOfInterest,
    MeetingNo,
    LoanAmount,
    StaffPost,
    StaffName,
    Remarks,
  } = req.body;

  if (!MemberNo || !LoanNo) {
    return res.status(400).json({ message: 'सदस्यता नं. र ऋण नं. अनिवार्य छन्।' });
  }

  const [memberRows] = await pool.query('SELECT BranchID FROM memberdetail WHERE MemberNo = ?', [MemberNo]);
  const branchId = memberRows[0]?.BranchID || req.user.branch?.code || null;

  const [result] = await pool.query(
    `INSERT INTO loanapplications (
       MemberNo, LoanNo, EntryDate, RateOfInterest, MeetingNo, LoanAmount,
       StaffPost, StaffName, Remarks, BranchID, CreatedBy, CreatedByName
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      MemberNo,
      LoanNo,
      EntryDate || null,
      RateOfInterest || null,
      MeetingNo || null,
      LoanAmount || null,
      StaffPost || null,
      StaffName || null,
      Remarks || null,
      branchId,
      req.user.id,
      req.user.name || req.user.email,
    ]
  );

  res.status(201).json({
    id: result.insertId,
    message: 'कर्जा प्रस्ताव सफलतापूर्वक दर्ता भयो।',
  });
}));

// ── PUT /:id  –  Update loan application ─────────────────────────────────────
router.put('/:id', requirePermission('loanapplication.edit'), wrap(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM loanapplications WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'कर्जा प्रस्ताव फेला परेन।' });

  const existing = rows[0];
  if (!inScope(req.user, existing)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको कर्जा प्रस्ताव सम्पादन गर्ने अधिकार छैन।' });
  }

  if (existing.ApprovedStatus && !req.user.permissions.includes('loanapplication.approve')) {
    return res.status(400).json({ message: 'स्वीकृत भइसकेको कर्जा प्रस्ताव सम्पादन गर्न सकिँदैन।' });
  }

  const {
    MemberNo,
    LoanNo,
    EntryDate,
    RateOfInterest,
    MeetingNo,
    LoanAmount,
    StaffPost,
    StaffName,
    Remarks,
  } = req.body;

  await pool.query(
    `UPDATE loanapplications SET
       MemberNo = ?,
       LoanNo = ?,
       EntryDate = ?,
       RateOfInterest = ?,
       MeetingNo = ?,
       LoanAmount = ?,
       StaffPost = ?,
       StaffName = ?,
       Remarks = ?
     WHERE id = ?`,
    [
      MemberNo || existing.MemberNo,
      LoanNo || existing.LoanNo,
      EntryDate || existing.EntryDate,
      RateOfInterest || existing.RateOfInterest,
      MeetingNo || existing.MeetingNo,
      LoanAmount || existing.LoanAmount,
      StaffPost !== undefined ? StaffPost : existing.StaffPost,
      StaffName !== undefined ? StaffName : existing.StaffName,
      Remarks !== undefined ? Remarks : existing.Remarks,
      id,
    ]
  );

  res.json({ message: 'कर्जा प्रस्ताव सफलतापूर्वक अद्यावधिक भयो।' });
}));

// ── POST /:id/approve  –  Approve loan application ───────────────────────────
router.post('/:id/approve', requirePermission('loanapplication.approve'), wrap(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM loanapplications WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'कर्जा प्रस्ताव फेला परेन।' });

  const existing = rows[0];
  if (!inScope(req.user, existing)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको कर्जा प्रस्ताव प्रमाणित गर्ने अधिकार छैन।' });
  }

  await pool.query(
    `UPDATE loanapplications SET
       ApprovedStatus = 1,
       ApprovedBy = ?,
       ApprovedAt = NOW()
     WHERE id = ?`,
    [req.user.name || req.user.email, id]
  );

  res.json({ message: 'कर्जा प्रस्ताव सफलतापूर्वक स्वीकृत/प्रमाणित गरियो।' });
}));

// ── DELETE /:id  –  Delete loan application ──────────────────────────────────
router.delete('/:id', requirePermission('loanapplication.delete'), wrap(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM loanapplications WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'कर्जा प्रस्ताव फेला परेन।' });

  if (!inScope(req.user, rows[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको कर्जा प्रस्ताव मेटाउने अधिकार छैन।' });
  }

  await pool.query('DELETE FROM loanapplications WHERE id = ?', [id]);
  res.json({ message: 'कर्जा प्रस्ताव सफलतापूर्वक मेटाइयो।' });
}));

export default router;

