import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Eye, Plus, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { errorMessage } from '../../api/axios';
import { loansApi } from '../../api/loans';
import { selectCan } from '../../store/authSlice';

const PER_PAGE = 10;

export default function LoanList() {
  const location = useLocation();
  const navigate = useNavigate();
  const canCreate = useSelector(selectCan('loan.create'));
  const allBranches = useSelector(selectCan('branch.access_all'));

  const [loans, setLoans] = useState([]);
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
    loansApi
      .list()
      .then(setLoans)
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e, 'Unable to get loans from server') }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return loans;
    return loans.filter((l) =>
      [l.LoanNo, l.MemberNo, l.MemberName, l.LoanType, l.LoanPurpose].some((v) =>
        v?.toLowerCase().includes(t)
      )
    );
  }, [loans, term]);

  useEffect(() => { setPage(1); }, [term]);
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const head = 'px-4 py-3 font-medium';

  return (
    <>
      <PageHeader title="ऋण विवरण" subtitle="Search, register, and approve loan details.">
        {canCreate && (
          <Link to="/loan/detail/new" className="btn-primary">
            <Plus size={16} />नयाँ ऋण दर्ता
          </Link>
        )}
      </PageHeader>

      {message.text && (
        <p
          role="alert"
          className={`mb-4 rounded-md px-3 py-2 text-sm ${
            message.type === 'ok' ? 'bg-ledger-tint text-ledger-dark' : 'bg-stamp-tint text-stamp'
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
          aria-label="Search loans"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading loans…</p>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-rule bg-paper text-slate-600">
                <tr>
                  <th className={head}>ऋण नं.</th>
                  <th className={head}>सदस्य नं.</th>
                  <th className={head}>सदस्यको नाम</th>
                  <th className={head}>ऋणको प्रकार</th>
                  <th className={head}>ऋण रकम</th>
                  <th className={head}>ऋणको उद्देश्य</th>
                  {allBranches && <th className={head}>शाखा</th>}
                  <th className={head}>अवस्था</th>
                  <th className={`${head} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      No loans found.
                    </td>
                  </tr>
                ) : (
                  rows.map((l) => (
                    <tr key={l.LoanNo} className="border-b border-rule last:border-0 hover:bg-paper/60">
                      <td className="px-4 py-3 font-medium tabular-nums">{l.LoanNo}</td>
                      <td className="px-4 py-3 tabular-nums">{l.MemberNo || '—'}</td>
                      <td className="px-4 py-3">{l.MemberName || '—'}</td>
                      <td className="px-4 py-3">{l.LoanType || '—'}</td>
                      <td className="px-4 py-3 tabular-nums">{l.LoanAmount ? `रू ${l.LoanAmount}` : '—'}</td>
                      <td className="px-4 py-3">{l.LoanPurpose || '—'}</td>
                      {allBranches && <td className="px-4 py-3">{l.branch_name || l.BranchID}</td>}
                      <td className="px-4 py-3">
                        <StatusBadge status={l.ApprovedStatus === 1 ? 'APPROVED' : 'PENDING'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/loan/detail/${l.LoanNo}`}
                          className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline"
                          aria-label={`View ${l.LoanNo}`}
                        >
                          <Eye size={15} />View
                        </Link>
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

