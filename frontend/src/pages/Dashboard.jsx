import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../components/PageHeader';
import DocumentTable from '../components/DocumentTable';
import { fetchDocuments, fetchStats } from '../store/documentsSlice';
import { selectCan } from '../store/authSlice';

export default function Dashboard() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { items, stats, loading } = useSelector((s) => s.documents);
  const canCreate = useSelector(selectCan('document.create'));
  const canViewAll = useSelector(selectCan('document.view_all'));
  const allBranches = useSelector(selectCan('branch.access_all'));

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchDocuments({}));
  }, [dispatch]);

  const figures = [
    { label: canViewAll ? 'All documents' : 'My documents', value: stats.total, tone: 'text-ink' },
    { label: 'Awaiting approval', value: stats.PENDING, tone: 'text-amber' },
    { label: 'Approved, ready to print', value: stats.APPROVED, tone: 'text-ledger-dark' },
    { label: 'Rejected', value: stats.REJECTED, tone: 'text-stamp' },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0]}`} subtitle="Here is where your loan documents stand.">
        {canCreate && <Link to="/documents/new" className="btn-primary">New document</Link>}
      </PageHeader>

      <div className="panel mb-8 grid grid-cols-2 divide-rule lg:grid-cols-4 lg:divide-x">
        {figures.map((f) => (
          <div key={f.label} className="p-5">
            <p className={`text-3xl font-semibold tabular-nums ${f.tone}`}>{f.value}</p>
            <p className="mt-1 text-sm text-slate-600">{f.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent documents</h2>
        <Link to="/documents" className="text-sm font-medium text-ledger hover:underline">See all</Link>
      </div>
      {loading && !items.length ? (
        <p className="text-sm text-slate-500">Loading documents…</p>
      ) : (
        <DocumentTable
          documents={items.slice(0, 8)}
          showCreator={canViewAll}
          showBranch={allBranches}
          empty={canCreate ? 'No documents yet. Enter your first loan document to get started.' : 'No documents yet.'}
        />
      )}
    </>
  );
}
