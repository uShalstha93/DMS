import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Eye, Plus, Search, Printer } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { errorMessage } from '../../api/axios';
import { loanDhitoTamasukApi } from '../../api/loanDhitoTamasuk';
import { selectCan } from '../../store/authSlice';

const PER_PAGE = 10;

export default function LoanDhitoTamasukList() {
  const location = useLocation();
  const navigate = useNavigate();
  const canCreate = useSelector(selectCan('loandhitotamasuk.create'));
  const allBranches = useSelector(selectCan('branch.access_all'));

  const [tamasuks, setTamasuks] = useState([]);
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
    loanDhitoTamasukApi
      .list()
      .then(setTamasuks)
      .catch((e) =>
        setMessage({
          type: 'error',
          text: errorMessage(e, 'धितो तमसुकको सूची प्राप्त गर्न सकिएन।'),
        })
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return tamasuks;
    return tamasuks.filter((r) =>
      [
        r.MemberNo,
        r.MemberName,
        r.LoanNo,
        r.LoanType,
        r.BorrowerName,
        r.DhitoPerson,
        r.DhitoKittaNo,
      ].some((v) => v?.toLowerCase().includes(t))
    );
  }, [tamasuks, term]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <>
      <PageHeader
        title="धितो तमसुक (Dhito Tamasuk)"
        subtitle="जग्गा धितो राखी ऋण लगानी गर्दा तयार गरिने आधिकारिक कानूनी धितो तमसुकको सूची"
      >
        {canCreate && (
          <Link to="/loan/dhito-tamasuk/new" className="btn-primary">
            <Plus className="size-4" /> नयाँ धितो तमसुक दर्ता
          </Link>
        )}
      </PageHeader>

      {message.text && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-4 flex items-center justify-between rounded-md p-3 text-sm ${
            message.type === 'ok'
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
            placeholder="सदस्य नं., ऋणी नाम, ऋण नं., जग्गाधनी..."
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
                <th className="px-4 py-3">ऋण नं. / प्रकार</th>
                <th className="px-4 py-3">जग्गाधनी / कित्ता नं.</th>
                <th className="px-4 py-3">फारम मिति</th>
                <th className="px-4 py-3">ऋण रकम (रु.)</th>
                <th className="px-4 py-3">ऋण प्रमुख / व्यवस्थापक</th>
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
                    कुनै धितो तमसुक फेला परेन।
                  </td>
                </tr>
              ) : (
                slice.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {r.BorrowerName || r.MemberName || '—'}
                      </div>
                      <div className="text-xs text-slate-400">सदस्य नं: {r.MemberNo}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.LoanNo}</div>
                      <div className="text-xs text-slate-400">{r.LoanType || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.DhitoPerson || '—'}</div>
                      {r.DhitoKittaNo && (
                        <div className="text-xs text-slate-500">
                          कित्ता: {r.DhitoKittaNo} {r.DhitoArea ? `(${r.DhitoArea})` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">
                      {r.EntryDate || '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                      {r.LoanAmount ? `रु. ${r.LoanAmount}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>तयार: {r.LoanBhibhagPramukh || '—'}</div>
                      <div>रुजु: {r.Byabasthapak || '—'}</div>
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
                          to={`/loan/dhito-tamasuk/${r.id}`}
                          className="inline-flex items-center gap-1 font-medium text-ledger hover:underline"
                        >
                          <Eye size={13} /> View
                        </Link>
                        {r.ApprovedStatus === 1 ? (
                          <Link
                            to={`/loan/dhito-tamasuk/${r.id}/print`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-ink hover:text-ledger hover:underline"
                          >
                            <Printer size={13} /> Print
                          </Link>
                        ) : (
                          <span
                            className="text-xs text-slate-400"
                            title="स्वीकृत भएपछि मात्र प्रिन्ट गर्न सकिन्छ"
                          >
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
