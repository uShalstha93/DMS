import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { date, money } from '../utils/format';

export default function DocumentTable({ documents, showCreator, showBranch, empty }) {
  if (!documents.length) {
    return <div className="panel px-6 py-12 text-center text-sm text-slate-500">{empty}</div>;
  }
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-rule bg-paper text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Document</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Loan type</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            {showBranch && <th className="px-4 py-3 font-medium">Branch</th>}
            {showCreator && <th className="px-4 py-3 font-medium">Entered by</th>}
            <th className="px-4 py-3 font-medium">Entered on</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
              <td className="px-4 py-3">
                <Link to={`/documents/${d.id}`} className="font-medium text-ledger hover:underline">{d.doc_no}</Link>
                <p className="text-xs text-slate-500">{d.loan_account_no}</p>
              </td>
              <td className="px-4 py-3">{d.customer_name}</td>
              <td className="px-4 py-3">{d.loan_type}</td>
              <td className="px-4 py-3 text-right tabular-nums">{money(d.loan_amount)}</td>
              {showBranch && <td className="px-4 py-3">{d.branch_name}</td>}
              {showCreator && <td className="px-4 py-3">{d.created_by_name}</td>}
              <td className="px-4 py-3">{date(d.created_at)}</td>
              <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
