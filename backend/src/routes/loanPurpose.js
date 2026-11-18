import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';
import { notify, usersWithPermission } from '../utils/notify.js';

const router = Router();
router.use(authenticate);

// SQL to fetch purpose of loan list with member and loan info
const LIST_SELECT = `
  SELECT lp.id, lp.MemberNo, lp.LoanNo, lp.EntryDate,
         lp.BorrowerName, lp.BorrowerAddress,
         lp.LoanPurpose, lp.LoanAmount, lp.LoanAmountWords,
         lp.IncomeSource, lp.LoanPurposeCategory,
         lp.LoanPurposeDetail1, lp.LoanPurposeDetail2, lp.OtherDetail,
         lp.ApprovedStatus, lp.ApprovedBy, lp.ApprovedAt, lp.BranchID,
         m.FullName AS MemberName, l.LoanType,
         b.name AS branch_name
    FROM loanpurposeofloans lp
    LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = lp.MemberNo COLLATE utf8mb4_general_ci
    LEFT JOIN loandetail l ON l.LoanNo COLLATE utf8mb4_general_ci = lp.LoanNo COLLATE utf8mb4_general_ci
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = lp.BranchID COLLATE utf8mb4_general_ci`;

const inScope = (user, item) =>
  canAccessAllBranches(user) || item.BranchID === user.branch?.code;

const withFlags = (user, item) => ({
  ...item,
  can_edit: !item.ApprovedStatus || user.permissions.includes('loanpurpose.approve'),
  can_delete: user.permissions.includes('loanpurpose.delete'),
});

function formatEnterprise(row) {
  if (!row) return {};
  const cName = row.companyname || row.CompanyName || '';
  const ward = row.wardno || row.WardNo || '';
  const mun = row.munvdc || row.mun_vdc || row.VDCMUN || row.MunVDC || '';
  const dist = row.district || row.District || '';
  const addr = [mun, dist].filter(Boolean).join(', ') || row.Address || row.address || '';
  return {
    ...row,
    CompanyName: cName,
    companyname: cName,
    Address: addr,
    address: addr,
    WardNo: ward,
    wardno: ward,
    District: dist,
    district: dist,
    MunVDC: mun,
    munvdc: mun,
    Province: row.province || row.Province || '',
    PanNo: row.panno || row.PanNo || '',
    Phone: row.contactno || row.phone || '',
  };
}

// Helper: full composite detail needed for view/print
async function getLoanPurposeData(id) {
  const [rows] = await pool.query(
    `SELECT lp.*, b.name AS branch_name, b.id AS branch_table_id
       FROM loanpurposeofloans lp
       LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = lp.BranchID COLLATE utf8mb4_general_ci
      WHERE lp.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const loanPurpose = rows[0];

  // Fetch Member Detail
  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [loanPurpose.MemberNo]);
  const member = memberRows[0] || {};

  // Fetch Loan Detail
  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [loanPurpose.LoanNo]);
  const loan = loanRows[0] || {};

  // Enterprise details
  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const enterprise = formatEnterprise(orgRows[0]);

  // Branch
  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [loanPurpose.BranchID || member.BranchID || '']);
  const branch = branchRows[0] || {};

  return {
    loanPurpose,
    member,
    loan,
    enterprise,
    branch,
  };
}

// ── GET /  –  List records ──────────────────────────────────────────────────
router.get('/', requirePermission('loanpurpose.view'), wrap(async (req, res) => {
  const { q, branch, status, page = 1, limit = 25 } = req.query;
  const where = [];
  const params = [];

  if (!canAccessAllBranches(req.user)) {
    where.push('lp.BranchID = ?');
    params.push(req.user.branch.code);
  } else if (branch) {
    where.push('lp.BranchID = ?');
    params.push(branch);
  }

  if (q) {
    where.push(
      '(lp.MemberNo LIKE ? OR lp.LoanNo LIKE ? OR lp.BorrowerName LIKE ? OR lp.LoanPurpose LIKE ? OR m.FullName LIKE ?)'
    );
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }

  if (status === 'APPROVED') {
    where.push('lp.ApprovedStatus = 1');
  } else if (status === 'PENDING') {
    where.push('(lp.ApprovedStatus = 0 OR lp.ApprovedStatus IS NULL)');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const countSql = `
    SELECT COUNT(*) AS total
      FROM loanpurposeofloans lp
      LEFT JOIN memberdetail m ON m.MemberNo COLLATE utf8mb4_general_ci = lp.MemberNo COLLATE utf8mb4_general_ci
    ${whereClause}`;
  const [cnt] = await pool.query(countSql, params);
  const total = cnt[0]?.total || 0;

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const listSql = `
    ${LIST_SELECT}
    ${whereClause}
    ORDER BY lp.ApprovedStatus ASC, lp.id DESC
    LIMIT ? OFFSET ?`;
  const [rows] = await pool.query(listSql, [...params, parseInt(limit, 10), offset]);

  const items = rows.map((r) => withFlags(req.user, r));

  res.json({
    loanPurposes: items,
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
router.get('/stats', requirePermission('loanpurpose.view'), wrap(async (req, res) => {
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
       FROM loanpurposeofloans
      ${whereClause}`,
    params
  );

  res.json({
    total: Number(rows[0]?.total || 0),
    pending: Number(rows[0]?.pending || 0),
  });
}));

// ── GET /options/members  –  Members with loans ─────────────────────────────
router.get('/options/members', requirePermission('loanpurpose.create'), wrap(async (req, res) => {
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

  res.json({ members: rows, enterprise: formatEnterprise(orgRows[0]) });
}));

// ── GET /options/loans/:memberNo  –  Loans for a member ────────────────────
router.get('/options/loans/:memberNo', requirePermission('loanpurpose.create'), wrap(async (req, res) => {
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
router.get('/context/:memberNo/:loanNo', requirePermission('loanpurpose.create'), wrap(async (req, res) => {
  const { memberNo, loanNo } = req.params;

  const [memberRows] = await pool.query('SELECT * FROM memberdetail WHERE MemberNo = ?', [memberNo]);
  const member = memberRows[0] || null;

  const [loanRows] = await pool.query('SELECT * FROM loandetail WHERE LoanNo = ?', [loanNo]);
  const loan = loanRows[0] || null;

  // Enterprise details
  const [orgRows] = await pool.query('SELECT * FROM organization_details ORDER BY id ASC LIMIT 1');
  const enterprise = formatEnterprise(orgRows[0]);

  // Branch
  const branchCode = member?.BranchID || req.user.branch?.code || '';
  const [branchRows] = await pool.query('SELECT * FROM branches WHERE code = ?', [branchCode]);
  const branch = branchRows[0] || {};

  res.json({
    member,
    loan,
    enterprise,
    branch,
  });
}));

// ── GET /:id  –  Fetch single record ─────────────────────────────────────────
router.get('/:id', requirePermission('loanpurpose.view'), wrap(async (req, res) => {
  const data = await getLoanPurposeData(req.params.id);
  if (!data) return res.status(404).json({ message: 'ऋण सदुपयोग विवरण फेला परेन।' });

  if (!inScope(req.user, data.loanPurpose)) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण हेर्ने अधिकार छैन।' });
  }

  res.json({
    ...data,
    can_edit: !data.loanPurpose.ApprovedStatus || req.user.permissions.includes('loanpurpose.approve'),
    can_delete: req.user.permissions.includes('loanpurpose.delete'),
    can_approve: req.user.permissions.includes('loanpurpose.approve') && !data.loanPurpose.ApprovedStatus,
  });
}));

// ── POST /  –  Create record ─────────────────────────────────────────────────
router.post('/', requirePermission('loanpurpose.create'), wrap(async (req, res) => {
  const {
    MemberNo,
    LoanNo,
    EntryDate,
    BorrowerName,
    BorrowerAddress,
    LoanPurpose,
    LoanAmount,
    LoanAmountWords,
    IncomeSource,
    LoanPurposeCategory,
    LoanPurposeDetail1,
    LoanPurposeDetail2,
    OtherDetail,
    Remarks,
  } = req.body;

  if (!MemberNo) return res.status(400).json({ message: 'सदस्यता नं. अनिवार्य छ।' });
  if (!LoanNo) return res.status(400).json({ message: 'ऋण नं. अनिवार्य छ।' });

  // Resolve BranchID
  let branchId = req.user.branch?.code || null;
  const [mRows] = await pool.query('SELECT BranchID FROM memberdetail WHERE MemberNo = ?', [MemberNo]);
  if (mRows[0]?.BranchID) branchId = mRows[0].BranchID;

  const [result] = await pool.query(
    `INSERT INTO loanpurposeofloans (
       MemberNo, LoanNo, EntryDate,
       BorrowerName, BorrowerAddress,
       LoanPurpose, LoanAmount, LoanAmountWords,
       IncomeSource, LoanPurposeCategory,
       LoanPurposeDetail1, LoanPurposeDetail2, OtherDetail, Remarks,
       BranchID, CreatedBy, CreatedByName
     ) VALUES (
       ?, ?, ?,
       ?, ?,
       ?, ?, ?,
       ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?
     )`,
    [
      MemberNo, LoanNo, EntryDate || null,
      BorrowerName || null, BorrowerAddress || null,
      LoanPurpose || null, LoanAmount || null, LoanAmountWords || null,
      IncomeSource || 'नोकरी', LoanPurposeCategory || '(झ) घरायसी/सामाजिक कार्य ऋण',
      LoanPurposeDetail1 || null, LoanPurposeDetail2 || null, OtherDetail || null, Remarks || null,
      branchId, req.user.id || null, req.user.name || null,
    ]
  );

  const newId = result.insertId;

  // Notify Approvers
  try {
    const approverIds = await usersWithPermission('loanpurpose.approve', req.user.id, branchId);
    if (approverIds.length > 0) {
      await notify(approverIds, {
        type: 'loanpurpose.submitted',
        title: 'नयाँ ऋण सदुपयोग विवरण प्रमाणीकरणका लागि पेश भयो',
        body: `सदस्य नं. ${MemberNo} (ऋण नं. ${LoanNo}) को ऋण सदुपयोग गर्ने विवरण पेश गरिएको छ।`,
        link: `/loan/purpose/${newId}`,
      });
    }
  } catch (err) {
    console.error('Failed to notify approvers:', err);
  }

  res.status(201).json({
    message: 'ऋण सदुपयोग गर्ने विवरण सफलतापूर्वक सुरक्षित गरियो।',
    id: newId,
  });
}));

// ── PUT /:id  –  Update record ───────────────────────────────────────────────
router.put('/:id', requirePermission('loanpurpose.edit'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loanpurposeofloans WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण सम्पादन गर्ने अधिकार छैन।' });
  }

  if (existing[0].ApprovedStatus && !req.user.permissions.includes('loanpurpose.approve')) {
    return res.status(400).json({ message: 'प्रमाणित भइसकेको विवरण सम्पादन गर्न सकिँदैन।' });
  }

  const {
    MemberNo,
    LoanNo,
    EntryDate,
    BorrowerName,
    BorrowerAddress,
    LoanPurpose,
    LoanAmount,
    LoanAmountWords,
    IncomeSource,
    LoanPurposeCategory,
    LoanPurposeDetail1,
    LoanPurposeDetail2,
    OtherDetail,
    Remarks,
  } = req.body;

  await pool.query(
    `UPDATE loanpurposeofloans
        SET MemberNo = ?, LoanNo = ?, EntryDate = ?,
            BorrowerName = ?, BorrowerAddress = ?,
            LoanPurpose = ?, LoanAmount = ?, LoanAmountWords = ?,
            IncomeSource = ?, LoanPurposeCategory = ?,
            LoanPurposeDetail1 = ?, LoanPurposeDetail2 = ?, OtherDetail = ?, Remarks = ?
      WHERE id = ?`,
    [
      MemberNo || existing[0].MemberNo,
      LoanNo || existing[0].LoanNo,
      EntryDate || null,
      BorrowerName || null,
      BorrowerAddress || null,
      LoanPurpose || null,
      LoanAmount || null,
      LoanAmountWords || null,
      IncomeSource || 'नोकरी',
      LoanPurposeCategory || '(झ) घरायसी/सामाजिक कार्य ऋण',
      LoanPurposeDetail1 || null,
      LoanPurposeDetail2 || null,
      OtherDetail || null,
      Remarks || null,
      req.params.id,
    ]
  );

  res.json({ message: 'ऋण सदुपयोग गर्ने विवरण सफलतापूर्वक अद्यावधिक गरियो।' });
}));

// ── POST /:id/approve  –  Approve record ─────────────────────────────────────
router.post('/:id/approve', requirePermission('loanpurpose.approve'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loanpurposeofloans WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण प्रमाणीकरण गर्ने अधिकार छैन।' });
  }

  const approverName = req.user.name || req.user.email;

  await pool.query(
    `UPDATE loanpurposeofloans
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
        type: 'loanpurpose.approved',
        title: 'ऋण सदुपयोग विवरण प्रमाणित भयो',
        body: `सदस्य नं. ${existing[0].MemberNo} (ऋण नं. ${existing[0].LoanNo}) को ऋण सदुपयोग विवरण ${approverName} द्वारा प्रमाणित गरिएको छ।`,
        link: `/loan/purpose/${req.params.id}`,
      });
    } catch (e) {
      console.error('Error sending approval notification:', e);
    }
  }

  res.json({
    message: 'ऋण सदुपयोग गर्ने विवरण सफलतापूर्वक प्रमाणित गरियो।',
    ApprovedStatus: 1,
    ApprovedBy: approverName,
    ApprovedAt: new Date().toISOString(),
  });
}));

// ── DELETE /:id  –  Delete record ───────────────────────────────────────────
router.delete('/:id', requirePermission('loanpurpose.delete'), wrap(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM loanpurposeofloans WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: 'विवरण फेला परेन।' });

  if (!inScope(req.user, existing[0])) {
    return res.status(403).json({ message: 'तपाईंलाई यो शाखाको विवरण मेटाउने अधिकार छैन।' });
  }

  await pool.query('DELETE FROM loanpurposeofloans WHERE id = ?', [req.params.id]);
  res.json({ message: 'ऋण सदुपयोग गर्ने विवरण सफलतापूर्वक मेटाइयो।' });
}));

export default router;
