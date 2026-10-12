import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Eye, Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { errorMessage } from '../../api/axios';
import { membersApi } from '../../api/members';
import { selectCan } from '../../store/authSlice';

const PER_PAGE = 10;

export default function MemberDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const canCreate = useSelector(selectCan('membership.create'));
  const allBranches = useSelector(selectCan('branch.access_all'));

  const [members, setMembers] = useState([]);
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmNo, setConfirmNo] = useState(null); // row waiting for "Delete? Yes / No"
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: location.state?.message ? 'ok' : '', text: location.state?.message || '' });

  // The "saved" message comes from the form page; clear it from history so a refresh does not show it again
  useEffect(() => {
    if (location.state?.message) navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    membersApi.list()
      .then(setMembers)
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e, 'Unable to get members from the server') }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return members;
    return members.filter((m) =>
      [m.MemberNo, m.FullName, m.FullNameEng, m.MobileNo, m.CitizenshipNo, m.Email].some((v) => v?.toLowerCase().includes(t))
    );
  }, [members, term]);

  useEffect(() => { setPage(1); }, [term]);
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const remove = async (m) => {
    setBusy(true);
    try {
      await membersApi.remove(m.MemberNo);
      setMessage({ type: 'ok', text: `${m.FullNameEng || m.MemberNo} was deleted.` });
      setConfirmNo(null);
      load();
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'Unable to delete') });
    } finally {
      setBusy(false);
    }
  };

  const head = 'px-4 py-3 font-medium';
  return (
    <>
      <PageHeader title="सदस्यको विवरण" subtitle="Search, register, edit and approve members.">
        {canCreate && <Link to="/membership/new" className="btn-primary"><UserPlus size={16} />नयाँ सदस्य दर्ता</Link>}
      </PageHeader>

      {message.text && (
        <p role="alert" className={`mb-4 rounded-md px-3 py-2 text-sm ${message.type === 'ok' ? 'bg-ledger-tint text-ledger-dark' : 'bg-stamp-tint text-stamp'}`}>
          {message.text}
        </p>
      )}

      <div className="relative mb-4 w-full sm:w-80">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input type="search" className="field pl-9" placeholder="नाम, नं., मोबाइल वा नागरिकता नं." aria-label="Search members"
          value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading members…</p>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-rule bg-paper text-slate-600">
                <tr>
                  <th className={head}>सदस्य नं.</th>
                  <th className={head}>नाम</th>
                  <th className={head}>मोबाइल</th>
                  <th className={head}>ठेगाना</th>
                  {allBranches && <th className={head}>शाखा</th>}
                  <th className={head}>अवस्था</th>
                  <th className={`${head} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No members found.</td></tr>
                ) : rows.map((m) => (
                  <tr key={m.MemberNo} className="border-b border-rule last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3 font-medium tabular-nums">{m.MemberNo}</td>
                    <td className="px-4 py-3">
                      <p>{m.FullName}</p>
                      <p className="text-xs text-slate-500">{m.FullNameEng}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{m.MobileNo || '—'}</td>
                    <td className="px-4 py-3">{[m.MUNVDC, m.District].filter(Boolean).join(', ') || '—'}</td>
                    {allBranches && <td className="px-4 py-3">{m.branch_name || m.BranchID}</td>}
                    <td className="px-4 py-3"><StatusBadge status={m.ApprovedStatus === 1 ? 'APPROVED' : 'PENDING'} /></td>
                    <td className="px-4 py-3 text-right">
                      {confirmNo === m.MemberNo ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-slate-600">Delete?</span>
                          <button className="btn-danger !px-2 !py-1" disabled={busy} onClick={() => remove(m)}>Yes</button>
                          <button className="btn-secondary !px-2 !py-1" disabled={busy} onClick={() => setConfirmNo(null)}>No</button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-4">
                          <Link to={`/membership/${m.MemberNo}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline"
                            aria-label={`View ${m.MemberNo}`}><Eye size={15} />View</Link>
                          {m.can_edit && (
                            <Link to={`/membership/edit/${m.MemberNo}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline"
                              aria-label={`Edit ${m.MemberNo}`}><Pencil size={15} />Edit</Link>
                          )}
                          {/* {m.can_delete && (
                            <button className="inline-flex items-center gap-1.5 font-medium text-stamp hover:underline"
                              onClick={() => setConfirmNo(m.MemberNo)} aria-label={`Delete ${m.MemberNo}`}><Trash2 size={15} />Delete</button>
                          )} */}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} setPage={setPage} total={filtered.length} perPage={PER_PAGE} />
        </div>
      )}
    </>
  );
}
