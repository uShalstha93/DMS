import { ChevronLeft, ChevronRight } from 'lucide-react';

// 1 … 4 5 6 … 20  (first, last, and the pages around the current one)
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap-' + p, p] : [p]));
}

// Footer for tables: "Showing 1–10 of 42" + page buttons
export default function Pagination({ page, setPage, total, perPage }) {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3 text-sm">
      <p className="text-slate-600">Showing {start + 1}–{Math.min(start + perPage, total)} of {total}</p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button className="btn-secondary !px-2 !py-1" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        {pageList(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="px-1 text-slate-400">…</span>
          ) : (
            <button key={p} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined}
              className={`min-w-[32px] rounded-md px-2 py-1 ${p === page ? 'bg-ink text-white' : 'hover:bg-paper'}`}>
              {p}
            </button>
          )
        )}
        <button className="btn-secondary !px-2 !py-1" disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
