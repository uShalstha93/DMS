import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import Logo from '../components/Logo';
import { date, dateTime, money } from '../utils/format';

export default function DocumentPrint() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/documents/${id}`).then((r) => setDoc(r.data.document)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  // The server checks the document is approved and logs the print, then the browser dialog opens.
  const print = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await api.post(`/documents/${id}/print`);
      setDoc(data.document);
      setTimeout(() => window.print(), 100);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (error && !doc) return <p className="rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>;
  if (!doc) return <p className="text-sm text-slate-500">Loading document…</p>;

  if (doc.status !== 'APPROVED') {
    return (
      <div className="panel p-8 text-center">
        <p className="font-medium">This document cannot be printed yet.</p>
        <p className="mt-1 text-sm text-slate-600">Only approved documents can be printed.</p>
        <Link to={`/documents/${id}`} className="btn-secondary mt-4">Back to document</Link>
      </div>
    );
  }

  const rows = [
    ['Customer name', doc.customer_name],
    ['Loan account number', doc.loan_account_no],
    ['Loan type', doc.loan_type],
    ['Loan amount', money(doc.loan_amount)],
    ['Interest rate', doc.interest_rate != null ? `${doc.interest_rate}% per year` : '—'],
    ['Tenure', doc.tenure_months ? `${doc.tenure_months} months` : '—'],
    ['Branch', doc.branch],
    ['Purpose', doc.purpose || '—'],
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to={`/documents/${id}`} className="btn-secondary"><ArrowLeft size={16} />Back</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">A4 · printed {doc.print_count} time{doc.print_count === 1 ? '' : 's'}</span>
          <button className="btn-primary" onClick={print} disabled={busy}><Printer size={16} />Print</button>
        </div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>}

      <div className="overflow-x-auto rounded-lg bg-slate-300/60 p-4 sm:p-8">
        <article className="print-area a4-sheet mx-auto font-serif text-[11pt] leading-relaxed text-black shadow-lg">
          <header className="flex items-start justify-between border-b-2 border-black pb-4">
            <div className="flex items-center gap-3">
              <Logo className="h-12 w-12" />
              <div>
                <p className="text-xl font-semibold">Loan Document</p>
                <p className="text-sm">Document Management System</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{doc.doc_no}</p>
              <p>Approved {date(doc.reviewed_at)}</p>
            </div>
          </header>

          <table className="mt-8 w-full border-collapse text-left">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-b border-slate-300">
                  <th className="w-1/3 py-2 pr-4 align-top font-normal text-slate-700">{k}</th>
                  <td className="py-2 font-semibold">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {doc.remarks && (
            <section className="mt-6">
              <p className="text-slate-700">Remarks</p>
              <p className="mt-1 whitespace-pre-wrap">{doc.remarks}</p>
            </section>
          )}

          <section className="mt-24 grid grid-cols-2 gap-16 text-sm">
            <div>
              <div className="border-t border-black pt-2">
                <p className="font-semibold">{doc.created_by_name}</p>
                <p>Prepared by · {date(doc.created_at)}</p>
              </div>
            </div>
            <div>
              <div className="border-t border-black pt-2">
                <p className="font-semibold">{doc.reviewed_by_name}</p>
                <p>Approved by · {date(doc.reviewed_at)}</p>
              </div>
            </div>
          </section>

          <footer className="mt-16 border-t border-slate-300 pt-3 text-xs text-slate-600">
            Printed on {dateTime(doc.last_printed_at)} · Copy {doc.print_count}
          </footer>
        </article>
      </div>
    </>
  );
}
