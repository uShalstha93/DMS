import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';
import { notify, usersWithPermission } from '../utils/notify.js';

const router = Router();
router.use(authenticate);

const LIST_SELECT = `
  SELECT ln.id, ln.MemberNo, ln.LoanNo, ln.EntryDate, ln.RegisterNo, ln.ChalaaniNo,
         ln.NaapiAddress, ln.Map1, ln.Map2, ln.LoanBhibhagPramukh,
         ln.LandKittaNo1, ln.LandKittaNo2,
         ln.ApprovedStatus, ln.ApprovedBy, ln.ApprovedAt, ln.BranchID,
         ln.CreatedBy, ln.CreatedByName,
         m.FullName AS MemberName, l.LoanType, l.LoanPurpose, l.LoanAmount,
         b.name AS branch_name
    FROM loannaapisakhaapplications ln
    LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = ln.MemberNo COLLATE utf8mb4_general_ci
    LEFT JOIN loandetail l ON l.LoanNo COLLATE utf8mb4_general_ci = ln.LoanNo COLLATE utf8mb4_general_ci
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = ln.BranchID COLLATE utf8mb4_general_ci`;

const inScope = (user, item) =>
  canAccessAllBranches(user) || item.BranchID === user.branch?.code;

const withFlags = (user, item) => ({
  ...item,
  can_edit: !item.ApprovedStatus || user.permissions.includes('loannaapi.approve'),
  can_delete: user.permissions.includes('loannaapi.delete'),
});

function formatEnterprise(row) {
  if (!row) return {};
  const cName = row.companyname || row.CompanyName || '';
  const ward = row.wardno || row.WardNo || '';
  const mun = row.munvdc || row.mun_vdc || row.VDCMUN || row.MunVDC || '';
  const dist = row.district || row.District || '';
  const regNo = row.registerno || row.RegisterNo || row.registrationno || row.RegistrationNo || '';
  const addr = [mun, dist].filter(Boolean).join(', ') || row.Address || row.address || '';
  return {
    ...row,
    CompanyName: cName,
    companyname: cName,
    RegisterNo: regNo,
    registerno: regNo,
    Address: addr,
    address: addr,
    WardNo: ward,
    wardno: ward,
    District: dist,
    district: dist,
    MunVDC: mun,
    munvdc: mun,
    VDCMUN: mun,
    Province: row.province || row.Province || '',
    PanNo: row.panno || row.PanNo || '',
    Phone: row.contactno || row.phone || '',
  };
}

async function findLoanBhibhagPramukh(branchId) {
  let staffRows = [];
  if (branchId) {
    const [rows] = await pool.query('SELECT staffno, name, name_eng, post FROM staffs WHERE branch_id = ?', [branchId]);
    staffRows = rows;
  } else {
    const [rows] = await pool.query('SELECT staffno, name, name_eng, post FROM staffs');
    staffRows = rows;
  }
  const head = staffRows.find((s) => (s.post || '').includes('ऋण बिभाग प्रमुख') || (s.post || '').includes('ऋण विभाग प्रमुख'));
  return head?.name || 'ऋण बिभाग प्रमुख';
}

async function getNaapiSakhaData(id) {
  const [rows] = await pool.query(
    `SELECT ln.*, b.name AS branch_name, b.id AS branch_table_id
       FROM loannaapisakhaapplications ln
       LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = ln.BranchID COLLATE utf8mb4_general_ci
      WHERE ln.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const naapiApplication = rows[0];

  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [naapiApplication.MemberNo]);
  const member = memberRows[0] || {};

  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [naapiApplication.LoanNo]);
  const loan = loanRows[0] || {};

  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const enterprise = formatEnterprise(orgRows[0]);

  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [naapiApplication.BranchID || member.BranchID || '']);
  const branch = branchRows[0] || {};

  return {
    naapiApplication,
    member,
    loan,
    enterprise,
    branch,
  };
}

// ── GET /  –  List records ──────────────────────────────────────────────────
router.get('/', requirePermission('loannaapi.view'), wrap(async (req, res) => {
  const { q, branch, status, page = 1, limit = 25 } = req.query;
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('ln.BranchID = ?');
    params.push(req.user.branch.code);
  } else if (branch) {
    where.push('ln.BranchID = ?');
    params.push(branch);
  }

  if (q) {
    where.push(
      '(ln.MemberNo LIKE ? OR ln.LoanNo LIKE ? OR ln.ChalaaniNo LIKE ? OR ln.NaapiAddress LIKE ? OR ln.LandKittaNo1 LIKE ? OR m.FullName LIKE ?)'
    );
    const like = `%${q}%`;
    params.push(like, like, like, like, like, like);
  }

  if (status === 'APPROVED') {
    where.push('ln.ApprovedStatus = 1');
  } else if (status === 'PENDING') {
    where.push('(ln.ApprovedStatus = 0 OR ln.ApprovedStatus IS NULL)');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const countSql = `
    SELECT COUNT(*) AS total
      FROM loannaapisakhaapplications ln
      LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = ln.MemberNo COLLATE utf8mb4_general_ci
    ${whereClause}`;
  const [cnt] = await pool.query(countSql, params);
  const total = cnt[0]?.total || 0;

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const listSql = `
    ${LIST_SELECT}
    ${whereClause}
    ORDER BY ln.ApprovedStatus ASC, ln.id DESC
    LIMIT ? OFFSET ?`;
  const [rows] = await pool.query(listSql, [...params, parseInt(limit, 10), offset]);

  const items = rows.map((r) => withFlags(req.user, r));

  res.json({
    naapiApplications: items,
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
router.get('/stats', requirePermission('loannaapi.view'), wrap(async (req, res) => {
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
       FROM loannaapisakhaapplications
      ${whereClause}`,
    params
  );

  res.json({
    total: Number(rows[0]?.total || 0),
    pending: Number(rows[0]?.pending || 0),
  });
}));

// ── GET /options/members  –  Members with loans ─────────────────────────────
router.get('/options/members', requirePermission('loannaapi.create'), wrap(async (req, res) => {
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

  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const loanBhibhagPramukh = await findLoanBhibhagPramukh(req.user.branch?.id);

  res.json({
    members: rows,
    enterprise: formatEnterprise(orgRows[0]),
    loanBhibhagPramukh,
  });
}));

// ── GET /options/loans/:memberNo  –  Loans for a member ────────────────────
router.get('/options/loans/:memberNo', requirePermission('loannaapi.create'), wrap(async (req, res) => {
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
router.get('/context/:memberNo/:loanNo', requirePermission('loannaapi.create'), wrap(async (req, res) => {
  const { memberNo, loanNo } = req.params;

  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [memberNo]);
  const member = memberRows[0] || null;

  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [loanNo]);
  const loan = loanRows[0] || null;

  const [dhitoRows] = await pool.query('SELECT * FROM dhitojamanidetail WHERE LoanNo = ?', [loanNo]);

  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const enterprise = formatEnterprise(orgRows[0]);

  const branchCode = member?.BranchID || req.user.branch?.code || '';
  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [branchCode]);
  const branch = branchRows[0] || {};
  const loanBhibhagPramukh = await findLoanBhibhagPramukh(branch.id || req.user.branch?.id);

  res.json({
    member,
    loan,
    dhitos: dhitoRows,
    enterprise,
    branch,
    loanBhibhagPramukh,
  });
}));

// ── GET /:id  –  Fetch single record ─────────────────────────────────────────
router.get('/:id', requirePermission('loannaapi.view'), wrap(async (req, res) => {
  const data = await getNaapiSakhaData(req.params.id);
  if (!data) return res.status(404).json({ message: 'नापी शाखा निवेदन विवरण फेला परेन।' });

  if (!inScope(req.user, data.naapiApplication)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण हेर्ने अधिकार छैन।' });
  }

  res.json({
    ...data,
    can_edit: !data.naapiApplication.ApprovedStatus || req.user.permissions.includes('loannaapi.approve'),
    can_delete: req.user.permissions.includes('loannaapi.delete'),
    can_approve: req.user.permissions.includes('loannaapi.approve') && !data.naapiApplication.ApprovedStatus,
  });
}));

// ── POST /  –  Create record ─────────────────────────────────────────────────
router.post('/', requirePermission('loannaapi.create'), wrap(async (req, res) => {
  const {
    MemberNo,
    LoanNo,
    EntryDate,
    RegisterNo,
    ChalaaniNo,
    NaapiAddress,
    Map1,
    Map2,
    LoanBhibhagPramukh,
    LandHolderPersonName1,
    LandHolderFatherName1,
    LandHolderGrandfatherName1,
    LandAddress1,
    LandWardNoBlockNo1,
    LandKittaNo1,
    LandArea1,
    LandHolderPersonName2,
    LandHolderFatherName2,
    LandHolderGrandfatherName2,
    LandAddress2,
    LandWardNoBlockNo2,
    LandKittaNo2,
    LandArea2,
  } = req.body;

  if (!MemberNo) return res.status(400).json({ message: 'सदस्यता नं. अनिवार्य छ।' });
  if (!LoanNo) return res.status(400).json({ message: 'ऋण नं. अनिवार्य छ।' });
  if (!ChalaaniNo) return res.status(400).json({ message: 'चलानी नं. अनिवार्य छ।' });

  let branchId = req.user.branch?.code || null;
  const [mRows] = await pool.query('SELECT BranchID FROM memberdetail WHERE MemberNo = ?', [MemberNo]);
  if (mRows[0]?.BranchID) branchId = mRows[0].BranchID;

  const [result] = await pool.query(
    `INSERT INTO loannaapisakhaapplications (
       MemberNo, LoanNo, EntryDate, RegisterNo, ChalaaniNo, NaapiAddress,
       Map1, Map2, LoanBhibhagPramukh,
       LandHolderPersonName1, LandHolderFatherName1, LandHolderGrandfatherName1,
       LandAddress1, LandWardNoBlockNo1, LandKittaNo1, LandArea1,
       LandHolderPersonName2, LandHolderFatherName2, LandHolderGrandfatherName2,
       LandAddress2, LandWardNoBlockNo2, LandKittaNo2, LandArea2,
       BranchID, CreatedBy, CreatedByName
     ) VALUES (
       ?, ?, ?, ?, ?, ?,
       ?, ?, ?,
       ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?
     )`,
    [
      MemberNo, LoanNo, EntryDate || null, RegisterNo || null, ChalaaniNo, NaapiAddress || null,
      Map1 || null, Map2 || null, LoanBhibhagPramukh || null,
      LandHolderPersonName1 || null, LandHolderFatherName1 || null, LandHolderGrandfatherName1 || null,
      LandAddress1 || null, LandWardNoBlockNo1 || null, LandKittaNo1 || null, LandArea1 || null,
      LandHolderPersonName2 || null, LandHolderFatherName2 || null, LandHolderGrandfatherName2 || null,
      LandAddress2 || null, LandWardNoBlockNo2 || null, LandKittaNo2 || null, LandArea2 || null,
      branchId, req.user.id || null, req.user.name || null,
    ]
  );

  const newId = result.insertId;

  try {
    const approverIds = await usersWithPermission('loannaapi.approve', req.user.id, branchId);
    if (approverIds.length > 0) {
      await notify(approverIds, {
        type: 'loannaapi.submitted',
        title: 'नयाँ नापी शाखा निवेदन प्रमाणीकरणका लागि पेश भयो',
        body: `सदस्य नं. ${MemberNo} (ऋण नं. ${LoanNo}, चलानी नं. ${ChalaaniNo}) को नापी शाखा निवेदन पेश गरिएको छ।`,
        link: `/loan/naapi-saakha/${newId}`,
      });
    }
  } catch (err) {
    console.error('Failed to notify approvers:', err);
  }

  res.status(201).json({
    message: 'नापी शाखा निवेदन सफलतापूर्वक सुरक्षित गरियो।',
    id: newId,
  });
}));

// ── PUT /:id  –  Update record ───────────────────────────────────────────────
router.put('/:id', requirePermission('loannaapi.edit'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loannaapisakhaapplications WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण सम्पादन गर्ने अधिकार छैन।' });
  }

  if (existing[0].ApprovedStatus && !req.user.permissions.includes('loannaapi.approve')) {
    return res.status(400).json({ message: 'प्रमाणित भइसकेको विवरण सम्पादन गर्न सकिँदैन।' });
  }

  const {
    MemberNo,
    LoanNo,
    EntryDate,
    RegisterNo,
    ChalaaniNo,
    NaapiAddress,
    Map1,
    Map2,
    LoanBhibhagPramukh,
    LandHolderPersonName1,
    LandHolderFatherName1,
    LandHolderGrandfatherName1,
    LandAddress1,
    LandWardNoBlockNo1,
    LandKittaNo1,
    LandArea1,
    LandHolderPersonName2,
    LandHolderFatherName2,
    LandHolderGrandfatherName2,
    LandAddress2,
    LandWardNoBlockNo2,
    LandKittaNo2,
    LandArea2,
  } = req.body;

  await pool.query(
    `UPDATE loannaapisakhaapplications
        SET MemberNo = ?, LoanNo = ?, EntryDate = ?, RegisterNo = ?, ChalaaniNo = ?, NaapiAddress = ?,
            Map1 = ?, Map2 = ?, LoanBhibhagPramukh = ?,
            LandHolderPersonName1 = ?, LandHolderFatherName1 = ?, LandHolderGrandfatherName1 = ?,
            LandAddress1 = ?, LandWardNoBlockNo1 = ?, LandKittaNo1 = ?, LandArea1 = ?,
            LandHolderPersonName2 = ?, LandHolderFatherName2 = ?, LandHolderGrandfatherName2 = ?,
            LandAddress2 = ?, LandWardNoBlockNo2 = ?, LandKittaNo2 = ?, LandArea2 = ?
      WHERE id = ?`,
    [
      MemberNo || existing[0].MemberNo,
      LoanNo || existing[0].LoanNo,
      EntryDate || null,
      RegisterNo || null,
      ChalaaniNo || existing[0].ChalaaniNo,
      NaapiAddress || null,
      Map1 || null,
      Map2 || null,
      LoanBhibhagPramukh || null,
      LandHolderPersonName1 || null,
      LandHolderFatherName1 || null,
      LandHolderGrandfatherName1 || null,
      LandAddress1 || null,
      LandWardNoBlockNo1 || null,
      LandKittaNo1 || null,
      LandArea1 || null,
      LandHolderPersonName2 || null,
      LandHolderFatherName2 || null,
      LandHolderGrandfatherName2 || null,
      LandAddress2 || null,
      LandWardNoBlockNo2 || null,
      LandKittaNo2 || null,
      LandArea2 || null,
      req.params.id,
    ]
  );

  res.json({ message: 'नापी शाखा निवेदन सफलतापूर्वक अद्यावधिक गरियो।' });
}));

// ── POST /:id/approve  –  Approve record ─────────────────────────────────────
router.post('/:id/approve', requirePermission('loannaapi.approve'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loannaapisakhaapplications WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण प्रमाणीकरण गर्ने अधिकार छैन।' });
  }

  const approverName = req.user.name || req.user.email;

  await pool.query(
    `UPDATE loannaapisakhaapplications
        SET ApprovedStatus = 1,
            ApprovedBy = ?,
            ApprovedAt = NOW()
      WHERE id = ?`,
    [approverName, req.params.id]
  );

  if (existing[0].CreatedBy) {
    try {
      await notify([existing[0].CreatedBy], {
        type: 'loannaapi.approved',
        title: 'नापी शाखा निवेदन प्रमाणित भयो',
        body: `सदस्य नं. ${existing[0].MemberNo} (ऋण नं. ${existing[0].LoanNo}) को नापी शाखा निवेदन ${approverName} द्वारा प्रमाणित गरिएको छ।`,
        link: `/loan/naapi-saakha/${req.params.id}`,
      });
    } catch (e) {
      console.error('Error sending approval notification:', e);
    }
  }

  res.json({
    message: 'नापी शाखा निवेदन सफलतापूर्वक प्रमाणित गरियो।',
    ApprovedStatus: 1,
    ApprovedBy: approverName,
    ApprovedAt: new Date().toISOString(),
  });
}));

// ── DELETE /:id  –  Delete record ───────────────────────────────────────────
router.delete('/:id', requirePermission('loannaapi.delete'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loannaapisakhaapplications WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण मेटाउने अधिकार छैन।' });
  }

  await pool.query('DELETE FROM loannaapisakhaapplications WHERE id = ?', [req.params.id]);
  res.json({ message: 'नापी शाखा निवेदन सफलतापूर्वक मेटाइयो।' });
}));

export default router;
