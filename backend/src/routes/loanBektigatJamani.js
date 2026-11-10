import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';
import { notify, usersWithPermission } from '../utils/notify.js';

const router = Router();
router.use(authenticate);

// SQL to fetch loan bektigat jamani list with member and loan info
const LIST_SELECT = `
  SELECT lbj.id, lbj.MemberNo, lbj.LoanNo, lbj.EntryDate,
         lbj.BorrowerName, lbj.JamaniName, lbj.LoanAmount, lbj.LoanPurpose,
         lbj.LegalYear, lbj.LegalMonth, lbj.LegalDay, lbj.LegalDayOfWeek,
         lbj.StaffName, lbj.StaffPost, lbj.LoanBhibhagPramukh, lbj.Bhyabasthapak,
         lbj.ApprovedStatus, lbj.ApprovedBy, lbj.ApprovedAt, lbj.BranchID,
         m.FullName AS MemberName, l.LoanType,
         b.name AS branch_name
    FROM loanbektigatjamanis lbj
    LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = lbj.MemberNo COLLATE utf8mb4_general_ci
    LEFT JOIN loandetail l ON l.LoanNo COLLATE utf8mb4_general_ci = lbj.LoanNo COLLATE utf8mb4_general_ci
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = lbj.BranchID COLLATE utf8mb4_general_ci`;

const inScope = (user, item) =>
  canAccessAllBranches(user) || item.BranchID === user.branch?.code;

const withFlags = (user, item) => ({
  ...item,
  can_edit: !item.ApprovedStatus || user.permissions.includes('loanbektigatjamani.approve'),
  can_delete: user.permissions.includes('loanbektigatjamani.delete'),
});

// Helper: full composite detail needed for view/print
async function getLoanBektigatJamaniData(id) {
  const [rows] = await pool.query(
    `SELECT lbj.*, b.name AS branch_name, b.id AS branch_table_id
       FROM loanbektigatjamanis lbj
       LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = lbj.BranchID COLLATE utf8mb4_general_ci
      WHERE lbj.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const bektigatJamani = rows[0];

  // Fetch Member Detail
  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [bektigatJamani.MemberNo]);
  const member = memberRows[0] || {};

  // Fetch Loan Detail
  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [bektigatJamani.LoanNo]);
  const loan = loanRows[0] || {};

  // Dhito / Sakshi records from loandetail
  const [dhitoRows] = await pool.query('SELECT * FROM dhitojamanidetail WHERE LoanNo = ?', [bektigatJamani.LoanNo]);
  const [sakshiRows] = await pool.query('SELECT * FROM sakshidetail WHERE LoanNo = ?', [bektigatJamani.LoanNo]);

  // Enterprise details
  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const enterprise = orgRows[0] || {};

  // Branch
  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [bektigatJamani.BranchID || member.BranchID || '']);
  const branch = branchRows[0] || {};

  // Staffs
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
    bektigatJamani,
    member,
    loan,
    dhitos: dhitoRows,
    sakshis: sakshiRows,
    enterprise,
    branch,
    staffs,
    posts,
  };
}

// ── GET /  –  List records ──────────────────────────────────────────────────
router.get('/', requirePermission('loanbektigatjamani.view'), wrap(async (req, res) => {
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('lbj.BranchID = ?');
    params.push(req.user.branch.code);
  }
  if (req.query.status === 'PENDING') {
    where.push('(lbj.ApprovedStatus = 0 OR lbj.ApprovedStatus IS NULL)');
  }
  if (req.query.status === 'APPROVED') {
    where.push('lbj.ApprovedStatus = 1');
  }
  if (req.query.member) {
    where.push('lbj.MemberNo = ?');
    params.push(req.query.member);
  }

  const [rows] = await pool.query(
    `${LIST_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY lbj.ApprovedStatus ASC, lbj.id DESC`,
    params
  );

  res.json({
    loanBektigatJamanis: rows.map((r) => withFlags(req.user, r)),
  });
}));

// ── GET /stats  –  Pending counts ───────────────────────────────────────────
router.get('/stats', requirePermission('loanbektigatjamani.view'), wrap(async (req, res) => {
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
      FROM loanbektigatjamanis ${branchClause}`,
    params
  );

  res.json({
    total: Number(rows[0]?.total || 0),
    pending: Number(rows[0]?.pending || 0),
    approved: Number(rows[0]?.approved || 0),
  });
}));

// ── GET /options/members  –  Members who have loans ─────────────────────────
router.get('/options/members', requirePermission('loanbektigatjamani.create'), wrap(async (req, res) => {
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
router.get('/options/loans/:memberNo', requirePermission('loanbektigatjamani.create'), wrap(async (req, res) => {
  const { memberNo } = req.params;
  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [memberNo]);
  const member = memberRows[0] || null;

  const [rows] = await pool.query(
    `SELECT l.*
       FROM loandetail l
      WHERE l.MemberNo = ?
      ORDER BY l.id DESC`,
    [memberNo]
  );
  res.json({ loans: rows, member });
}));

// ── GET /context/:memberNo/:loanNo  –  Pre-fill context for form ────────────
router.get('/context/:memberNo/:loanNo', requirePermission('loanbektigatjamani.create'), wrap(async (req, res) => {
  const { memberNo, loanNo } = req.params;

  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [memberNo]);
  const member = memberRows[0] || null;

  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [loanNo]);
  const loan = loanRows[0] || null;

  // Existing dhitos and sakshis
  const [dhitoRows] = await pool.query('SELECT * FROM dhitojamanidetail WHERE LoanNo = ?', [loanNo]);
  const [sakshiRows] = await pool.query('SELECT * FROM sakshidetail WHERE LoanNo = ?', [loanNo]);

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
  const loanHead = staffs.find((s) => s.post?.includes('ऋण विभाग प्रमुख') || s.post?.includes('ऋण बिभाग प्रमुख')) || null;
  const manager = staffs.find((s) => s.post?.includes('ब्यबस्थापक') || s.post?.includes('व्यवस्थापक')) || null;

  res.json({
    member,
    loan,
    dhitos: dhitoRows,
    sakshis: sakshiRows,
    enterprise,
    branch,
    staffs,
    posts,
    loanHead,
    manager,
  });
}));

// ── GET /:id  –  Fetch single record ─────────────────────────────────────────
router.get('/:id', requirePermission('loanbektigatjamani.view'), wrap(async (req, res) => {
  const data = await getLoanBektigatJamaniData(req.params.id);
  if (!data) return res.status(404).json({ message: 'व्यक्तिगत जमानी तमसुक फेला परेन।' });

  if (!inScope(req.user, data.bektigatJamani)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण हेर्ने अधिकार छैन।' });
  }

  res.json({
    ...data,
    can_edit: !data.bektigatJamani.ApprovedStatus || req.user.permissions.includes('loanbektigatjamani.approve'),
    can_delete: req.user.permissions.includes('loanbektigatjamani.delete'),
    can_approve: req.user.permissions.includes('loanbektigatjamani.approve') && !data.bektigatJamani.ApprovedStatus,
  });
}));

// ── POST /  –  Create record ─────────────────────────────────────────────────
router.post('/', requirePermission('loanbektigatjamani.create'), wrap(async (req, res) => {
  const {
    MemberNo,
    LoanNo,
    EntryDate,

    // Borrower
    BorrowerName,
    BorrowerGrandfatherName,
    BorrowerFatherName,
    BorrowerSpouseName,
    BorrowerProvince,
    BorrowerDistrict,
    BorrowerPalika,
    BorrowerWard,
    BorrowerAge,
    BorrowerCitizenshipNo,
    BorrowerCitizenshipDistrict,
    BorrowerCitizenshipPalika,
    BorrowerCitizenshipWard,
    BorrowerCitizenshipDate,

    // Loan
    LoanPurpose,
    LoanAmount,
    LoanAmountWords,
    LoanDate,

    // Guarantor
    JamaniName,
    JamaniGrandfatherName,
    JamaniFatherName,
    JamaniSpouseName,
    JamaniProvince,
    JamaniDistrict,
    JamaniPalika,
    JamaniWard,
    JamaniAge,
    JamaniMemberNo,
    JamaniCitizenshipNo,

    // Witnesses
    SakshiName1,
    SakshiDistrict1,
    SakshiPalika1,
    SakshiWardNo1,
    SakshiAge1,
    SakshiRelation1,

    SakshiName2,
    SakshiDistrict2,
    SakshiPalika2,
    SakshiWardNo2,
    SakshiAge2,
    SakshiRelation2,

    // Legal Date
    LegalYear,
    LegalMonth,
    LegalDay,
    LegalDayOfWeek,

    // Staff
    LoanBhibhagPramukh,
    Bhyabasthapak,
    StaffID,
    StaffName,
    StaffPost,
    Remarks,
  } = req.body;

  if (!MemberNo) return res.status(400).json({ message: 'सदस्यता नं. अनिवार्य छ।' });
  if (!LoanNo) return res.status(400).json({ message: 'ऋण नं. अनिवार्य छ।' });
  if (!JamaniName) return res.status(400).json({ message: 'जमानी दिने व्यक्तिको नाम अनिवार्य छ।' });

  // Resolve BranchID
  let branchId = req.user.branch?.code || null;
  const [mRows] = await pool.query('SELECT BranchID FROM memberdetail WHERE MemberNo = ?', [MemberNo]);
  if (mRows[0]?.BranchID) branchId = mRows[0].BranchID;

  const [result] = await pool.query(
    `INSERT INTO loanbektigatjamanis (
       MemberNo, LoanNo, EntryDate,
       BorrowerName, BorrowerGrandfatherName, BorrowerFatherName, BorrowerSpouseName,
       BorrowerProvince, BorrowerDistrict, BorrowerPalika, BorrowerWard, BorrowerAge,
       BorrowerCitizenshipNo, BorrowerCitizenshipDistrict, BorrowerCitizenshipPalika, BorrowerCitizenshipWard, BorrowerCitizenshipDate,
       LoanPurpose, LoanAmount, LoanAmountWords, LoanDate,
       JamaniName, JamaniGrandfatherName, JamaniFatherName, JamaniSpouseName,
       JamaniProvince, JamaniDistrict, JamaniPalika, JamaniWard, JamaniAge, JamaniMemberNo, JamaniCitizenshipNo,
       SakshiName1, SakshiDistrict1, SakshiPalika1, SakshiWardNo1, SakshiAge1, SakshiRelation1,
       SakshiName2, SakshiDistrict2, SakshiPalika2, SakshiWardNo2, SakshiAge2, SakshiRelation2,
       LegalYear, LegalMonth, LegalDay, LegalDayOfWeek,
       LoanBhibhagPramukh, Bhyabasthapak, StaffID, StaffName, StaffPost, Remarks,
       BranchID, CreatedBy, CreatedByName
     ) VALUES (
       ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?,
       ?, ?, ?
     )`,
    [
      MemberNo, LoanNo, EntryDate || null,
      BorrowerName || null, BorrowerGrandfatherName || null, BorrowerFatherName || null, BorrowerSpouseName || null,
      BorrowerProvince || null, BorrowerDistrict || null, BorrowerPalika || null, BorrowerWard || null, BorrowerAge || null,
      BorrowerCitizenshipNo || null, BorrowerCitizenshipDistrict || null, BorrowerCitizenshipPalika || null, BorrowerCitizenshipWard || null, BorrowerCitizenshipDate || null,
      LoanPurpose || null, LoanAmount || null, LoanAmountWords || null, LoanDate || null,
      JamaniName, JamaniGrandfatherName || null, JamaniFatherName || null, JamaniSpouseName || null,
      JamaniProvince || null, JamaniDistrict || null, JamaniPalika || null, JamaniWard || null, JamaniAge || null, JamaniMemberNo || null, JamaniCitizenshipNo || null,
      SakshiName1 || null, SakshiDistrict1 || null, SakshiPalika1 || null, SakshiWardNo1 || null, SakshiAge1 || null, SakshiRelation1 || null,
      SakshiName2 || null, SakshiDistrict2 || null, SakshiPalika2 || null, SakshiWardNo2 || null, SakshiAge2 || null, SakshiRelation2 || null,
      LegalYear || null, LegalMonth || null, LegalDay || null, LegalDayOfWeek || null,
      LoanBhibhagPramukh || null, Bhyabasthapak || null, StaffID || null, StaffName || null, StaffPost || null, Remarks || null,
      branchId, req.user.id, req.user.name || req.user.email
    ]
  );

  // Notify approvers
  try {
    const approvers = await usersWithPermission('loanbektigatjamani.approve', branchId);
    for (const a of approvers) {
      await notify({
        userId: a.id,
        type: 'LOAN_BEKTIGAT_JAMANI_PENDING',
        title: 'नयाँ व्यक्तिगत जमानी तमसुक स्वीकृतिका लागि प्राप्त',
        message: `सदस्य नं. ${MemberNo} (ऋण नं. ${LoanNo}) को व्यक्तिगत जमानी तमसुक प्रमाणीकरणका लागि पेश गरिएको छ।`,
        link: `/loan/bektigat-jamani/${result.insertId}`,
      });
    }
  } catch (err) {
    console.error('Error notifying approvers:', err);
  }

  res.status(201).json({
    id: result.insertId,
    message: 'व्यक्तिगत जमानी तमसुक सफलतापूर्वक सुरक्षित गरियो।',
  });
}));

// ── PUT /:id  –  Update record ───────────────────────────────────────────────
router.put('/:id', requirePermission('loanbektigatjamani.edit'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loanbektigatjamanis WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण सम्पादन गर्ने अधिकार छैन।' });
  }

  if (existing[0].ApprovedStatus && !req.user.permissions.includes('loanbektigatjamani.approve')) {
    return res.status(403).json({ message: 'प्रमाणित भइसकेको विवरण सम्पादन गर्न सकिँदैन।' });
  }

  const {
    MemberNo,
    LoanNo,
    EntryDate,

    // Borrower
    BorrowerName,
    BorrowerGrandfatherName,
    BorrowerFatherName,
    BorrowerSpouseName,
    BorrowerProvince,
    BorrowerDistrict,
    BorrowerPalika,
    BorrowerWard,
    BorrowerAge,
    BorrowerCitizenshipNo,
    BorrowerCitizenshipDistrict,
    BorrowerCitizenshipPalika,
    BorrowerCitizenshipWard,
    BorrowerCitizenshipDate,

    // Loan
    LoanPurpose,
    LoanAmount,
    LoanAmountWords,
    LoanDate,

    // Guarantor
    JamaniName,
    JamaniGrandfatherName,
    JamaniFatherName,
    JamaniSpouseName,
    JamaniProvince,
    JamaniDistrict,
    JamaniPalika,
    JamaniWard,
    JamaniAge,
    JamaniMemberNo,
    JamaniCitizenshipNo,

    // Witnesses
    SakshiName1,
    SakshiDistrict1,
    SakshiPalika1,
    SakshiWardNo1,
    SakshiAge1,
    SakshiRelation1,

    SakshiName2,
    SakshiDistrict2,
    SakshiPalika2,
    SakshiWardNo2,
    SakshiAge2,
    SakshiRelation2,

    // Legal Date
    LegalYear,
    LegalMonth,
    LegalDay,
    LegalDayOfWeek,

    // Staff
    LoanBhibhagPramukh,
    Bhyabasthapak,
    StaffID,
    StaffName,
    StaffPost,
    Remarks,
  } = req.body;

  await pool.query(
    `UPDATE loanbektigatjamanis SET
       MemberNo = ?, LoanNo = ?, EntryDate = ?,
       BorrowerName = ?, BorrowerGrandfatherName = ?, BorrowerFatherName = ?, BorrowerSpouseName = ?,
       BorrowerProvince = ?, BorrowerDistrict = ?, BorrowerPalika = ?, BorrowerWard = ?, BorrowerAge = ?,
       BorrowerCitizenshipNo = ?, BorrowerCitizenshipDistrict = ?, BorrowerCitizenshipPalika = ?, BorrowerCitizenshipWard = ?, BorrowerCitizenshipDate = ?,
       LoanPurpose = ?, LoanAmount = ?, LoanAmountWords = ?, LoanDate = ?,
       JamaniName = ?, JamaniGrandfatherName = ?, JamaniFatherName = ?, JamaniSpouseName = ?,
       JamaniProvince = ?, JamaniDistrict = ?, JamaniPalika = ?, JamaniWard = ?, JamaniAge = ?, JamaniMemberNo = ?, JamaniCitizenshipNo = ?,
       SakshiName1 = ?, SakshiDistrict1 = ?, SakshiPalika1 = ?, SakshiWardNo1 = ?, SakshiAge1 = ?, SakshiRelation1 = ?,
       SakshiName2 = ?, SakshiDistrict2 = ?, SakshiPalika2 = ?, SakshiWardNo2 = ?, SakshiAge2 = ?, SakshiRelation2 = ?,
       LegalYear = ?, LegalMonth = ?, LegalDay = ?, LegalDayOfWeek = ?,
       LoanBhibhagPramukh = ?, Bhyabasthapak = ?, StaffID = ?, StaffName = ?, StaffPost = ?, Remarks = ?
     WHERE id = ?`,
    [
      MemberNo || existing[0].MemberNo,
      LoanNo || existing[0].LoanNo,
      EntryDate || existing[0].EntryDate,
      BorrowerName || null, BorrowerGrandfatherName || null, BorrowerFatherName || null, BorrowerSpouseName || null,
      BorrowerProvince || null, BorrowerDistrict || null, BorrowerPalika || null, BorrowerWard || null, BorrowerAge || null,
      BorrowerCitizenshipNo || null, BorrowerCitizenshipDistrict || null, BorrowerCitizenshipPalika || null, BorrowerCitizenshipWard || null, BorrowerCitizenshipDate || null,
      LoanPurpose || null, LoanAmount || null, LoanAmountWords || null, LoanDate || null,
      JamaniName || existing[0].JamaniName, JamaniGrandfatherName || null, JamaniFatherName || null, JamaniSpouseName || null,
      JamaniProvince || null, JamaniDistrict || null, JamaniPalika || null, JamaniWard || null, JamaniAge || null, JamaniMemberNo || null, JamaniCitizenshipNo || null,
      SakshiName1 || null, SakshiDistrict1 || null, SakshiPalika1 || null, SakshiWardNo1 || null, SakshiAge1 || null, SakshiRelation1 || null,
      SakshiName2 || null, SakshiDistrict2 || null, SakshiPalika2 || null, SakshiWardNo2 || null, SakshiAge2 || null, SakshiRelation2 || null,
      LegalYear || null, LegalMonth || null, LegalDay || null, LegalDayOfWeek || null,
      LoanBhibhagPramukh || null, Bhyabasthapak || null, StaffID || null, StaffName || null, StaffPost || null, Remarks || null,
      req.params.id,
    ]
  );

  res.json({ message: 'व्यक्तिगत जमानी तमसुक सफलतापूर्वक अद्यावधिक गरियो।' });
}));

// ── POST /:id/approve  –  Approve record ─────────────────────────────────────
router.post('/:id/approve', requirePermission('loanbektigatjamani.approve'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loanbektigatjamanis WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण प्रमाणीकरण गर्ने अधिकार छैन।' });
  }

  const approverName = req.user.name || req.user.email;

  await pool.query(
    `UPDATE loanbektigatjamanis
        SET ApprovedStatus = 1,
            ApprovedBy = ?,
            ApprovedAt = NOW()
      WHERE id = ?`,
    [approverName, req.params.id]
  );

  // Notify creator if exists
  if (existing[0].CreatedBy) {
    try {
      await notify({
        userId: existing[0].CreatedBy,
        type: 'LOAN_BEKTIGAT_JAMANI_APPROVED',
        title: 'व्यक्तिगत जमानी तमसुक प्रमाणित भयो',
        message: `सदस्य नं. ${existing[0].MemberNo} को व्यक्तिगत जमानी तमसुक ${approverName} द्वारा प्रमाणित गरिएको छ।`,
        link: `/loan/bektigat-jamani/${req.params.id}`,
      });
    } catch (e) {
      console.error('Error sending approval notification:', e);
    }
  }

  res.json({
    message: 'व्यक्तिगत जमानी तमसुक सफलतापूर्वक प्रमाणित गरियो।',
    ApprovedStatus: 1,
    ApprovedBy: approverName,
    ApprovedAt: new Date().toISOString(),
  });
}));

// ── DELETE /:id  –  Delete record ───────────────────────────────────────────
router.delete('/:id', requirePermission('loanbektigatjamani.delete'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loanbektigatjamanis WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण मेटाउने अधिकार छैन।' });
  }

  await pool.query('DELETE FROM loanbektigatjamanis WHERE id = ?', [req.params.id]);
  res.json({ message: 'व्यक्तिगत जमानी तमसुक सफलतापूर्वक मेटाइयो।' });
}));

export default router;
