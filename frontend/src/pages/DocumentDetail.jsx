import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Check, Pencil, Printer, X } from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { fetchStats } from '../store/documentsSlice';
import { dateTime, money } from '../utils/format';

const ACTION_TEXT = {
  SUBMITTED: 'Entered', RESUBMITTED: 'Corrected and resubmitted', APPROVED: 'Approved', REJECTED: 'Rejected', PRINTED: 'Printed',
};

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-rule py-3 last:border-0">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="col-span-2 text-sm">{children || '—'}</dd>
    </div>
  );
}

export default function DocumentDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const latestNotification = useSelector((s) => s.notifications.items[0]?.id);
  const can = (p) => me?.permissions?.includes(p);

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/documents/${id}`).then((r) => setData(r.data)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  useEffect(load, [load, latestNotification]); // reloads when a live notification arrives

  const act = async (action) => {
    setBusy(true); setError('');
    try {
      await api.post(`/documents/${id}/${action}`, { note });
      setNote('');
      load();
      dispatch(fetchStats());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) return <p className="rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading document…</p>;

  const { document: d, history } = data;
  const isOwner = d.created_by === me.id;
  const canReview = can('document.approve') && d.status === 'PENDING' && !isOwner;

  return (
    <>
      <PageHeader title={d.doc_no} subtitle={`${d.customer_name} · ${d.loan_type}`}>
        {d.status === 'REJECTED' && isOwner && can('document.create') && (
          <Link to={`/documents/${d.id}/edit`} className="btn-secondary"><Pencil size={16} />Correct and resubmit</Link>
        )}
        {d.status === 'APPROVED' && can('document.print') && (
          <Link to={`/documents/${d.id}/print`} className="btn-primary"><Printer size={16} />Print on A4</Link>
        )}
      </PageHeader>

      {error && <p role="alert" className="mb-4 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="panel px-6 py-2">
            <dl>
              <Row label="Status"><StatusBadge status={d.status} /></Row>
              <Row label="Customer">{d.customer_name}</Row>
              <Row label="Loan account">{d.loan_account_no}</Row>
              <Row label="Loan type">{d.loan_type}</Row>
              <Row label="Amount">{money(d.loan_amount)}</Row>
              <Row label="Interest rate">{d.interest_rate != null && `${d.interest_rate}% per year`}</Row>
              <Row label="Tenure">{d.tenure_months && `${d.tenure_months} months`}</Row>
              <Row label="Branch">{d.branch}</Row>
              <Row label="Purpose">{d.purpose}</Row>
              <Row label="Remarks">{d.remarks}</Row>
              <Row label="Entered by">{d.created_by_name}</Row>
              {d.reviewed_by_name && <Row label="Reviewed by">{`${d.reviewed_by_name} on ${dateTime(d.reviewed_at)}`}</Row>}
              {d.review_note && <Row label="Review note">{d.review_note}</Row>}
              <Row label="Times printed">{String(d.print_count)}</Row>
            </dl>
          </section>

          {canReview && (
            <section className="panel p-6">
              <h2 className="font-semibold">Verify this document</h2>
              <p className="mt-1 text-sm text-slate-600">Check the details above against the loan file. A note is required if you reject.</p>
              <label htmlFor="note" className="label mt-4">Note</label>
              <textarea id="note" rows={3} className="field" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="mt-4 flex gap-3">
                <button className="btn-primary" disabled={busy} onClick={() => act('approve')}><Check size={16} />Approve</button>
                <button className="btn-danger" disabled={busy} onClick={() => act('reject')}><X size={16} />Reject</button>
              </div>
            </section>
          )}
          {can('document.approve') && d.status === 'PENDING' && isOwner && (
            <p className="text-sm text-slate-600">You entered this document, so another admin needs to review it.</p>
          )}
        </div>

        <section className="panel h-fit p-6">
          <h2 className="font-semibold">History</h2>
          <ol className="mt-4 space-y-4 border-l border-rule pl-4">
            {history.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-ledger" />
                <p className="text-sm font-medium">{ACTION_TEXT[h.action] || h.action}</p>
                <p className="text-xs text-slate-500">{h.user_name} · {dateTime(h.created_at)}</p>
                {h.note && <p className="mt-1 text-sm text-slate-700">{h.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
