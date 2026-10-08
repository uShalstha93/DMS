import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, UserPlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import MemberPagination from './MemberPagination';
import { errorMessage } from '../../api/axios';
import { branchIdOf, canSeeAllBranches, membersApi } from '../../api/members';

// Pending members first, approved ones after
const pendingFirst = (a, b) => (a.ApprovedStatus === 1) - (b.ApprovedStatus === 1);

export default function MemberDetail() {
  const user = useSelector((s) => s.auth.user);
  const canCreate = user?.permissions?.includes('membership.create');
  const all = canSeeAllBranches(user);
  const branchId = branchIdOf(user);

  const [members, setMembers] = useState([]);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    membersApi
      .list({ all, branchId })
      .then((list) => { if (alive) { setMembers([...list].sort(pendingFirst)); setError(''); } })
      .catch((e) => alive && setError(errorMessage(e, 'Unable to get data from server!')))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [all, branchId]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return members;
    return members.filter((m) =>
      m.FullName?.toLowerCase().includes(t) ||
      m.FullNameEng?.toLowerCase().includes(t) ||
      m.MobileNo?.includes(t) ||
      m.MemberNo?.toString().includes(t) ||
      m.CitizenshipNo?.toLowerCase().includes(t)
    );
  }, [members, term]);

  return (
    <>
      <PageHeader title="सदस्यको विवरण" subtitle="Search, register and approve members.">
        {/* Not wired up in the original screen either, so shown but disabled */}
        <button className="btn-secondary" disabled title="Coming soon">Download Format</button>
        <button className="btn-secondary" disabled title="Coming soon">Import From Excel</button>
        {canCreate && (
          <Link to="/membership/new" className="btn-primary"><UserPlus size={16} />नया दर्ता</Link>
        )}
      </PageHeader>

      <div className="relative mb-4 w-full sm:w-80">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          type="search"
          className="field pl-9"
          placeholder="सदस्य खोज्नुहोस"
          aria-label="Search members"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      {error && <p role="alert" className="mb-4 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Loading members…</p>
      ) : (
        <MemberPagination itemsPerPage={10} Data={filtered} />
      )}
    </>
  );
}
