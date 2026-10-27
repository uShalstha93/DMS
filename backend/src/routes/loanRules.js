import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';
import { notify, usersWithPermission } from '../utils/notify.js';

const router = Router();
router.use(authenticate);

// SQL to fetch loan rules list with member and loan info
const LIST_SELECT = `
  SELECT lr.id, lr.MemberNo, lr.LoanNo, lr.LoanAmount, lr.EntryDate, lr.VisitDate,
         lr.AdditionalIntRate, lr.ChangeIntRate, lr.Person2, lr.StaffID, lr.StaffName, lr.StaffPost,
         lr.ApprovedStatus, lr.ApprovedBy, lr.BranchID,
         m.FullName AS MemberName, l.LoanType,
         b.name AS branch_name
    FROM loanrules lr
    LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = lr.MemberNo COLLATE utf8mb4_general_ci
    LEFT JOIN loandetail l ON l.LoanNo COLLATE utf8mb4_general_ci = lr.LoanNo COLLATE utf8mb4_general_ci
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = lr.BranchID COLLATE utf8mb4_general_ci`;

const inScope = (user, item) =>
  canAccessAllBranches(user) || item.BranchID === user.branch?.code;

const withFlags = (user, item) => ({
  ...item,
  can_edit: !item.ApprovedStatus || user.permissions.includes('loanrule.approve'),
  can_delete: user.permissions.includes('loanrule.delete'),
});

// Helper: full composite detail needed for view/print
async function getLoanRuleData(id) {
  const [rows] = await pool.query(
    `SELECT lr.*, b.name AS branch_name, b.id AS branch_table_id
       FROM loanrules lr
       LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = lr.BranchID COLLATE utf8mb4_general_ci
      WHERE lr.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const rule = rows[0];

  // Fetch Member Detail
  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [rule.MemberNo]);
  const member = memberRows[0] || {};

  // Fetch Loan Detail
  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [rule.LoanNo]);
  const loan = loanRows[0] || {};

  // Enterprise / Organization details
  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const enterprise = orgRows[0] || {};

  // Branch
  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [rule.BranchID || member.BranchID || '']);
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
    rule,
    member,
    loan,
    enterprise,
    branch,
    staffs,
    posts,
  };
}

// ── GET /  –  List loan rules ────────────────────────────────────────────────
router.get('/', requirePermission('loanrule.view'), wrap(async (req, res) => {
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

  res.json({
    loanRules: rows.map((r) => withFlags(req.user, r)),
  });
}));

// ── GET /stats  –  Pending counts ────────────────────────────────────────────
router.get('/stats', requirePermission('loanrule.view'), wrap(async (req, res) => {
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
      FROM loanrules ${branchClause}`,
    params
  );

  res.json({
    total: Number(rows[0]?.total || 0),
    pending: Number(rows[0]?.pending || 0),
    approved: Number(rows[0]?.approved || 0),
  });
}));

// ── GET /options/members  –  Members who have loans ──────────────────────────
router.get('/options/members', requirePermission('loanrule.create'), wrap(async (req, res) => {
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
router.get('/options/loans/:memberNo', requirePermission('loanrule.create'), wrap(async (req, res) => {
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
router.get('/context/:memberNo/:loanNo', requirePermission('loanrule.create'), wrap(async (req, res) => {
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

// ── GET /:id  –  Fetch single loan rule detail ───────────────────────────────
router.get('/:id', requirePermission('loanrule.view'), wrap(async (req, res) => {
  const data = await getLoanRuleData(req.params.id);
  if (!data) return res.status(404).json({ message: 'ऋणका शर्तहरु फेला परेन।' });

  if (!inScope(req.user, data.rule)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण हेर्ने अधिकार छैन।' });
  }

  res.json({
    ...data,
    can_edit: !data.rule.ApprovedStatus || req.user.permissions.includes('loanrule.approve'),
    can_delete: req.user.permissions.includes('loanrule.delete'),
    can_approve: req.user.permissions.includes('loanrule.approve') && !data.rule.ApprovedStatus,
  });
}));

// ── POST /  –  Create loan rules record ───────────────────────────────────────
router.post('/', requirePermission('loanrule.create'), wrap(async (req, res) => {
  const {
    MemberNo,
    LoanNo,
    LoanAmount,
    EntryDate,
    VisitDate,
    AdditionalIntRate,
    ChangeIntRate,
    Person2,
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
    `INSERT INTO loanrules (
       MemberNo, LoanNo, LoanAmount, EntryDate, VisitDate, AdditionalIntRate, ChangeIntRate,
       Person2, StaffID, StaffName, StaffPost, Remarks, BranchID, CreatedBy, CreatedByName
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      MemberNo,
      LoanNo,
      LoanAmount || null,
      EntryDate || null,
      VisitDate || null,
      AdditionalIntRate || null,
      ChangeIntRate || null,
      Person2 || null,
      StaffID || null,
      StaffName || null,
      StaffPost || null,
      Remarks || null,
      branchId,
      req.user.id,
      req.user.name || req.user.email,
    ]
  );

  const ruleId = result.insertId;

  // Dispatch Notification to approvers
  try {
    const approverIds = await usersWithPermission('loanrule.approve', req.user.id, branchTableId);
    if (approverIds.length > 0) {
      await notify(approverIds, {
        type: 'loanrule.submitted',
        title: 'नयाँ ऋण शर्त फारम प्रमाणीकरणको लागि',
        body: `ऋण नं. ${LoanNo} (सदस्य नं. ${MemberNo}) को ऋण शर्तहरु ${req.user.name} द्वारा दर्ता गरियो (${branchName})`,
        link: `/loan/rules/${ruleId}`,
      });
    }
  } catch (err) {
    console.error('Notification dispatch error:', err);
  }

  res.status(201).json({
    id: ruleId,
    message: 'ऋणका शर्तहरु सफलतापूर्वक दर्ता भयो।',
  });
}));

// ── PUT /:id  –  Update loan rules record ─────────────────────────────────────
router.put('/:id', requirePermission('loanrule.edit'), wrap(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM loanrules WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'ऋणका शर्तहरु फेला परेन।' });

  const existing = rows[0];
  if (!inScope(req.user, existing)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण सम्पादन गर्ने अधिकार छैन।' });
  }

  if (existing.ApprovedStatus && !req.user.permissions.includes('loanrule.approve')) {
    return res.status(400).json({ message: 'स्वीकृत भइसकेको विवरण सम्पादन गर्न सकिँदैन।' });
  }

  const {
    MemberNo,
    LoanNo,
    LoanAmount,
    EntryDate,
    VisitDate,
    AdditionalIntRate,
    ChangeIntRate,
    Person2,
    StaffID,
    StaffName,
    StaffPost,
    Remarks,
  } = req.body;

  await pool.query(
    `UPDATE loanrules SET
       MemberNo = ?,
       LoanNo = ?,
       LoanAmount = ?,
       EntryDate = ?,
       VisitDate = ?,
       AdditionalIntRate = ?,
       ChangeIntRate = ?,
       Person2 = ?,
       StaffID = ?,
       StaffName = ?,
       StaffPost = ?,
       Remarks = ?
     WHERE id = ?`,
    [
      MemberNo || existing.MemberNo,
      LoanNo || existing.LoanNo,
      LoanAmount || existing.LoanAmount,
      EntryDate || existing.EntryDate,
      VisitDate || existing.VisitDate,
      AdditionalIntRate !== undefined ? AdditionalIntRate : existing.AdditionalIntRate,
      ChangeIntRate !== undefined ? ChangeIntRate : existing.ChangeIntRate,
      Person2 !== undefined ? Person2 : existing.Person2,
      StaffID !== undefined ? StaffID : existing.StaffID,
      StaffName !== undefined ? StaffName : existing.StaffName,
      StaffPost !== undefined ? StaffPost : existing.StaffPost,
      Remarks !== undefined ? Remarks : existing.Remarks,
      id,
    ]
  );

  res.json({ message: 'ऋणका शर्तहरु सफलतापूर्वक अद्यावधिक भयो।' });
}));

// ── POST /:id/approve  –  Approve loan rules ─────────────────────────────────
router.post('/:id/approve', requirePermission('loanrule.approve'), wrap(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM loanrules WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'ऋणका शर्तहरु फेला परेन।' });

  const existing = rows[0];
  if (!inScope(req.user, existing)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण प्रमाणित गर्ने अधिकार छैन।' });
  }

  await pool.query(
    `UPDATE loanrules SET
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
        type: 'loanrule.approved',
        title: 'ऋणका शर्तहरु प्रमाणित भयो',
        body: `ऋण नं. ${existing.LoanNo} को ऋण शर्तहरु ${req.user.name} द्वारा प्रमाणित/स्वीकृत गरियो।`,
        link: `/loan/rules/${id}`,
      });
    } catch (err) {
      console.error('Approval notification error:', err);
    }
  }

  res.json({ message: 'ऋणका शर्तहरु सफलतापूर्वक स्वीकृत/प्रमाणित गरियो।' });
}));

// ── DELETE /:id  –  Delete loan rules record ─────────────────────────────────
router.delete('/:id', requirePermission('loanrule.delete'), wrap(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM loanrules WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'ऋणका शर्तहरु फेला परेन।' });

  if (!inScope(req.user, rows[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण मेटाउने अधिकार छैन।' });
  }

  await pool.query('DELETE FROM loanrules WHERE id = ?', [id]);
  res.json({ message: 'ऋणका शर्तहरु सफलतापूर्वक मेटाइयो।' });
}));

export default router;

