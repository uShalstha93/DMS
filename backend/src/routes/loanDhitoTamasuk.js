import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';
import { notify, usersWithPermission } from '../utils/notify.js';

const router = Router();
router.use(authenticate);

// SQL to fetch loan dhito tamasuk list with member and loan info
const LIST_SELECT = `
  SELECT ldt.id, ldt.MemberNo, ldt.LoanNo, ldt.EntryDate,
         ldt.BorrowerName, ldt.LoanAmount, ldt.LoanPurpose,
         ldt.DhitoPerson, ldt.DhitoDistrict, ldt.DhitoVDCMUN, ldt.DhitoWardNo, ldt.DhitoKittaNo, ldt.DhitoArea,
         ldt.LegalYear, ldt.LegalMonth, ldt.LegalDay, ldt.LegalDayOfWeek,
         ldt.StaffName, ldt.StaffPost, ldt.LoanBhibhagPramukh, ldt.Byabasthapak,
         ldt.ApprovedStatus, ldt.ApprovedBy, ldt.ApprovedAt, ldt.BranchID,
         m.FullName AS MemberName, l.LoanType,
         b.name AS branch_name
    FROM loandhitotamasuks ldt
    LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = ldt.MemberNo COLLATE utf8mb4_general_ci
    LEFT JOIN loandetail l ON l.LoanNo COLLATE utf8mb4_general_ci = ldt.LoanNo COLLATE utf8mb4_general_ci
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = ldt.BranchID COLLATE utf8mb4_general_ci`;

const inScope = (user, item) =>
  canAccessAllBranches(user) || item.BranchID === user.branch?.code;

const withFlags = (user, item) => ({
  ...item,
  can_edit: !item.ApprovedStatus || user.permissions.includes('loandhitotamasuk.approve'),
  can_delete: user.permissions.includes('loandhitotamasuk.delete'),
});

// Helper: full composite detail needed for view/print
async function getLoanDhitoTamasukData(id) {
  const [rows] = await pool.query(
    `SELECT ldt.*, b.name AS branch_name, b.id AS branch_table_id
       FROM loandhitotamasuks ldt
       LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = ldt.BranchID COLLATE utf8mb4_general_ci
      WHERE ldt.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const dhitoTamasuk = rows[0];

  // Parse DhitoItems if stored as JSON/string
  if (dhitoTamasuk.DhitoItems && typeof dhitoTamasuk.DhitoItems === 'string') {
    try {
      dhitoTamasuk.DhitoItems = JSON.parse(dhitoTamasuk.DhitoItems);
    } catch (_) {}
  }

  // Fetch Member Detail
  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [dhitoTamasuk.MemberNo]);
  const member = memberRows[0] || {};

  // Fetch Loan Detail
  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [dhitoTamasuk.LoanNo]);
  const loan = loanRows[0] || {};

  // Dhito / Sakshi records from database tables
  const [dhitoRows] = await pool.query('SELECT * FROM dhitojamanidetail WHERE LoanNo = ?', [dhitoTamasuk.LoanNo]);
  const [sakshiRows] = await pool.query('SELECT * FROM sakshidetail WHERE LoanNo = ?', [dhitoTamasuk.LoanNo]);

  // Enterprise details
  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const enterprise = orgRows[0] || {};

  // Branch
  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [dhitoTamasuk.BranchID || member.BranchID || '']);
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
    dhitoTamasuk,
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
router.get('/', requirePermission('loandhitotamasuk.view'), wrap(async (req, res) => {
  const { q, branch, status, page = 1, limit = 25 } = req.query;
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('ldt.BranchID = ?');
    params.push(req.user.branch.code);
  } else if (branch) {
    where.push('ldt.BranchID = ?');
    params.push(branch);
  }

  if (q) {
    where.push(
      '(ldt.MemberNo LIKE ? OR ldt.LoanNo LIKE ? OR ldt.BorrowerName LIKE ? OR ldt.DhitoPerson LIKE ? OR m.FullName LIKE ?)'
    );
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }

  if (status === 'APPROVED') {
    where.push('ldt.ApprovedStatus = 1');
  } else if (status === 'PENDING') {
    where.push('(ldt.ApprovedStatus = 0 OR ldt.ApprovedStatus IS NULL)');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const countSql = `
    SELECT COUNT(*) AS total
      FROM loandhitotamasuks ldt
      LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = ldt.MemberNo COLLATE utf8mb4_general_ci
    ${whereClause}`;
  const [cnt] = await pool.query(countSql, params);
  const total = cnt[0]?.total || 0;

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const listSql = `
    ${LIST_SELECT}
    ${whereClause}
    ORDER BY ldt.ApprovedStatus ASC, ldt.id DESC
    LIMIT ? OFFSET ?`;
  const [rows] = await pool.query(listSql, [...params, parseInt(limit, 10), offset]);

  const items = rows.map((r) => withFlags(req.user, r));

  res.json({
    loanDhitoTamasuks: items,
    data: items,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
}));

// ── GET /stats  –  Pending and total stats ──────────────────────────────────
router.get('/stats', requirePermission('loandhitotamasuk.view'), wrap(async (req, res) => {
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('BranchID = ?');
    params.push(req.user.branch.code);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(COALESCE(ApprovedStatus, 0) = 0), 0) AS pending
       FROM loandhitotamasuks
      ${whereClause}`,
    params
  );

  res.json({
    total: Number(rows[0]?.total || 0),
    pending: Number(rows[0]?.pending || 0),
  });
}));

// ── GET /options/members  –  Members with loans ─────────────────────────────
router.get('/options/members', requirePermission('loandhitotamasuk.create'), wrap(async (req, res) => {
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
router.get('/options/loans/:memberNo', requirePermission('loandhitotamasuk.create'), wrap(async (req, res) => {
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
router.get('/context/:memberNo/:loanNo', requirePermission('loandhitotamasuk.create'), wrap(async (req, res) => {
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
router.get('/:id', requirePermission('loandhitotamasuk.view'), wrap(async (req, res) => {
  const data = await getLoanDhitoTamasukData(req.params.id);
  if (!data) return res.status(404).json({ message: 'धितो तमसुक फेला परेन।' });

  if (!inScope(req.user, data.dhitoTamasuk)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण हेर्ने अधिकार छैन।' });
  }

  res.json({
    ...data,
    can_edit: !data.dhitoTamasuk.ApprovedStatus || req.user.permissions.includes('loandhitotamasuk.approve'),
    can_delete: req.user.permissions.includes('loandhitotamasuk.delete'),
    can_approve: req.user.permissions.includes('loandhitotamasuk.approve') && !data.dhitoTamasuk.ApprovedStatus,
  });
}));

// ── POST /  –  Create record ─────────────────────────────────────────────────
router.post('/', requirePermission('loandhitotamasuk.create'), wrap(async (req, res) => {
  const {
    MemberNo,
    LoanNo,
    EntryDate,

    // Legal & Address
    SahakariAin,
    JillaSahakariAddress,

    // Borrower
    BorrowerName,
    BorrowerGrandfatherName,
    BorrowerFatherName,
    BorrowerProvince,
    BorrowerDistrict,
    BorrowerPalika,
    BorrowerWard,
    BorrowerTmpProvince,
    BorrowerTmpDistrict,
    BorrowerTmpPalika,
    BorrowerTmpWard,
    BorrowerCitizenshipNo,
    BorrowerCitizenshipDate,
    BorrowerCitizenshipDistrict,
    BorrowerAge,

    // Loan
    LoanPurpose,
    LoanApplicationDate,
    LoanAmount,
    LoanAmountWords,
    RateOfInterest,
    LoanPeriodYear,
    LoanPeriodMonth,
    LoanKista,

    // Dhito
    DhitoPerson,
    DhitoDistrict,
    DhitoVDCMUN,
    DhitoWardNo,
    DhitoKittaNo,
    DhitoArea,
    DhitoRemarks,
    DhitoItems,

    // Witnesses
    SakshiName1,
    SakshiDistrict1,
    SakshiPalika1,
    SakshiWardNo1,
    SakshiMemberNo1,

    SakshiName2,
    SakshiDistrict2,
    SakshiPalika2,
    SakshiWardNo2,
    SakshiMemberNo2,

    // Legal Date
    LegalYear,
    LegalMonth,
    LegalDay,
    LegalDayOfWeek,

    // Staff
    LoanBhibhagPramukh,
    Byabasthapak,
    StaffID,
    StaffName,
    StaffPost,
    Remarks,
  } = req.body;

  if (!MemberNo) return res.status(400).json({ message: 'सदस्यता नं. अनिवार्य छ।' });
  if (!LoanNo) return res.status(400).json({ message: 'ऋण नं. अनिवार्य छ।' });

  // Resolve BranchID
  let branchId = req.user.branch?.code || null;
  const [mRows] = await pool.query('SELECT BranchID FROM memberdetail WHERE MemberNo = ?', [MemberNo]);
  if (mRows[0]?.BranchID) branchId = mRows[0].BranchID;

  const [result] = await pool.query(
    `INSERT INTO loandhitotamasuks (
       MemberNo, LoanNo, EntryDate,
       SahakariAin, JillaSahakariAddress,
       BorrowerName, BorrowerGrandfatherName, BorrowerFatherName,
       BorrowerProvince, BorrowerDistrict, BorrowerPalika, BorrowerWard,
       BorrowerTmpProvince, BorrowerTmpDistrict, BorrowerTmpPalika, BorrowerTmpWard,
       BorrowerCitizenshipNo, BorrowerCitizenshipDate, BorrowerCitizenshipDistrict, BorrowerAge,
       LoanPurpose, LoanApplicationDate, LoanAmount, LoanAmountWords,
       RateOfInterest, LoanPeriodYear, LoanPeriodMonth, LoanKista,
       DhitoPerson, DhitoDistrict, DhitoVDCMUN, DhitoWardNo, DhitoKittaNo, DhitoArea, DhitoRemarks, DhitoItems,
       SakshiName1, SakshiDistrict1, SakshiPalika1, SakshiWardNo1, SakshiMemberNo1,
       SakshiName2, SakshiDistrict2, SakshiPalika2, SakshiWardNo2, SakshiMemberNo2,
       LegalYear, LegalMonth, LegalDay, LegalDayOfWeek,
       LoanBhibhagPramukh, Byabasthapak, StaffID, StaffName, StaffPost, Remarks,
       BranchID, CreatedBy, CreatedByName
     ) VALUES (
       ?, ?, ?,
       ?, ?,
       ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?,
       ?, ?, ?
     )`,
    [
      MemberNo, LoanNo, EntryDate || null,
      SahakariAin || '२०४८', JillaSahakariAddress || null,
      BorrowerName || null, BorrowerGrandfatherName || null, BorrowerFatherName || null,
      BorrowerProvince || null, BorrowerDistrict || null, BorrowerPalika || null, BorrowerWard || null,
      BorrowerTmpProvince || null, BorrowerTmpDistrict || null, BorrowerTmpPalika || null, BorrowerTmpWard || null,
      BorrowerCitizenshipNo || null, BorrowerCitizenshipDate || null, BorrowerCitizenshipDistrict || null, BorrowerAge || null,
      LoanPurpose || null, LoanApplicationDate || null, LoanAmount || null, LoanAmountWords || null,
      RateOfInterest || null, LoanPeriodYear || null, LoanPeriodMonth || null, LoanKista || null,
      DhitoPerson || null, DhitoDistrict || null, DhitoVDCMUN || null, DhitoWardNo || null, DhitoKittaNo || null, DhitoArea || null, DhitoRemarks || null,
      DhitoItems ? JSON.stringify(DhitoItems) : null,
      SakshiName1 || null, SakshiDistrict1 || null, SakshiPalika1 || null, SakshiWardNo1 || null, SakshiMemberNo1 || null,
      SakshiName2 || null, SakshiDistrict2 || null, SakshiPalika2 || null, SakshiWardNo2 || null, SakshiMemberNo2 || null,
      LegalYear || null, LegalMonth || null, LegalDay || null, LegalDayOfWeek || null,
      LoanBhibhagPramukh || null, Byabasthapak || null, StaffID || null, StaffName || null, StaffPost || null, Remarks || null,
      branchId, req.user.id || null, req.user.name || null,
    ]
  );

  const newId = result.insertId;

  // Notify Approvers
  try {
    const approverIds = await usersWithPermission('loandhitotamasuk.approve', req.user.id, branchId);
    if (approverIds.length > 0) {
      await notify(approverIds, {
        type: 'loandhitotamasuk.submitted',
        title: 'नयाँ धितो तमसुक प्रमाणीकरणका लागि पेश भयो',
        body: `सदस्य नं. ${MemberNo} को ऋण नं. ${LoanNo} का लागि धितो तमसुक पेश गरिएको छ।`,
        link: `/loan/dhito-tamasuk/${newId}`,
      });
    }
  } catch (err) {
    console.error('Failed to notify approvers:', err);
  }

  res.status(201).json({
    message: 'धितो तमसुक सफलतापूर्वक दर्ता गरियो।',
    id: newId,
  });
}));

// ── PUT /:id  –  Update record ───────────────────────────────────────────────
router.put('/:id', requirePermission('loandhitotamasuk.edit'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loandhitotamasuks WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण सम्पादन गर्ने अधिकार छैन।' });
  }

  if (existing[0].ApprovedStatus && !req.user.permissions.includes('loandhitotamasuk.approve')) {
    return res.status(400).json({ message: 'प्रमाणित भइसकेको धितो तमसुक सम्पादन गर्न सकिँदैन।' });
  }

  const {
    MemberNo,
    LoanNo,
    EntryDate,

    // Legal & Address
    SahakariAin,
    JillaSahakariAddress,

    // Borrower
    BorrowerName,
    BorrowerGrandfatherName,
    BorrowerFatherName,
    BorrowerProvince,
    BorrowerDistrict,
    BorrowerPalika,
    BorrowerWard,
    BorrowerTmpProvince,
    BorrowerTmpDistrict,
    BorrowerTmpPalika,
    BorrowerTmpWard,
    BorrowerCitizenshipNo,
    BorrowerCitizenshipDate,
    BorrowerCitizenshipDistrict,
    BorrowerAge,

    // Loan
    LoanPurpose,
    LoanApplicationDate,
    LoanAmount,
    LoanAmountWords,
    RateOfInterest,
    LoanPeriodYear,
    LoanPeriodMonth,
    LoanKista,

    // Dhito
    DhitoPerson,
    DhitoDistrict,
    DhitoVDCMUN,
    DhitoWardNo,
    DhitoKittaNo,
    DhitoArea,
    DhitoRemarks,
    DhitoItems,

    // Witnesses
    SakshiName1,
    SakshiDistrict1,
    SakshiPalika1,
    SakshiWardNo1,
    SakshiMemberNo1,

    SakshiName2,
    SakshiDistrict2,
    SakshiPalika2,
    SakshiWardNo2,
    SakshiMemberNo2,

    // Legal Date
    LegalYear,
    LegalMonth,
    LegalDay,
    LegalDayOfWeek,

    // Staff
    LoanBhibhagPramukh,
    Byabasthapak,
    StaffID,
    StaffName,
    StaffPost,
    Remarks,
  } = req.body;

  await pool.query(
    `UPDATE loandhitotamasuks
        SET MemberNo = ?, LoanNo = ?, EntryDate = ?,
            SahakariAin = ?, JillaSahakariAddress = ?,
            BorrowerName = ?, BorrowerGrandfatherName = ?, BorrowerFatherName = ?,
            BorrowerProvince = ?, BorrowerDistrict = ?, BorrowerPalika = ?, BorrowerWard = ?,
            BorrowerTmpProvince = ?, BorrowerTmpDistrict = ?, BorrowerTmpPalika = ?, BorrowerTmpWard = ?,
            BorrowerCitizenshipNo = ?, BorrowerCitizenshipDate = ?, BorrowerCitizenshipDistrict = ?, BorrowerAge = ?,
            LoanPurpose = ?, LoanApplicationDate = ?, LoanAmount = ?, LoanAmountWords = ?,
            RateOfInterest = ?, LoanPeriodYear = ?, LoanPeriodMonth = ?, LoanKista = ?,
            DhitoPerson = ?, DhitoDistrict = ?, DhitoVDCMUN = ?, DhitoWardNo = ?, DhitoKittaNo = ?, DhitoArea = ?, DhitoRemarks = ?, DhitoItems = ?,
            SakshiName1 = ?, SakshiDistrict1 = ?, SakshiPalika1 = ?, SakshiWardNo1 = ?, SakshiMemberNo1 = ?,
            SakshiName2 = ?, SakshiDistrict2 = ?, SakshiPalika2 = ?, SakshiWardNo2 = ?, SakshiMemberNo2 = ?,
            LegalYear = ?, LegalMonth = ?, LegalDay = ?, LegalDayOfWeek = ?,
            LoanBhibhagPramukh = ?, Byabasthapak = ?, StaffID = ?, StaffName = ?, StaffPost = ?, Remarks = ?
      WHERE id = ?`,
    [
      MemberNo || existing[0].MemberNo,
      LoanNo || existing[0].LoanNo,
      EntryDate || null,
      SahakariAin || '२०४८',
      JillaSahakariAddress || null,
      BorrowerName || null,
      BorrowerGrandfatherName || null,
      BorrowerFatherName || null,
      BorrowerProvince || null,
      BorrowerDistrict || null,
      BorrowerPalika || null,
      BorrowerWard || null,
      BorrowerTmpProvince || null,
      BorrowerTmpDistrict || null,
      BorrowerTmpPalika || null,
      BorrowerTmpWard || null,
      BorrowerCitizenshipNo || null,
      BorrowerCitizenshipDate || null,
      BorrowerCitizenshipDistrict || null,
      BorrowerAge || null,
      LoanPurpose || null,
      LoanApplicationDate || null,
      LoanAmount || null,
      LoanAmountWords || null,
      RateOfInterest || null,
      LoanPeriodYear || null,
      LoanPeriodMonth || null,
      LoanKista || null,
      DhitoPerson || null,
      DhitoDistrict || null,
      DhitoVDCMUN || null,
      DhitoWardNo || null,
      DhitoKittaNo || null,
      DhitoArea || null,
      DhitoRemarks || null,
      DhitoItems ? JSON.stringify(DhitoItems) : null,
      SakshiName1 || null,
      SakshiDistrict1 || null,
      SakshiPalika1 || null,
      SakshiWardNo1 || null,
      SakshiMemberNo1 || null,
      SakshiName2 || null,
      SakshiDistrict2 || null,
      SakshiPalika2 || null,
      SakshiWardNo2 || null,
      SakshiMemberNo2 || null,
      LegalYear || null,
      LegalMonth || null,
      LegalDay || null,
      LegalDayOfWeek || null,
      LoanBhibhagPramukh || null,
      Byabasthapak || null,
      StaffID || null,
      StaffName || null,
      StaffPost || null,
      Remarks || null,
      req.params.id,
    ]
  );

  res.json({ message: 'धितो तमसुक सफलतापूर्वक अद्यावधिक गरियो।' });
}));

// ── POST /:id/approve  –  Approve record ─────────────────────────────────────
router.post('/:id/approve', requirePermission('loandhitotamasuk.approve'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loandhitotamasuks WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण प्रमाणीकरण गर्ने अधिकार छैन।' });
  }

  const approverName = req.user.name || req.user.email;

  await pool.query(
    `UPDATE loandhitotamasuks
        SET ApprovedStatus = 1,
            ApprovedBy = ?,
            ApprovedAt = NOW()
      WHERE id = ?`,
    [approverName, req.params.id]
  );

  // Notify creator if exists
  if (existing[0].CreatedBy) {
    try {
      await notify([existing[0].CreatedBy], {
        type: 'loandhitotamasuk.approved',
        title: 'धितो तमसुक प्रमाणित भयो',
        body: `सदस्य नं. ${existing[0].MemberNo} को धितो तमसुक ${approverName} द्वारा प्रमाणित गरिएको छ।`,
        link: `/loan/dhito-tamasuk/${req.params.id}`,
      });
    } catch (e) {
      console.error('Error sending approval notification:', e);
    }
  }

  res.json({
    message: 'धितो तमसुक सफलतापूर्वक प्रमाणित गरियो।',
    ApprovedStatus: 1,
    ApprovedBy: approverName,
    ApprovedAt: new Date().toISOString(),
  });
}));

// ── DELETE /:id  –  Delete record ───────────────────────────────────────────
router.delete('/:id', requirePermission('loandhitotamasuk.delete'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loandhitotamasuks WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण मेटाउने अधिकार छैन।' });
  }

  await pool.query('DELETE FROM loandhitotamasuks WHERE id = ?', [req.params.id]);
  res.json({ message: 'धितो तमसुक सफलतापूर्वक मेटाइयो।' });
}));

export default router;
