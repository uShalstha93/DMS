import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

// 1 … 4 5 6 … 20  (first, last, and the pages around the current one)
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap-' + p, p] : [p]));
}

export default function MemberPagination({ itemsPerPage, Data }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(Data.length / itemsPerPage));

  // A new search can leave fewer pages than the one you were on
  useEffect(() => { setPage(1); }, [Data]);

  const start = (page - 1) * itemsPerPage;
  const items = Data.slice(start, start + itemsPerPage);

  const head = 'px-4 py-3 font-medium';
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-rule bg-paper text-slate-600">
            <tr>
              <th className={head}>सदस्यता नं.</th>
              <th className={head}>सदस्यको नाम</th>
              <th className={head}>नाम (अंग्रेजीमा)</th>
              <th className={head}>इमेल</th>
              <th className={head}>सम्पर्क नं.</th>
              <th className={head}>अवस्था</th>
              <th className={`${head} text-right`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((m) => (
              <tr key={m.MemberNo} className="border-b border-rule last:border-0 hover:bg-paper/60">
                <td className="px-4 py-3 font-medium tabular-nums">{m.MemberNo}</td>
                <td className="px-4 py-3">{m.FullName}</td>
                <td className="px-4 py-3">{m.FullNameEng}</td>
                <td className="px-4 py-3">{m.Email}</td>
                <td className="px-4 py-3 tabular-nums">{m.MobileNo}</td>
                <td className="px-4 py-3"><StatusBadge status={m.ApprovedStatus === 1 ? 'APPROVED' : 'PENDING'} /></td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/membership/${m.MemberNo}`}
                    className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline"
                    aria-label={`View member ${m.MemberNo}`}
                  >
                    <Eye size={16} />View
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">No members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {Data.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3 text-sm">
          <p className="text-slate-600">
            Showing {start + 1}–{Math.min(start + itemsPerPage, Data.length)} of {Data.length}
          </p>
          <nav className="flex items-center gap-1" aria-label="Pagination">
            <button className="btn-secondary !px-2 !py-1" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
              <ChevronLeft size={16} />
            </button>
            {pageList(page, totalPages).map((p) =>
              typeof p === 'string' ? (
                <span key={p} className="px-1 text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={`min-w-[32px] rounded-md px-2 py-1 ${p === page ? 'bg-ink text-white' : 'hover:bg-paper'}`}
                >
                  {p}
                </button>
              )
            )}
            <button className="btn-secondary !px-2 !py-1" disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
