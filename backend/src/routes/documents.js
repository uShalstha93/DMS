import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, canAccessAllBranches, requirePermission } from '../middleware/auth.js';
import { notify, usersWithPermission } from '../utils/notify.js';

const router = Router();
router.use(authenticate);

const BASE_SELECT = `
  SELECT d.*, b.name AS branch_name, b.code AS branch_code,
         cu.name AS created_by_name, ru.name AS reviewed_by_name
    FROM documents d
    JOIN branches b ON b.id = d.branch_id
    JOIN users cu ON cu.id = d.created_by
    LEFT JOIN users ru ON ru.id = d.reviewed_by`;

const canViewAll = (user) => user.permissions.includes('document.view_all');

// Who can see a document:
//  - people who work in every branch: any document
//  - everyone else: only documents of the branch they signed in to,
//    and (unless they can view all) only the ones they entered themselves
const canAccess = (user, doc) =>
  (canAccessAllBranches(user) || doc.branch_id === user.branch.id) &&
  (canViewAll(user) || doc.created_by === user.id);

// The same rule as SQL conditions, for lists and counts
function scope(user) {
  const where = [];
  const params = [];
  if (!canAccessAllBranches(user)) { where.push('d.branch_id = ?'); params.push(user.branch.id); }
  if (!canViewAll(user)) { where.push('d.created_by = ?'); params.push(user.id); }
  return { where, params };
}

async function getDoc(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE d.id = ?`, [id]);
  return rows[0];
}

async function audit(documentId, userId, action, note = null) {
  await pool.query('INSERT INTO document_audit (document_id, user_id, action, note) VALUES (?, ?, ?, ?)', [
    documentId, userId, action, note,
  ]);
}

function validate(body) {
  const errors = {};
  if (!body.customer_name?.trim()) errors.customer_name = 'Enter the customer name';
  if (!body.loan_account_no?.trim()) errors.loan_account_no = 'Enter the loan account number';
  if (!body.loan_type?.trim()) errors.loan_type = 'Choose a loan type';
  if (!(Number(body.loan_amount) > 0)) errors.loan_amount = 'Enter an amount greater than zero';
  return errors;
}

// The branch is never typed in: it is the branch the person signed in to
const pick = (b) => [
  b.loan_account_no.trim(), b.customer_name.trim(), b.loan_type.trim(), Number(b.loan_amount),
  b.interest_rate === '' || b.interest_rate == null ? null : Number(b.interest_rate),
  b.tenure_months === '' || b.tenure_months == null ? null : Number(b.tenure_months),
  b.purpose?.trim() || null, b.remarks?.trim() || null,
];

// List
router.get('/', async (req, res) => {
  const { where, params } = scope(req.user);
  if (['PENDING', 'APPROVED', 'REJECTED'].includes(req.query.status)) { where.push('d.status = ?'); params.push(req.query.status); }
  if (req.query.q) {
    where.push('(d.customer_name LIKE ? OR d.loan_account_no LIKE ? OR d.doc_no LIKE ?)');
    const like = `%${req.query.q}%`;
    params.push(like, like, like);
  }
  const [rows] = await pool.query(
    `${BASE_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY d.created_at DESC LIMIT 200`,
    params
  );
  res.json({ documents: rows });
});

router.get('/stats', async (req, res) => {
  const { where, params } = scope(req.user);
  const [rows] = await pool.query(
    `SELECT d.status, COUNT(*) AS n FROM documents d ${where.length ? 'WHERE ' + where.join(' AND ') : ''} GROUP BY d.status`,
    params
  );
  const stats = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  rows.forEach((r) => (stats[r.status] = r.n));
  res.json({ ...stats, total: stats.PENDING + stats.APPROVED + stats.REJECTED });
});

router.get('/:id', async (req, res) => {
  const doc = await getDoc(req.params.id);
  if (!doc || !canAccess(req.user, doc)) return res.status(404).json({ message: 'Document not found' });
  const [history] = await pool.query(
    `SELECT a.id, a.action, a.note, a.created_at, u.name AS user_name
       FROM document_audit a JOIN users u ON u.id = a.user_id
      WHERE a.document_id = ? ORDER BY a.id DESC`,
    [doc.id]
  );
  res.json({ document: doc, history });
});

// Operators enter a document -> status PENDING -> admins of the same branch are notified
router.post('/', requirePermission('document.create'), async (req, res) => {
  const errors = validate(req.body);
  if (Object.keys(errors).length) return res.status(422).json({ message: 'Check the highlighted fields', errors });

  const [result] = await pool.query(
    `INSERT INTO documents (doc_no, loan_account_no, customer_name, loan_type, loan_amount, interest_rate,
                            tenure_months, purpose, remarks, branch_id, created_by)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...pick(req.body), req.user.branch.id, req.user.id]
  );
  const id = result.insertId;
  await pool.query("UPDATE documents SET doc_no = CONCAT('DOC-', LPAD(id, 6, '0')) WHERE id = ?", [id]);
  await audit(id, req.user.id, 'SUBMITTED');

  const doc = await getDoc(id);
  await notify(await usersWithPermission('document.approve', req.user.id, doc.branch_id), {
    type: 'document.submitted',
    title: 'New document to verify',
    body: `${doc.doc_no} for ${doc.customer_name} was entered by ${req.user.name} (${doc.branch_name})`,
    link: `/documents/${id}`,
  });
  res.status(201).json({ document: doc });
});

// Creator fixes a rejected document and sends it back for verification
router.put('/:id', requirePermission('document.create'), async (req, res) => {
  const doc = await getDoc(req.params.id);
  if (!doc || doc.created_by !== req.user.id) return res.status(404).json({ message: 'Document not found' });
  if (doc.status !== 'REJECTED') return res.status(409).json({ message: 'Only rejected documents can be edited' });

  const errors = validate(req.body);
  if (Object.keys(errors).length) return res.status(422).json({ message: 'Check the highlighted fields', errors });

  await pool.query(
    `UPDATE documents SET loan_account_no=?, customer_name=?, loan_type=?, loan_amount=?, interest_rate=?,
            tenure_months=?, purpose=?, remarks=?, status='PENDING',
            reviewed_by=NULL, reviewed_at=NULL, review_note=NULL
      WHERE id = ?`,
    [...pick(req.body), doc.id]
  );
  await audit(doc.id, req.user.id, 'RESUBMITTED');
  await notify(await usersWithPermission('document.approve', req.user.id, doc.branch_id), {
    type: 'document.submitted',
    title: 'Document resubmitted',
    body: `${doc.doc_no} was corrected by ${req.user.name}`,
    link: `/documents/${doc.id}`,
  });
  res.json({ document: await getDoc(doc.id) });
});

async function review(req, res, status) {
  const doc = await getDoc(req.params.id);
  // A reviewer can only act on documents they are allowed to see (their own branch)
  if (!doc || !canAccess(req.user, doc)) return res.status(404).json({ message: 'Document not found' });
  if (doc.status !== 'PENDING') return res.status(409).json({ message: 'This document has already been reviewed' });
  if (doc.created_by === req.user.id) return res.status(403).json({ message: 'You cannot review a document you entered' });

  const note = req.body?.note?.trim() || null;
  if (status === 'REJECTED' && !note) return res.status(422).json({ message: 'Add a note explaining the rejection' });

  await pool.query('UPDATE documents SET status=?, reviewed_by=?, reviewed_at=NOW(), review_note=? WHERE id=?', [
    status, req.user.id, note, doc.id,
  ]);
  await audit(doc.id, req.user.id, status, note);
  await notify([doc.created_by], {
    type: status === 'APPROVED' ? 'document.approved' : 'document.rejected',
    title: status === 'APPROVED' ? 'Document approved' : 'Document rejected',
    body: `${doc.doc_no} was ${status.toLowerCase()} by ${req.user.name}${note ? `: ${note}` : ''}`,
    link: `/documents/${doc.id}`,
  });
  res.json({ document: await getDoc(doc.id) });
}

router.post('/:id/approve', requirePermission('document.approve'), (req, res) => review(req, res, 'APPROVED'));
router.post('/:id/reject', requirePermission('document.approve'), (req, res) => review(req, res, 'REJECTED'));

// Only approved documents can be printed. The print is logged before the browser dialog opens.
router.post('/:id/print', requirePermission('document.print'), async (req, res) => {
  const doc = await getDoc(req.params.id);
  if (!doc || !canAccess(req.user, doc)) return res.status(404).json({ message: 'Document not found' });
  if (doc.status !== 'APPROVED') return res.status(403).json({ message: 'Only approved documents can be printed' });

  await pool.query('UPDATE documents SET print_count = print_count + 1, last_printed_at = NOW() WHERE id = ?', [doc.id]);
  await audit(doc.id, req.user.id, 'PRINTED');
  res.json({ document: await getDoc(doc.id) });
});

export default router;
