import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';
import { FIELDS, clean, validate, nextMemberNo, canEditMember } from '../utils/memberRules.js';
import { imageType, saveImage, removeImage } from '../utils/uploads.js';

const router = Router();
router.use(authenticate);

// BranchID in memberdetail is the branch CODE. The collation is set so the two tables can be compared.
const SELECT = `
  SELECT m.*, b.name AS branch_name
    FROM memberdetail m
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = m.BranchID`;

const LIST_SELECT = `
  SELECT m.MemberNo, m.FullName, m.FullNameEng, m.MobileNo, m.Email, m.CitizenshipNo,
         m.District, m.MUNVDC, m.WardNo, m.ApprovedStatus, m.BranchID, m.EntryDate, b.name AS branch_name
    FROM memberdetail m
    LEFT JOIN branches b ON b.code COLLATE utf8mb4_general_ci = m.BranchID`;

// Everyone sees members of the branch they signed in to; people with branch.access_all see every branch
const inScope = (user, member) => canAccessAllBranches(user) || member.BranchID === user.branch.code;

// Tells the screen which buttons to show
const withFlags = (user, member) => ({
  ...member,
  can_edit: canEditMember(user, member),
  can_delete: user.permissions.includes('membership.delete'),
});

async function getMember(memberNo) {
  const [rows] = await pool.query(`${SELECT} WHERE m.MemberNo = ?`, [memberNo]);
  return rows[0];
}

// ---- photo and signature upload (kept in memory, checked, then written to the uploads folder)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 2 } })
  .fields([{ name: 'photoIm', maxCount: 1 }, { name: 'signIm', maxCount: 1 }]);

const receiveFiles = (req, res, next) =>
  upload(req, res, (err) => {
    if (!err) return next();
    res.status(422).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 2 MB or smaller' : 'Could not read the uploaded files' });
  });

const COLUMN = { photo: 'PhotoIm', signature: 'SignIm' };
const FILE_FIELD = { photo: 'photoIm', signature: 'signIm' };

const pickFiles = (req) => ({ photo: req.files?.photoIm?.[0], signature: req.files?.signIm?.[0] });

function checkImages(files, errors) {
  for (const [kind, file] of Object.entries(files)) {
    if (file && !imageType(file.buffer)) errors[FILE_FIELD[kind]] = 'Only JPG or PNG images are allowed';
  }
}

// Saves the new images and removes the ones they replace
async function attachImages(memberNo, files, previous = {}) {
  for (const [kind, file] of Object.entries(files)) {
    if (!file) continue;
    const name = await saveImage(kind, memberNo, file.buffer);
    await pool.query(`UPDATE memberdetail SET ${COLUMN[kind]} = ? WHERE MemberNo = ?`, [name, memberNo]);
    await removeImage(kind, previous[COLUMN[kind]]);
  }
}

// ---- READ
router.get('/', requirePermission('membership.view'), wrap(async (req, res) => {
  const where = [];
  const params = [];
  if (!canAccessAllBranches(req.user)) { where.push('m.BranchID = ?'); params.push(req.user.branch.code); }
  const [rows] = await pool.query(
    `${LIST_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY m.ApprovedStatus ASC, m.EntryDate DESC`,
    params
  );
  res.json({ members: rows.map((m) => withFlags(req.user, m)) });
}));

router.get('/:memberNo', requirePermission('membership.view'), wrap(async (req, res) => {
  const member = await getMember(req.params.memberNo);
  if (!member || !inScope(req.user, member)) return res.status(404).json({ message: 'Member not found' });
  res.json({ member: withFlags(req.user, member) });
}));

// ---- CREATE
router.post('/', requirePermission('membership.create'), receiveFiles, wrap(async (req, res) => {
  const v = clean(req.body);
  const files = pickFiles(req);
  const errors = validate(v);
  checkImages(files, errors);
  if (Object.keys(errors).length) return res.status(422).json({ message: 'Check the highlighted fields', errors });

  // New members go to the branch you signed in to; people who work in every branch may pick one
  let branch = req.user.branch;
  if (canAccessAllBranches(req.user) && req.body.branch_id) {
    const [rows] = await pool.query('SELECT id, code, name FROM branches WHERE id = ? AND is_active = 1', [Number(req.body.branch_id)]);
    if (!rows[0]) return res.status(422).json({ message: 'Choose an active branch' });
    branch = rows[0];
  }

  const columns = Object.values(FIELDS);
  const values = Object.keys(FIELDS).map((key) => v[key] || null);
  const insert = `INSERT INTO memberdetail (MemberNo, BranchID, ${columns.join(', ')})
                  VALUES (?, ?, ${columns.map(() => '?').join(', ')})`;

  let memberNo = null;
  for (let attempt = 0; attempt < 3 && !memberNo; attempt += 1) {
    const [[{ last }]] = await pool.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(MemberNo, ?) AS UNSIGNED)), 0) AS last
         FROM memberdetail WHERE BranchID = ? AND MemberNo LIKE ?`,
      [branch.code.length + 1, branch.code, `${branch.code}%`]
    );
    const candidate = nextMemberNo(branch.code, last);
    try {
      await pool.query(insert, [candidate, branch.code, ...values]);
      memberNo = candidate;
    } catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') throw e; // two people saved at once: try the next number
    }
  }
  if (!memberNo) return res.status(409).json({ message: 'Could not create a member number. Try again' });

  await attachImages(memberNo, files);
  res.status(201).json({ member: withFlags(req.user, await getMember(memberNo)) });
}));

// ---- UPDATE (member number, branch, approval and entry date never change here)
router.put('/:memberNo', requirePermission('membership.edit'), receiveFiles, wrap(async (req, res) => {
  const member = await getMember(req.params.memberNo);
  if (!member || !inScope(req.user, member)) return res.status(404).json({ message: 'Member not found' });
  if (!canEditMember(req.user, member)) {
    return res.status(403).json({ message: 'An approved member can only be changed by someone who can approve members' });
  }

  const v = clean(req.body);
  const files = pickFiles(req);
  const errors = validate(v);
  checkImages(files, errors);
  if (Object.keys(errors).length) return res.status(422).json({ message: 'Check the highlighted fields', errors });

  const sets = Object.values(FIELDS).map((column) => `${column} = ?`).join(', ');
  await pool.query(
    `UPDATE memberdetail SET ${sets}, ModifiedDate = NOW() WHERE MemberNo = ?`,
    [...Object.keys(FIELDS).map((key) => v[key] || null), member.MemberNo]
  );
  await attachImages(member.MemberNo, files, member);
  res.json({ member: withFlags(req.user, await getMember(member.MemberNo)) });
}));

// ---- APPROVE
router.post('/:memberNo/approve', requirePermission('membership.approve'), wrap(async (req, res) => {
  const member = await getMember(req.params.memberNo);
  if (!member || !inScope(req.user, member)) return res.status(404).json({ message: 'Member not found' });
  if (member.ApprovedStatus === 1) return res.status(409).json({ message: 'This member is already approved' });

  await pool.query(
    'UPDATE memberdetail SET ApprovedStatus = 1, ApprovedBy = ?, ModifiedDate = NOW() WHERE MemberNo = ?',
    [req.user.name, member.MemberNo]
  );
  res.json({ member: withFlags(req.user, await getMember(member.MemberNo)) });
}));

// ---- DELETE
router.delete('/:memberNo', requirePermission('membership.delete'), wrap(async (req, res) => {
  const member = await getMember(req.params.memberNo);
  if (!member || !inScope(req.user, member)) return res.status(404).json({ message: 'Member not found' });

  await pool.query('DELETE FROM memberdetail WHERE MemberNo = ?', [member.MemberNo]);
  await removeImage('photo', member.PhotoIm);
  await removeImage('signature', member.SignIm);
  res.json({ ok: true });
}));

export default router;
