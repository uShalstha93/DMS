import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Eye, FileText, ClipboardList, Send } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DocumentList from './DocumentList';
import { errorMessage } from '../api/axios';
import { membersApi } from '../api/members';
import { loansApi } from '../api/loans';
import { loanRequestsApi } from '../api/loanRequests';
import { loanApplicationsApi } from '../api/loanApplications';
import { loanRulesApi } from '../api/loanRules';
import { selectCan } from '../store/authSlice';
import { date } from '../utils/format';

// Unified Loans Waiting for Approval (Loan Detail, Loan Request, Loan Application)
function PendingLoans() {
  const allBranches = useSelector(selectCan('branch.access_all'));
  const pendingCount = useSelector((s) => s.loans?.pending || 0);

  const canApproveDetail = useSelector(selectCan('loan.approve'));
  const canApproveRequest = useSelector(selectCan('loanrequest.approve'));
  const canApproveApp = useSelector(selectCan('loanapplication.approve'));
  const canApproveRule = useSelector(selectCan('loanrule.approve'));

  const [subTab, setSubTab] = useState('all');
  const [loans, setLoans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [applications, setApplications] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      loansApi.list({ status: 'PENDING' }),
      loanRequestsApi.list({ status: 'PENDING' }),
      loanApplicationsApi.list({ status: 'PENDING' }),
      loanRulesApi.list({ status: 'PENDING' }),
    ])
      .then(([lRes, rRes, aRes, ruleRes]) => {
        if (lRes.status === 'fulfilled') setLoans(lRes.value || []);
        if (rRes.status === 'fulfilled') setRequests(rRes.value || []);
        if (aRes.status === 'fulfilled') setApplications(aRes.value || []);
        if (ruleRes.status === 'fulfilled') setRules(ruleRes.value || []);
        setError('');
      })
      .catch((e) => setError(errorMessage(e, 'ऋण सम्बन्धी विवरण लोड गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [pendingCount]);

  if (loading) return <p className="text-sm text-slate-500">ऋण विवरण लोड हुँदैछ…</p>;

  const head = 'px-4 py-3 font-medium';

  const filterTabs = [
    { key: 'all', label: 'सबै (All)', count: loans.length + requests.length + applications.length + rules.length },
    { key: 'detail', label: 'ऋण विवरण (Detail)', count: loans.length },
    { key: 'request', label: 'ऋण माग (Request)', count: requests.length },
    { key: 'application', label: 'कर्जा प्रस्ताव (Application)', count: applications.length },
    { key: 'rules', label: 'ऋण शर्तहरु (Rules)', count: rules.length },
  ];

  return (
    <>
      {error && <p role="alert" className="mb-4 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>}

      {/* Sub-tabs for loan categories */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filterTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              subTab === t.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                subTab === t.key ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 1. Loan Detail Table */}
      {(subTab === 'all' || subTab === 'detail') && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="size-4 text-brand-600" /> ऋण विवरण (Loan Details)
              <span className="text-xs text-slate-500 font-normal">({loans.length} बाँकी)</span>
            </h4>
          </div>
          {loans.length === 0 ? (
            <div className="panel px-6 py-6 text-center text-sm text-slate-400">
              प्रमाणीकरण हुन बाँकी ऋण विवरण छैन।
            </div>
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-rule bg-paper text-slate-600">
                  <tr>
                    <th className={head}>ऋण नं.</th>
                    <th className={head}>सदस्य नं.</th>
                    <th className={head}>सदस्यको नाम</th>
                    <th className={head}>ऋण प्रकार</th>
                    <th className={head}>रकम</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={head}>मिति</th>
                    <th className={`${head} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l) => (
                    <tr key={l.LoanNo} className="border-b border-rule last:border-0 hover:bg-paper/60">
                      <td className="px-4 py-3 font-medium tabular-nums text-slate-900">{l.LoanNo}</td>
                      <td className="px-4 py-3 tabular-nums">{l.MemberNo}</td>
                      <td className="px-4 py-3 font-medium">{l.MemberName || '—'}</td>
                      <td className="px-4 py-3">{l.LoanType || '—'}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold">{l.LoanAmount ? `रू ${l.LoanAmount}` : '—'}</td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{l.branch_name || l.BranchID}</td>}
                      <td className="px-4 py-3 text-xs font-mono">{l.EntryDate || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/detail/${l.LoanNo}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
                          <Eye size={15} />Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Loan Request Table */}
      {(subTab === 'all' || subTab === 'request') && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList className="size-4 text-emerald-600" /> ऋण माग फारम (Loan Requests)
              <span className="text-xs text-slate-500 font-normal">({requests.length} बाँकी)</span>
            </h4>
          </div>
          {requests.length === 0 ? (
            <div className="panel px-6 py-6 text-center text-sm text-slate-400">
              प्रमाणीकरण हुन बाँकी ऋण माग फारम छैन।
            </div>
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-rule bg-paper text-slate-600">
                  <tr>
                    <th className={head}>ऋण नं.</th>
                    <th className={head}>सदस्य नं. / नाम</th>
                    <th className={head}>माग मिति</th>
                    <th className={head}>आयश्रोत</th>
                    <th className={head}>शेयर रकम</th>
                    <th className={head}>उपसमिति स्वीकृत</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
                      <td className="px-4 py-3 font-medium tabular-nums text-slate-900">{r.LoanNo}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400">सदस्य नं: {r.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">{r.EntryDate || '—'}</td>
                      <td className="px-4 py-3">{r.IncomeSource || '—'}</td>
                      <td className="px-4 py-3 tabular-nums">{r.TotalShareAmount ? `रू ${r.TotalShareAmount}` : '—'}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-emerald-800">
                        {r.UpasamitiApprovedLoanAmount ? `रू ${r.UpasamitiApprovedLoanAmount}` : '—'}
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{r.branch_name || r.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/request/${r.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
                          <Eye size={15} />Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Loan Application Table */}
      {(subTab === 'all' || subTab === 'application') && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Send className="size-4 text-indigo-600" /> कर्जा प्रस्ताव (Loan Proposals / Applications)
              <span className="text-xs text-slate-500 font-normal">({applications.length} बाँकी)</span>
            </h4>
          </div>
          {applications.length === 0 ? (
            <div className="panel px-6 py-6 text-center text-sm text-slate-400">
              प्रमाणीकरण हुन बाँकी कर्जा प्रस्ताव छैन।
            </div>
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-rule bg-paper text-slate-600">
                  <tr>
                    <th className={head}>ऋण नं.</th>
                    <th className={head}>सदस्य नं. / नाम</th>
                    <th className={head}>प्रस्ताव मिति</th>
                    <th className={head}>स्वीकृत रकम</th>
                    <th className={head}>ब्याजदर</th>
                    <th className={head}>कर्मचारी</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr key={a.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
                      <td className="px-4 py-3 font-medium tabular-nums text-slate-900">{a.LoanNo}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{a.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400">सदस्य नं: {a.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">{a.EntryDate || '—'}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-indigo-800">
                        {a.LoanAmount ? `रू ${a.LoanAmount}` : '—'}
                      </td>
                      <td className="px-4 py-3">{a.RateOfInterest ? `${a.RateOfInterest}%` : '—'}</td>
                      <td className="px-4 py-3">
                        <div>{a.StaffName || '—'}</div>
                        <div className="text-xs text-slate-400">{a.StaffPost || ''}</div>
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{a.branch_name || a.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/application/${a.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
                          <Eye size={15} />Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Loan Rules Table */}
      {(subTab === 'all' || subTab === 'rules') && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList className="size-4 text-purple-600" /> ऋणका शर्तहरु (Loan Rules & Conditions)
              <span className="text-xs text-slate-500 font-normal">({rules.length} बाँकी)</span>
            </h4>
          </div>
          {rules.length === 0 ? (
            <div className="panel px-6 py-6 text-center text-sm text-slate-400">
              प्रमाणीकरण हुन बाँकी ऋणका शर्तहरु छैन।
            </div>
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-rule bg-paper text-slate-600">
                  <tr>
                    <th className={head}>ऋण नं.</th>
                    <th className={head}>सदस्य नं. / नाम</th>
                    <th className={head}>मिति / उपस्थित मिति</th>
                    <th className={head}>ऋण रकम</th>
                    <th className={head}>थप / हेरफेर ब्याज</th>
                    <th className={head}>परामर्श व्यक्ति २</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
                      <td className="px-4 py-3 font-medium tabular-nums text-slate-900">{rule.LoanNo}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{rule.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400">सदस्य नं: {rule.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        <div>{rule.EntryDate || '—'}</div>
                        <div className="text-slate-400">उपस्थित: {rule.VisitDate || '—'}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-purple-800">
                        {rule.LoanAmount ? `रू ${rule.LoanAmount}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div>थप: {rule.AdditionalIntRate ? `${rule.AdditionalIntRate}%` : '—'}</div>
                        <div>फेरबदल: {rule.ChangeIntRate ? `${rule.ChangeIntRate}%` : '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {rule.Person2 || '—'}
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{rule.branch_name || rule.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/rules/${rule.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
                          <Eye size={15} />Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Members waiting for approval
function PendingMembers() {
  const allBranches = useSelector(selectCan('branch.access_all'));
  const pendingCount = useSelector((s) => s.members.pending);
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
  const canLoans = useSelector((s) => {
    const p = s.auth.user?.permissions || [];
    return p.includes('loan.approve') || p.includes('loanrequest.approve') || p.includes('loanapplication.approve') || p.includes('loanrule.approve');
  });

  const docPending = useSelector((s) => s.documents.stats.PENDING);
  const memberPending = useSelector((s) => s.members.pending);
  const loanPending = useSelector((s) => s.loans?.pending || 0);
  const [params, setParams] = useSearchParams();

  const reqTab = params.get('tab');
  const allowedTabs = [
    canDocs && 'documents',
    canMembers && 'members',
    canLoans && 'loans',
  ].filter(Boolean);

  const tab = allowedTabs.includes(reqTab) ? reqTab : (allowedTabs[0] || 'documents');

  const tabs = [
    canDocs && { key: 'documents', label: 'Documents', count: docPending },
    canMembers && { key: 'members', label: 'Members', count: memberPending },
    canLoans && { key: 'loans', label: 'Loans', count: loanPending },
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Approvals" subtitle="Documents, members, and loans waiting for your review." />

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

      {tab === 'documents' && <DocumentList pendingOnly embedded />}
      {tab === 'members' && <PendingMembers />}
      {tab === 'loans' && <PendingLoans />}
    </>
  );
}
