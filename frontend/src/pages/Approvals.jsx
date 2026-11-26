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
import { loanPratigyaApi } from '../api/loanPratigya';
import { loanManjurinaamaApi } from '../api/loanManjurinaama';
import { loanPariwarikSwikritiApi } from '../api/loanPariwarikSwikriti';
import { loanBektigatJamaniApi } from '../api/loanBektigatJamani';
import { loanDhitoTamasukApi } from '../api/loanDhitoTamasuk';
import { loanPurposeApi } from '../api/loanPurpose';
import { loanMalpotApi } from '../api/loanMalpot';
import { loanNaapiSakhaApi } from '../api/loanNaapiSakha';
import { selectCan } from '../store/authSlice';
import { date } from '../utils/format';
import { formatNepaliCurrency } from '../utils/NepaliConverter';

// Unified Loans Waiting for Approval (Loan Detail, Loan Request, Loan Application)
function PendingLoans() {
  const allBranches = useSelector(selectCan('branch.access_all'));
  const pendingCount = useSelector((s) => s.loans?.pending || 0);

  const canApproveDetail = useSelector(selectCan('loan.approve'));
  const canApproveRequest = useSelector(selectCan('loanrequest.approve'));
  const canApproveApp = useSelector(selectCan('loanapplication.approve'));
  const canApproveRule = useSelector(selectCan('loanrule.approve'));
  const canApprovePratigya = useSelector(selectCan('loanpratigya.approve'));
  const canApproveManjurinaama = useSelector(selectCan('loanmanjurinaama.approve'));
  const canApprovePariwarik = useSelector(selectCan('loanpariwarikswikriti.approve'));
  const canApproveJamani = useSelector(selectCan('loanbektigatjamani.approve'));
  const canApproveDhito = useSelector(selectCan('loandhitotamasuk.approve'));
  const canApprovePurpose = useSelector(selectCan('loanpurpose.approve'));
  const canApproveMalpot = useSelector(selectCan('loanmalpot.approve'));
  const canApproveNaapi = useSelector(selectCan('loannaapi.approve'));

  const [subTab, setSubTab] = useState('all');
  const [loans, setLoans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [applications, setApplications] = useState([]);
  const [rules, setRules] = useState([]);
  const [pratigyas, setPratigyas] = useState([]);
  const [manjurinaamas, setManjurinaamas] = useState([]);
  const [pariwarikSwikritis, setPariwarikSwikritis] = useState([]);
  const [bektigatJamanis, setBektigatJamanis] = useState([]);
  const [dhitoTamasuks, setDhitoTamasuks] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [malpots, setMalpots] = useState([]);
  const [naapis, setNaapis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      loansApi.list({ status: 'PENDING' }),
      loanRequestsApi.list({ status: 'PENDING' }),
      loanApplicationsApi.list({ status: 'PENDING' }),
      loanRulesApi.list({ status: 'PENDING' }),
      loanPratigyaApi.list({ status: 'PENDING' }),
      loanManjurinaamaApi.list({ status: 'PENDING' }),
      loanPariwarikSwikritiApi.list({ status: 'PENDING' }),
      loanBektigatJamaniApi.list({ status: 'PENDING' }),
      loanDhitoTamasukApi.list({ status: 'PENDING' }),
      loanPurposeApi.list({ status: 'PENDING' }),
      loanMalpotApi.list({ status: 'PENDING' }),
      loanNaapiSakhaApi.list({ status: 'PENDING' }),
    ])
      .then(([lRes, rRes, aRes, ruleRes, pratigyaRes, manjuriRes, pariwarikRes, jamaniRes, dhitoRes, purposeRes, malpotRes, naapiRes]) => {
        if (lRes.status === 'fulfilled') setLoans(lRes.value || []);
        if (rRes.status === 'fulfilled') setRequests(rRes.value || []);
        if (aRes.status === 'fulfilled') setApplications(aRes.value || []);
        if (ruleRes.status === 'fulfilled') setRules(ruleRes.value || []);
        if (pratigyaRes.status === 'fulfilled') setPratigyas(pratigyaRes.value || []);
        if (manjuriRes.status === 'fulfilled') setManjurinaamas(manjuriRes.value || []);
        if (pariwarikRes.status === 'fulfilled') setPariwarikSwikritis(pariwarikRes.value || []);
        if (jamaniRes.status === 'fulfilled') setBektigatJamanis(jamaniRes.value || []);
        if (dhitoRes.status === 'fulfilled') setDhitoTamasuks(dhitoRes.value || []);
        if (purposeRes.status === 'fulfilled') setPurposes(purposeRes.value || []);
        if (malpotRes.status === 'fulfilled') setMalpots(malpotRes.value || []);
        if (naapiRes.status === 'fulfilled') setNaapis(naapiRes.value || []);
        setError('');
      })
      .catch((e) => setError(errorMessage(e, 'ऋण सम्बन्धी विवरण लोड गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [pendingCount]);

  if (loading) return <p className="text-sm text-slate-500">ऋण विवरण लोड हुँदैछ…</p>;

  const head = 'px-4 py-3 font-medium';

  const filterTabs = [
    { key: 'all', label: 'सबै (All)', count: loans.length + requests.length + applications.length + rules.length + pratigyas.length + manjurinaamas.length + pariwarikSwikritis.length + bektigatJamanis.length + dhitoTamasuks.length + purposes.length + malpots.length + naapis.length },
    { key: 'detail', label: 'ऋण विवरण (Detail)', count: loans.length },
    { key: 'request', label: 'ऋण माग (Request)', count: requests.length },
    { key: 'application', label: 'कर्जा प्रस्ताव (Application)', count: applications.length },
    { key: 'rules', label: 'ऋण शर्तहरु (Rules)', count: rules.length },
    { key: 'pratigya', label: 'प्रतिज्ञा पत्र (Pratigya)', count: pratigyas.length },
    { key: 'manjurinaama', label: 'मञ्जुरीनामा (Manjuri Naama)', count: manjurinaamas.length },
    { key: 'pariwarik', label: 'पारिवारिक स्वीकृति (Pariwarik)', count: pariwarikSwikritis.length },
    { key: 'jamani', label: 'व्यक्तिगत जमानी (Bektigat Jamani)', count: bektigatJamanis.length },
    { key: 'dhito', label: 'धितो तमसुक (Dhito Tamasuk)', count: dhitoTamasuks.length },
    { key: 'purpose', label: 'ऋण सदुपयोग (Purpose of Loan)', count: purposes.length },
    { key: 'malpot', label: 'मालपोत निवेदन (Malpot Application)', count: malpots.length },
    { key: 'naapi', label: 'नापी शाखा (Naapi Sakha)', count: naapis.length },
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

      {/* 5. Loan Pratigya Table */}
      {(subTab === 'all' || subTab === 'pratigya') && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList className="size-4 text-emerald-600" /> ऋणको प्रतिज्ञा पत्र (Loan Pratigya)
              <span className="text-xs text-slate-500 font-normal">({pratigyas.length} बाँकी)</span>
            </h4>
            <Link to="/loan/pratigya" className="text-xs text-ledger hover:underline">
              सबै प्रतिज्ञा पत्र हेर्नुहोस् →
            </Link>
          </div>
          {pratigyas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
              प्रमाणीकरण हुन बाँकी प्रतिज्ञा पत्र छैन।
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className={head}>ऋणी सदस्य</th>
                    <th className={head}>ऋण नं. / प्रकार</th>
                    <th className={head}>फारम मिति</th>
                    <th className={head}>ब्याजदर (%)</th>
                    <th className={head}>कर्मचारी</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pratigyas.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{p.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400 font-mono">सदस्य नं: {p.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{p.LoanNo}</div>
                        <div className="text-xs text-slate-400">{p.LoanType || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                        {p.EntryDate || '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-emerald-800">
                        {p.RateOfInterest ? `${p.RateOfInterest}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="text-sm font-medium">{p.StaffName || '—'}</div>
                        <div className="text-xs text-slate-400">{p.StaffPost || ''}</div>
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{p.branch_name || p.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/pratigya/${p.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
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

      {/* 6. Loan Manjurinaama Table */}
      {(subTab === 'all' || subTab === 'manjurinaama') && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList className="size-4 text-emerald-600" /> मञ्जुरीनामा (Loan Manjuri Naama)
              <span className="text-xs text-slate-500 font-normal">({manjurinaamas.length} बाँकी)</span>
            </h4>
            <Link to="/loan/manjurinaama" className="text-xs text-ledger hover:underline">
              सबै मञ्जुरीनामा हेर्नुहोस् →
            </Link>
          </div>
          {manjurinaamas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
              प्रमाणीकरण हुन बाँकी मञ्जुरीनामा छैन।
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className={head}>ऋणी सदस्य</th>
                    <th className={head}>ऋण नं. / प्रकार</th>
                    <th className={head}>जग्गाधनी (मञ्जुरी दिने)</th>
                    <th className={head}>फारम मिति</th>
                    <th className={head}>ऋण रकम</th>
                    <th className={head}>कर्मचारी</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {manjurinaamas.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{m.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400 font-mono">सदस्य नं: {m.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{m.LoanNo}</div>
                        <div className="text-xs text-slate-400">{m.LoanType || '—'}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {m.LandDhitoPersonName || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                        {m.EntryDate || '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                        {m.LoanAmount ? `रु. ${m.LoanAmount}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="text-sm font-medium">{m.StaffName || '—'}</div>
                        <div className="text-xs text-slate-400">{m.StaffPost || ''}</div>
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{m.branch_name || m.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/manjurinaama/${m.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
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

      {/* 7. Loan Pariwarik Swikriti Table */}
      {(subTab === 'all' || subTab === 'pariwarik') && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList className="size-4 text-emerald-600" /> पारिवारिक स्वीकृति फारम (Pariwarik Swikriti)
              <span className="text-xs text-slate-500 font-normal">({pariwarikSwikritis.length} बाँकी)</span>
            </h4>
            <Link to="/loan/pariwarik-swikriti" className="text-xs text-ledger hover:underline">
              सबै पारिवारिक स्वीकृति फारम हेर्नुहोस् →
            </Link>
          </div>
          {pariwarikSwikritis.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
              प्रमाणीकरण हुन बाँकी पारिवारिक स्वीकृति फारम छैन।
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className={head}>ऋणी सदस्य</th>
                    <th className={head}>ऋण नं.</th>
                    <th className={head}>हकवाला / नाता</th>
                    <th className={head}>फारम मिति</th>
                    <th className={head}>ऋण रकम</th>
                    <th className={head}>कर्मचारी</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pariwarikSwikritis.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{p.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400 font-mono">सदस्य नं: {p.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{p.LoanNo}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        <div className="font-medium">{p.RelativeName || '—'}</div>
                        <div className="text-xs text-slate-400">नाता: {p.Relationship || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                        {p.EntryDate || '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                        {p.LoanAmount ? `रु. ${p.LoanAmount}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="text-sm font-medium">{p.StaffName || '—'}</div>
                        <div className="text-xs text-slate-400">{p.StaffPost || ''}</div>
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{p.branch_name || p.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/pariwarik-swikriti/${p.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
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

      {/* 8. Loan Bektigat Jamani Table */}
      {(subTab === 'all' || subTab === 'jamani') && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList className="size-4 text-emerald-600" /> व्यक्तिगत जमानी तमसुक (Bektigat Jamani)
              <span className="text-xs text-slate-500 font-normal">({bektigatJamanis.length} बाँकी)</span>
            </h4>
            <Link to="/loan/bektigat-jamani" className="text-xs text-ledger hover:underline">
              सबै व्यक्तिगत जमानी तमसुक हेर्नुहोस् →
            </Link>
          </div>
          {bektigatJamanis.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
              प्रमाणीकरण हुन बाँकी व्यक्तिगत जमानी तमसुक छैन।
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className={head}>ऋणी सदस्य</th>
                    <th className={head}>ऋण नं. / प्रकार</th>
                    <th className={head}>जमानी दिने व्यक्ति</th>
                    <th className={head}>फारम मिति</th>
                    <th className={head}>ऋण रकम</th>
                    <th className={head}>ऋण प्रमुख / व्यवस्थापक</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bektigatJamanis.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{b.BorrowerName || b.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400 font-mono">सदस्य नं: {b.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{b.LoanNo}</div>
                        <div className="text-xs text-slate-400">{b.LoanType || '—'}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {b.JamaniName || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                        {b.EntryDate || '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                        {b.LoanAmount ? `रु. ${b.LoanAmount}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        <div>तयार: {b.LoanBhibhagPramukh || '—'}</div>
                        <div>रुजु: {b.Bhyabasthapak || '—'}</div>
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{b.branch_name || b.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/bektigat-jamani/${b.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
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

      {/* 9. Loan Dhito Tamasuk Table */}
      {(subTab === 'all' || subTab === 'dhito') && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList className="size-4 text-indigo-600" /> धितो तमसुक (Dhito Tamasuk)
              <span className="text-xs text-slate-500 font-normal">({dhitoTamasuks.length} बाँकी)</span>
            </h4>
            <Link to="/loan/dhito-tamasuk" className="text-xs text-ledger hover:underline">
              सबै धितो तमसुक हेर्नुहोस् →
            </Link>
          </div>
          {dhitoTamasuks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
              प्रमाणीकरण हुन बाँकी धितो तमसुक छैन।
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className={head}>सदस्य नं. / ऋणी नाम</th>
                    <th className={head}>ऋण नं. / प्रकार</th>
                    <th className={head}>जग्गाधनी / कित्ता नं.</th>
                    <th className={head}>फारम मिति</th>
                    <th className={head}>ऋण रकम</th>
                    <th className={head}>ऋण प्रमुख / व्यवस्थापक</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dhitoTamasuks.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{d.BorrowerName || d.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400">सदस्य नं: {d.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{d.LoanNo}</div>
                        <div className="text-xs text-slate-400">{d.LoanType || d.LoanPurpose || '—'}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        <div>{d.DhitoPerson || '—'}</div>
                        {d.DhitoKittaNo && (
                          <div className="text-xs text-slate-500">
                            कित्ता: {d.DhitoKittaNo} {d.DhitoArea ? `(${d.DhitoArea})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                        {d.EntryDate || '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                        {d.LoanAmount ? `रु. ${d.LoanAmount}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        <div>तयार: {d.LoanBhibhagPramukh || '—'}</div>
                        <div>रुजु: {d.Byabasthapak || '—'}</div>
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{d.branch_name || d.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/dhito-tamasuk/${d.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
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

      {/* Purpose of Loan (ऋण सदुपयोग) */}
      {(subTab === 'all' || subTab === 'purpose') && canApprovePurpose && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">ऋण सदुपयोग विवरण (Purpose of Loan)</h3>
            <span className="text-xs text-slate-500">{purposes.length} waiting</span>
          </div>
          {purposes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              स्वीकृत गर्न बाँकी कुनै ऋण सदुपयोग विवरण छैन।
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                  <tr>
                    <th className={head}>सदस्य नं. / ऋणी नाम</th>
                    <th className={head}>ऋण नं. / शिर्षक</th>
                    <th className={head}>फारम मिति</th>
                    <th className={head}>ऋण रकम</th>
                    <th className={head}>कुन कार्य / कसको लागि</th>
                    <th className={head}>आम्दानीको श्रोत</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purposes.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{p.BorrowerName || p.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400">सदस्य नं: {p.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{p.LoanNo}</div>
                        <div className="text-xs text-slate-400">{p.LoanPurpose || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                        {p.EntryDate || '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                        {p.LoanAmount ? `रु. ${formatNepaliCurrency(p.LoanAmount)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                        <div><span className="font-medium text-slate-700">कार्य:</span> {p.LoanPurposeDetail1 || '—'}</div>
                        <div><span className="font-medium text-slate-700">कसको:</span> {p.LoanPurposeDetail2 || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {p.IncomeSource || 'नोकरी'}
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{p.branch_name || p.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/purpose/${p.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
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

      {/* Malpot Application (मालपोत निवेदन) */}
      {(subTab === 'all' || subTab === 'malpot') && canApproveMalpot && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">मालपोत निवेदन (Malpot Application)</h3>
            <span className="text-xs text-slate-500">{malpots.length} waiting</span>
          </div>
          {malpots.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              स्वीकृत गर्न बाँकी कुनै मालपोत निवेदन छैन।
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                  <tr>
                    <th className={head}>सदस्य नं. / ऋणी नाम</th>
                    <th className={head}>ऋण नं. / चलानी नं.</th>
                    <th className={head}>फारम मिति</th>
                    <th className={head}>ऋण रकम</th>
                    <th className={head}>मालपोत कार्यालय</th>
                    <th className={head}>प्रतिनिधि</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {malpots.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{m.BorrowerName || m.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400">सदस्य नं: {m.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{m.LoanNo}</div>
                        <div className="text-xs text-slate-400">चलानी नं: {m.ChalaaniNo || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                        {m.EntryDate || '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                        {m.LoanAmount ? `रु. ${formatNepaliCurrency(m.LoanAmount)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {m.MalpotAddress || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {m.PratinidhiName || m.StaffName || '—'}
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{m.branch_name || m.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/malpot-application/${m.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
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

      {/* Naapi Sakha Application (नापी शाखा निवेदन) */}
      {(subTab === 'all' || subTab === 'naapi') && canApproveNaapi && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">नापी शाखा निवेदन (Naapi Sakha Application)</h3>
            <span className="text-xs text-slate-500">{naapis.length} waiting</span>
          </div>
          {naapis.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              स्वीकृत गर्न बाँकी कुनै नापी शाखा निवेदन छैन।
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                  <tr>
                    <th className={head}>सदस्य नं. / नाम</th>
                    <th className={head}>ऋण नं. / चलानी नं.</th>
                    <th className={head}>फारम मिति</th>
                    <th className={head}>नापी कार्यालय</th>
                    <th className={head}>नक्सा प्रकार</th>
                    <th className={head}>कित्ता नं.</th>
                    {allBranches && <th className={head}>शाखा</th>}
                    <th className={`${head} text-right`}>कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {naapis.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{n.MemberName || '—'}</div>
                        <div className="text-xs text-slate-400">सदस्य नं: {n.MemberNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{n.LoanNo}</div>
                        <div className="text-xs text-slate-400">चलानी नं: {n.ChalaaniNo || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                        {n.EntryDate || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {n.NaapiAddress || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {[n.Map1, n.Map2].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {[n.LandKittaNo1, n.LandKittaNo2].filter(Boolean).join(', ') || '—'}
                      </td>
                      {allBranches && <td className="px-4 py-3 text-xs text-slate-500">{n.branch_name || n.BranchID}</td>}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/loan/naapi-saakha/${n.id}`} className="inline-flex items-center gap-1.5 font-medium text-ledger hover:underline">
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
    return (
      p.includes('loan.approve') ||
      p.includes('loanrequest.approve') ||
      p.includes('loanapplication.approve') ||
      p.includes('loanrule.approve') ||
      p.includes('loanpratigya.approve') ||
      p.includes('loanmanjurinaama.approve') ||
      p.includes('loanpariwarikswikriti.approve') ||
      p.includes('loanbektigatjamani.approve') ||
      p.includes('loandhitotamasuk.approve') ||
      p.includes('loanpurpose.approve') ||
      p.includes('loanmalpot.approve') ||
      p.includes('loannaapi.approve')
    );
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
