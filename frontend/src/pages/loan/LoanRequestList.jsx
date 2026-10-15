import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Eye, Plus, Search, Printer, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { errorMessage } from '../../api/axios';
import { loanRequestsApi } from '../../api/loanRequests';
import { selectCan } from '../../store/authSlice';

const PER_PAGE = 10;

export default function LoanRequestList() {
  const location = useLocation();
  const navigate = useNavigate();
  const canCreate = useSelector(selectCan('loanrequest.create'));
  const allBranches = useSelector(selectCan('branch.access_all'));

  const [requests, setRequests] = useState([]);
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
    loanRequestsApi
      .list()
      .then(setRequests)
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e, 'Unable to get loan requests from server') }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return requests;
    return requests.filter((r) =>
      [r.MemberNo, r.MemberName, r.LoanNo, r.LoanType, r.IncomeSource].some((v) =>
        v?.toLowerCase().includes(t)
      )
    );
  }, [requests, term]);

  useEffect(() => { setPage(1); }, [term]);
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const head = 'px-4 py-3 font-medium';

  return (
    <>
      <PageHeader title="ऋण रकम माग फारम" subtitle="Search, register, view, and print member loan requests.">
        {canCreate && (
          <Link to="/loan/request/new" className="btn-primary">
            <Plus size={16} />नयाँ माग फारम दर्ता
          </Link>
        )}
      </PageHeader>

      {message.text && (
        <p
          role="alert"
          className={`mb-4 rounded-md px-3 py-2 text-sm ${message.type === 'ok' ? 'bg-ledger-tint text-ledger-dark' : 'bg-stamp-tint text-stamp'
            }`}
        >
          {message.text}
        </p>
      )}

      <div className="relative mb-4 w-full sm:w-80">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          type="search"
          className="field pl-9"
          placeholder="ऋण नं., सदस्य नं. वा नाम..."
          aria-label="Search loan requests"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading loan requests…</p>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-rule bg-paper text-slate-600">
                <tr>
                  <th className={head}>सदस्यता नं.</th>
                  <th className={head}>सदस्यको नाम</th>
                  <th className={head}>ऋण नं.</th>
                  <th className={head}>ऋणको प्रकार</th>
                  <th className={head}>ऋण रकम</th>
                  <th className={head}>दर्ता मिति</th>
                  {allBranches && <th className={head}>शाखा</th>}
                  <th className={head}>अवस्था</th>
                  <th className={`${head} text-right`}>कार्य (Action)</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      कुनै ऋण माग फेला परेन। (No loan requests found)
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
                      <td className="px-4 py-3 font-medium tabular-nums">{r.MemberNo}</td>
                      <td className="px-4 py-3">{r.MemberName || '—'}</td>
                      <td className="px-4 py-3 font-medium tabular-nums">{r.LoanNo}</td>
                      <td className="px-4 py-3">{r.LoanType || '—'}</td>
                      <td className="px-4 py-3 tabular-nums">{r.LoanAmount ? `रू ${r.LoanAmount}` : '—'}</td>
                      <td className="px-4 py-3 tabular-nums">{r.EntryDate || '—'}</td>
                      {allBranches && <td className="px-4 py-3">{r.branch_name || r.BranchID}</td>}
                      <td className="px-4 py-3">
                        <StatusBadge status={r.ApprovedStatus === 1 ? 'APPROVED' : 'PENDING'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-3">
                          <Link
                            to={`/loan/request/${r.id}`}
                            className="inline-flex items-center gap-1 font-medium text-ledger hover:underline"
                            title="विवरण हेर्नुहोस्"
                          >
                            <Eye size={15} />View
                          </Link>
                          {r.ApprovedStatus === 1 ? (
                            <Link
                              to={`/loan/request/${r.id}/print`}
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} setPage={setPage} total={filtered.length} perPage={PER_PAGE} />
        </div>
      )}
    </>
  );
}

