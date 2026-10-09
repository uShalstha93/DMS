import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { selectCan } from '../../store/authSlice';

const PER_PAGE = 10;

export default function StaffList() {
  const location = useLocation();
  const navigate = useNavigate();
  const canManage = useSelector(selectCan('staff.manage'));
  const allBranches = useSelector(selectCan('branch.access_all'));

  const [staff, setStaff] = useState([]);
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null); // row waiting for "Delete? Yes / No"
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: location.state?.message ? 'ok' : '', text: location.state?.message || '' });

  // The "saved" message comes from the form page; clear it from history so a refresh does not show it again
  useEffect(() => {
    if (location.state?.message) navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    api.get('/staff')
      .then(({ data }) => setStaff(data.staff))
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e, 'Unable to load staff') }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return staff;
    return staff.filter((s) =>
      [s.staffno, s.name, s.name_eng, s.post, s.mobileno, s.email].some((v) => v?.toLowerCase().includes(t))
    );
  }, [staff, term]);

  useEffect(() => { setPage(1); }, [term]);

  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const remove = async (s) => {
    setBusy(true);
    try {
      await api.delete(`/staff/${s.staffno}`);
      setMessage({ type: 'ok', text: `${s.name_eng} was deleted.` });
      setConfirmId(null);
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
      <PageHeader title="कर्मचारी विवरण" subtitle="Staff of the branch you are signed in to.">
        {canManage && <Link to="/staff/new" className="btn-primary"><UserPlus size={16} />नयाँ कर्मचारी</Link>}
      </PageHeader>

      {message.text && (
        <p role="alert" className={`mb-4 rounded-md px-3 py-2 text-sm ${message.type === 'ok' ? 'bg-ledger-tint text-ledger-dark' : 'bg-stamp-tint text-stamp'}`}>
          {message.text}
        </p>
      )}

      <div className="relative mb-4 w-full sm:w-80">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input type="search" className="field pl-9" placeholder="कर्मचारी खोज्नुहोस" aria-label="Search staff"
          value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading staff…</p>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-rule bg-paper text-slate-600">
                <tr>
                  <th className={head}>कर्मचारी नं.</th>
                  <th className={head}>नाम</th>
                  <th className={head}>नाम (अंग्रेजीमा)</th>
                  <th className={head}>पद</th>
                  <th className={head}>मोबाइल नं.</th>
                  <th className={head}>इमेल</th>
                  <th className={head}>ठेगाना</th>
                  {allBranches && <th className={head}>शाखा</th>}
                  {canManage && <th className={`${head} text-right`}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No staff found.</td></tr>
                ) : rows.map((s) => (
                  <tr key={s.staffno} className="border-b border-rule last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3 tabular-nums">{s.staffno}</td>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">{s.name_eng}</td>
                    <td className="px-4 py-3">{s.post}</td>
                    <td className="px-4 py-3 tabular-nums">{s.mobileno}</td>
                    <td className="px-4 py-3">{s.email || '—'}</td>
                    <td className="px-4 py-3">{s.address || '—'}</td>
                    {allBranches && <td className="px-4 py-3">{s.branch_name}</td>}
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        {confirmId === s.staffno ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-slate-600">Delete?</span>
                            <button className="btn-danger !px-2 !py-1" disabled={busy} onClick={() => remove(s)}>Yes</button>
                            <button className="btn-secondary !px-2 !py-1" disabled={busy} onClick={() => setConfirmId(null)}>No</button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-4">
                            <Link to={`/staff/edit/${s.staffno}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline"
                              aria-label={`Edit ${s.name_eng}`}>
                              <Pencil size={15} />Edit
                            </Link>
                            {/* <button className="inline-flex items-center gap-1.5 font-medium text-stamp hover:underline"
                              onClick={() => setConfirmId(s.staffno)} aria-label={`Delete ${s.name_eng}`}>
                              <Trash2 size={15} />Delete
                            </button> */}
                          </span>
                        )}
                      </td>
                    )}
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
