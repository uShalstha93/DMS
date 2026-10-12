import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Eye } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DocumentList from './DocumentList';
import { errorMessage } from '../api/axios';
import { membersApi } from '../api/members';
import { selectCan } from '../store/authSlice';
import { date } from '../utils/format';

// Members waiting for approval
function PendingMembers() {
  const allBranches = useSelector(selectCan('branch.access_all'));
  const pendingCount = useSelector((s) => s.members.pending); // changes whenever a member is registered or approved
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    membersApi.list({ status: 'PENDING' })
      .then((list) => { setMembers(list); setError(''); })
      .catch((e) => setError(errorMessage(e, 'Unable to load members')))
      .finally(() => setLoading(false));
  }, [pendingCount]);

  if (loading) return <p className="text-sm text-slate-500">Loading members…</p>;

  const head = 'px-4 py-3 font-medium';
  return (
    <>
      {error && <p role="alert" className="mb-4 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>}
      {members.length === 0 ? (
        <div className="panel px-6 py-12 text-center text-sm text-slate-500">No members are waiting for approval.</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-rule bg-paper text-slate-600">
              <tr>
                <th className={head}>सदस्य नं.</th>
                <th className={head}>नाम</th>
                <th className={head}>मोबाइल</th>
                <th className={head}>ठेगाना</th>
                {allBranches && <th className={head}>शाखा</th>}
                <th className={head}>Registered on</th>
                <th className={`${head} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.MemberNo} className="border-b border-rule last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3 font-medium tabular-nums">{m.MemberNo}</td>
                  <td className="px-4 py-3"><p>{m.FullName}</p><p className="text-xs text-slate-500">{m.FullNameEng}</p></td>
                  <td className="px-4 py-3 tabular-nums">{m.MobileNo || '—'}</td>
                  <td className="px-4 py-3">{[m.MUNVDC, m.District].filter(Boolean).join(', ') || '—'}</td>
                  {allBranches && <td className="px-4 py-3">{m.branch_name || m.BranchID}</td>}
                  <td className="px-4 py-3">{date(m.EntryDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/membership/${m.MemberNo}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
                      <Eye size={15} />Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function Approvals() {
  const canDocs = useSelector(selectCan('document.approve'));
  const canMembers = useSelector(selectCan('membership.approve'));
  const docPending = useSelector((s) => s.documents.stats.PENDING);
  const memberPending = useSelector((s) => s.members.pending);
  const [params, setParams] = useSearchParams();

  const wantsMembers = params.get('tab') === 'members';
  const tab = wantsMembers ? (canMembers ? 'members' : 'documents') : (canDocs ? 'documents' : 'members');

  const tabs = [
    canDocs && { key: 'documents', label: 'Documents', count: docPending },
    canMembers && { key: 'members', label: 'Members', count: memberPending },
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Approvals" subtitle="Documents and members waiting for your review." />

      {tabs.length > 1 && (
        <div className="mb-5 flex gap-1 border-b border-rule" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setParams({ tab: t.key })}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
                tab === t.key ? 'border-ledger text-ink' : 'border-transparent text-slate-500 hover:text-ink'
              }`}
            >
              {t.label}
              <span className={`rounded-full px-2 text-xs ${t.count > 0 ? 'bg-ledger text-white' : 'bg-paper text-slate-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'documents' ? <DocumentList pendingOnly embedded /> : <PendingMembers />}
    </>
  );
}
