import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Eye, Plus, Search, Printer, CheckCircle, FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { errorMessage } from '../../api/axios';
import { loanApplicationsApi } from '../../api/loanApplications';
import { selectCan } from '../../store/authSlice';

const PER_PAGE = 10;

export default function LoanApplicationList() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  // Allow creation if user has loanapplication.create or loan.create or is Admin/Administrator
  const canCreate = useSelector(selectCan('loanapplication.create'));
  const allBranches = useSelector(selectCan('branch.access_all'));

  const [applications, setApplications] = useState([]);
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
    loanApplicationsApi
      .list()
      .then(setApplications)
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e, 'Unable to get loan applications from server') }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return applications;
    return applications.filter((r) =>
      [r.MemberNo, r.MemberName, r.LoanNo, r.LoanType, r.StaffName, r.StaffPost].some((v) =>
        v?.toLowerCase().includes(t)
      )
    );
  }, [applications, term]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <>
      <PageHeader
        title="कर्जा प्रस्ताव (Loan Application / Proposal)"
        subtitle="स्वीकृत ऋणका लागि सदस्यलाई दिइने कर्जा प्रस्ताव / पत्रको सूची">
        {canCreate && (
          <Link to="/loan/application/new" className="btn-primary">
            <Plus className="size-4" /> नयाँ कर्जा प्रस्ताव
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
            placeholder="सदस्य नं., नाम, ऋण नं. वा कर्मचारी..."
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">सदस्य नं. / नाम</th>
                <th className="px-4 py-3">ऋण नं. / प्रकार</th>
                <th className="px-4 py-3">मिति</th>
                <th className="px-4 py-3">ऋण रकम (रु.)</th>
                <th className="px-4 py-3">ब्याजदर</th>
                <th className="px-4 py-3">कर्मचारी</th>
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
                    कुनै कर्जा प्रस्ताव फेला परेन।
                  </td>
                </tr>
              ) : (
                slice.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.MemberName || '—'}</div>
                      <div className="text-xs text-slate-400">सदस्य नं: {r.MemberNo}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.LoanNo}</div>
                      <div className="text-xs text-slate-400">{r.LoanType || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{r.EntryDate || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.LoanAmount ? `रु. ${r.LoanAmount}` : '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.RateOfInterest ? `${r.RateOfInterest}%` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-900">{r.StaffName || '—'}</div>
                      <div className="text-xs text-slate-400">{r.StaffPost || ''}</div>
                    </td>
                    {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{r.branch_name || r.BranchID || '—'}</td>}
                    <td className="px-4 py-3">
                      <StatusBadge status={r.ApprovedStatus ? 'APPROVED' : 'PENDING'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-3">
                        <Link
                          to={`/loan/application/${r.id}`}
                          className="inline-flex items-center gap-1 font-medium text-ledger hover:underline"
                          title="विवरण हेर्नुहोस्"
                        >
                          <Eye size={15} />View
                        </Link>
                        {r.ApprovedStatus === 1 ? (
                          <Link
                            to={`/loan/application/print/${r.id}`}
                            className="inline-flex items-center gap-1 font-medium text-ink hover:text-ledger hover:underline"
                            title="प्रिन्ट गर्नुहोस्"
                          >
                            <Printer size={15} />Print
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400" title="स्वीकृत भएपछि मात्र प्रिन्ट गर्न सकिन्छ">
                            (प्रिन्ट अप्रुभपछि)
                          </span>
                        )}
                      </span>
                      {/* <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/loan/application/${r.id}`}
                          title="विवरण हेर्नुहोस्"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Eye className="size-4" />View
                        </Link>
                        <Link
                          to={`/loan/application/print/${r.id}`}
                          title="प्रिन्ट गर्नुहोस्"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                        >
                          <Printer className="size-4" />
                        </Link>
                      </div> */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={currentPage}
          pages={totalPages}
          total={filtered.length}
          perPage={PER_PAGE}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}

