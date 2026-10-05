const STYLES = {
  PENDING: 'bg-amber-tint text-amber',
  APPROVED: 'bg-ledger-tint text-ledger-dark',
  REJECTED: 'bg-stamp-tint text-stamp',
};
const LABELS = { PENDING: 'Awaiting approval', APPROVED: 'Approved', REJECTED: 'Rejected' };

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
