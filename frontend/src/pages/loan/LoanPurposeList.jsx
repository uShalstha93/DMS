import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Eye, Plus, Search, Printer, FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { errorMessage } from '../../api/axios';
import { loanPurposeApi } from '../../api/loanPurpose';
import { selectCan } from '../../store/authSlice';
import { formatNepaliCurrency } from '../../utils/NepaliConverter';

const PER_PAGE = 10;

export default function LoanPurposeList() {
  const location = useLocation();
  const navigate = useNavigate();
  const canCreate = useSelector(selectCan('loanpurpose.create'));
  const allBranches = useSelector(selectCan('branch.access_all'));

  const [purposes, setPurposes] = useState([]);
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({
    type: location.state?.message ? 'ok' : '',
    text: location.state?.message || '',
  });

  useEffect(() => {
    if (location.state?.message) navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    loanPurposeApi
      .list()
      .then(setPurposes)
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e, 'Unable to get loan purpose list from server') }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return purposes;
    return purposes.filter((r) =>
      [r.MemberNo, r.BorrowerName, r.MemberName, r.LoanNo, r.LoanPurpose, r.IncomeSource, r.LoanPurposeDetail1, r.LoanPurposeDetail2].some((v) =>
        v?.toLowerCase().includes(t)
      )
    );
  }, [purposes, term]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <>
      <PageHeader
        title="ऋण सदुपयोग विवरण (Purpose of Loan)"
        subtitle="ऋणीले लिएको ऋण तोकिएको उद्देश्य तथा शिर्षकमा सदुपयोग गर्ने सम्बन्धी प्रतिबद्धता तथा विवरण"
      >
        {canCreate && (
          <Link to="/loan/purpose/new" className="btn-primary">
            <Plus className="size-4" /> नयाँ ऋण सदुपयोग दर्ता
          </Link>
        )}
      </PageHeader>

      {message.text && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-4 flex items-center justify-between rounded-md p-3 text-sm ${message.type === 'ok'
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border border-red-200 bg-red-50 text-red-800'
            }`}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage({ type: '', text: '' })}
            className="text-xs font-semibold underline ml-3"
          >
            बन्द गर्नुहोस्
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(1);
            }}
            placeholder="सदस्य नं., ऋणी नाम, ऋण नं., शिर्षक..."
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">सदस्य नं. / ऋणी नाम</th>
                <th className="px-4 py-3">ऋण नं. / शिर्षक</th>
                <th className="px-4 py-3">फारम मिति</th>
                <th className="px-4 py-3">ऋण रकम (रु.)</th>
                <th className="px-4 py-3">कुन कार्य / कसको लागि</th>
                <th className="px-4 py-3">आम्दानीको श्रोत</th>
                {allBranches && <th className="px-4 py-3">शाखा</th>}
                <th className="px-4 py-3">स्थिति</th>
                <th className="px-4 py-3 text-right">कार्य</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={allBranches ? 9 : 8} className="p-8 text-center text-slate-400">
                    लोड हुँदैछ...
                  </td>
                </tr>
              ) : slice.length === 0 ? (
                <tr>
                  <td colSpan={allBranches ? 9 : 8} className="p-8 text-center text-slate-400">
                    कुनै ऋण सदुपयोग विवरण फेला परेन।
                  </td>
                </tr>
              ) : (
                slice.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.BorrowerName || r.MemberName || '—'}</div>
                      <div className="text-xs text-slate-400">सदस्य नं: {r.MemberNo}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.LoanNo}</div>
                      <div className="text-xs text-slate-400">{r.LoanPurpose || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">
                      {r.EntryDate || '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                      {r.LoanAmount ? `रु. ${formatNepaliCurrency(r.LoanAmount)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                      <div><span className="font-medium text-slate-700">कार्य:</span> {r.LoanPurposeDetail1 || '—'}</div>
                      <div><span className="font-medium text-slate-700">कसको:</span> {r.LoanPurposeDetail2 || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.IncomeSource || 'नोकरी'}
                    </td>
                    {allBranches && (
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {r.branch_name || r.BranchID}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <StatusBadge status={r.ApprovedStatus ? 'APPROVED' : 'PENDING'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/loan/purpose/${r.id}`}
                          className="inline-flex items-center gap-1 font-medium text-ledger hover:underline"
                        >
                          <Eye size={13} /> View
                        </Link>
                        {r.ApprovedStatus === 1 ? (
                          <Link
                            to={`/loan/purpose/${r.id}/print`}
                            className="inline-flex items-center gap-1 font-medium text-ink hover:text-ledger hover:underline"
                          >
                            <Printer size={13} /> Print
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400" title="स्वीकृत भएपछि मात्र प्रिन्ट गर्न सकिन्छ">
                            (प्रिन्ट अप्रुभपछि)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > PER_PAGE && (
          <div className="border-t border-slate-200 px-4 py-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </>
  );
}
