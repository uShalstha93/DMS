import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DocumentTable from '../components/DocumentTable';
import { fetchDocuments } from '../store/documentsSlice';
import { selectCan } from '../store/authSlice';

const TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Awaiting approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function DocumentList({ pendingOnly = false }) {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((s) => s.documents);
  const canCreate = useSelector(selectCan('document.create'));
  const canViewAll = useSelector(selectCan('document.view_all'));
  const allBranches = useSelector(selectCan('branch.access_all'));
  const [status, setStatus] = useState(pendingOnly ? 'PENDING' : '');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchDocuments({ status: pendingOnly ? 'PENDING' : status, q: search }));
  }, [dispatch, status, search, pendingOnly]);

  const title = pendingOnly ? 'Approvals' : canViewAll ? 'All documents' : 'My documents';
  const subtitle = pendingOnly ? 'Documents waiting for your verification.' : 'Search and filter loan documents.';

  return (
    <>
      <PageHeader title={title} subtitle={subtitle}>
        {canCreate && !pendingOnly && <Link to="/documents/new" className="btn-primary">New document</Link>}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {!pendingOnly ? (
          <div className="flex flex-wrap gap-1" role="tablist">
            {TABS.map((t) => (
              <button key={t.value} role="tab" aria-selected={status === t.value} onClick={() => setStatus(t.value)}
                className={`rounded-md px-3 py-1.5 text-sm ${status === t.value ? 'bg-ink text-white' : 'bg-white border border-rule hover:bg-paper'}`}>
                {t.label}
              </button>
            ))}
          </div>
        ) : <span />}
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); }} className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input className="field pl-9" placeholder="Customer, account or document no." value={q}
            onChange={(e) => setQ(e.target.value)} aria-label="Search documents" />
        </form>
      </div>

      {error && <p className="mb-3 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>}
      {loading && !items.length ? (
        <p className="text-sm text-slate-500">Loading documents…</p>
      ) : (
        <DocumentTable
          documents={items}
          showCreator={canViewAll}
          showBranch={allBranches}
          empty={pendingOnly ? 'Nothing is waiting for approval right now.' : 'No documents match these filters.'}
        />
      )}
    </>
  );
}
