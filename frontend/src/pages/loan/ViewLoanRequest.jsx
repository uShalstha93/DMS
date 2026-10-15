import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanRequestsApi } from '../../api/loanRequests';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';

const IMG_URL = import.meta.env.VITE_IMG_URL;

export default function ViewLoanRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loanrequest.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanRequestsApi.get(id)
      .then(setData)
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e, 'विवरण प्राप्त गर्न सकिएन') }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const approve = async () => {
    setBusy(true);
    try {
      await loanRequestsApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'ऋण माग फारम प्रमाणित/स्वीकृत भयो।' });
      load();
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'स्वीकृत गर्न सकिएन') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('के तपाईं यो ऋण माग फारम मेटाउन निश्चित हुनुहुन्छ?')) return;
    setBusy(true);
    try {
      await loanRequestsApi.remove(id);
      navigate('/loan/request', { state: { message: 'ऋण माग फारम मेटाइयो।' } });
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'मेटाउन सकिएन') });
      setBusy(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (!data) return <p className="p-4 text-sm text-stamp">विवरण फेला परेन।</p>;

  const { request: r, member: m, loan: l, dhitoDetail: d, branch: b, staffs } = data;
  const isApproved = r.ApprovedStatus === 1;

  const age = m?.DOB ? calculateAgeFromNepaliDate(m.DOB) : null;
  const nepaliAge = age !== null ? convertToNepaliNumber(age) : '';

  const loanOfficer = staffs?.find((s) => s.post?.includes('ऋण बिभाग प्रमुख'))?.name || 'ऋण बिभाग प्रमुख';
  const manager = staffs?.find((s) => s.post?.includes('व्यवस्थापक'))?.name || 'व्यवस्थापक';
  const committeeHead = staffs?.find((s) => s.post?.includes('संयोजक'))?.name || 'ऋण उपसमिति संयोजक';
  const president = staffs?.find((s) => s.post?.includes('अध्यक्ष'))?.name || 'अध्यक्ष';

  return (
    <>
      <PageHeader
        title="ऋण माग फारम विवरण"
        subtitle={`सदस्य नं. ${r.MemberNo} · ऋण नं. ${r.LoanNo}`}
      >
        <Link to="/loan/request" className="btn-secondary">
          <ArrowLeft size={16} />फर्कनुहोस्
        </Link>
        {r.can_edit && (
          <Link to={`/loan/request/${id}/edit`} className="btn-secondary">
            <Edit size={16} />सम्पादन गर्नुहोस्
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/request/${id}/print`} className="btn-primary">
            <Printer size={16} />A4 प्रिन्ट गर्नुहोस्
          </Link>
        )}
      </PageHeader>

      {message.text && (
        <p
          role="alert"
          className={`mb-4 rounded-md px-3 py-2 text-sm ${
            message.type === 'ok' ? 'bg-ledger-tint text-ledger-dark' : 'bg-stamp-tint text-stamp'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Left Column: Form Details View */}
        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-start justify-between border-b border-rule pb-4">
              <div>
                <h3 className="font-bold text-ink">{b?.name || 'सहकारी संस्था लिमिटेड'}</h3>
                <p className="text-xs text-slate-500">{b?.address || 'ठेगाना'}</p>
                <h2 className="mt-2 text-base font-bold text-ledger-dark underline">
                  विषय: ऋण रकम माग सम्बन्धमा।
                </h2>
              </div>
              <div className="flex h-24 w-20 items-center justify-center overflow-hidden rounded border border-rule bg-paper">
                {m?.PhotoIm ? (
                  <img src={`${IMG_URL}/membership/photo/${m.PhotoIm}`} alt="Photo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-400">फोटो</span>
                )}
              </div>
            </div>

            {/* 1. Applicant */}
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-bold text-ink">१. ऋण माग गर्नेको विवरण:</h4>
              <div className="grid gap-2 rounded border border-rule p-3 text-sm sm:grid-cols-2">
                <p><span className="text-slate-600">सदस्यता नं:</span> <span className="font-bold">{r.MemberNo}</span></p>
                <p><span className="text-slate-600">ऋण नं:</span> <span className="font-bold">{r.LoanNo}</span></p>
                <p><span className="text-slate-600">नाम:</span> <span className="font-medium">{m?.FullName || '—'}</span></p>
                <p><span className="text-slate-600">उमेर:</span> <span>{nepaliAge ? `${nepaliAge} वर्ष` : '—'}</span></p>
                <p><span className="text-slate-600">ठेगाना:</span> <span>{[m?.Tole, m?.MUNVDC, m?.District].filter(Boolean).join(', ') || '—'}</span></p>
                <p><span className="text-slate-600">मोबाइल नं:</span> <span>{m?.MobileNo || '—'}</span></p>
                <p><span className="text-slate-600">बाबुको नाम:</span> <span>{m?.FatherName || '—'}</span></p>
                <p><span className="text-slate-600">आमाको नाम:</span> <span>{m?.MotherName || '—'}</span></p>
                <p><span className="text-slate-600">बाजेको नाम:</span> <span>{m?.GrandfatherName || '—'}</span></p>
                <p><span className="text-slate-600">पति/पत्नी:</span> <span>{m?.SpouseName || '—'}</span></p>
                <p><span className="text-slate-600">नागरिकता नं:</span> <span>{m?.CitizenshipNo || '—'}</span></p>
                <p><span className="text-slate-600">जारी जिल्ला/मिति:</span> <span>{m?.CitIssuedDistrict || '—'} ({m?.CitIssuedDate ? convertToNepaliNumber(m.CitIssuedDate) : '—'})</span></p>
              </div>
            </div>

            {/* 2. Loan details */}
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-bold text-ink">२. ऋणको परियोजना विवरण:</h4>
              <div className="rounded border border-rule p-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <p><span className="text-slate-600">परियोजना वा व्यवसाय:</span> <span className="font-semibold">{l?.BusinessName || l?.LoanPurpose || '—'}</span></p>
                  <p><span className="text-slate-600">ऋणको किसिम:</span> <span>{l?.LoanType || '—'}</span></p>
                  <p><span className="text-slate-600">मेरो लगानी (श्रोत):</span> <span>{l?.IncomeSource || '—'}</span></p>
                  <p><span className="text-slate-600">ऋण रकम:</span> <span className="font-bold text-ledger-dark">रू {l?.LoanAmount || '—'}</span></p>
                  <p><span className="text-slate-600">जम्मा लागत:</span> <span>रू {l?.IncomeSourceRs || '—'}</span></p>
                </div>
                <p className="mt-2 font-medium text-slate-700">
                  अक्षरेपी: <span className="text-ledger-dark">{l?.LoanAmount ? `${convertToNepaliWords(l.LoanAmount)} मात्र` : '—'}</span>
                </p>
              </div>
            </div>

            {/* 3. Deposit Jamani */}
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-bold text-ink">३. बचत जमानतको विवरण:</h4>
              <div className="rounded border border-rule p-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <p><span className="text-slate-600">जमानी बस्ने:</span> <span className="font-medium">{l?.JamaniName || '—'}</span></p>
                  <p><span className="text-slate-600">सदस्यता नं:</span> <span>{l?.JamaniMemberNo || '—'}</span></p>
                  <p><span className="text-slate-600">ठेगाना:</span> <span>{[l?.JamaniDistrict, l?.JamaniVDCMUN, l?.JamaniWardNo].filter(Boolean).join(', ') || '—'}</span></p>
                  <p><span className="text-slate-600">कबोल रकम:</span> <span>रू {l?.JamaniTypeRs || '—'}</span></p>
                </div>
              </div>
            </div>

            {/* 4. Dhito */}
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-bold text-ink">४. धितोको विवरण:</h4>
              <div className="rounded border border-rule p-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-3">
                  <p><span className="text-slate-600">धितो दिनेको नाम:</span> <span className="font-medium">{d?.DhitoPerson || '—'}</span></p>
                  <p><span className="text-slate-600">धितो प्रकार:</span> <span>{d?.DhitoType || '—'}</span></p>
                  <p><span className="text-slate-600">कित्ता नं:</span> <span>{d?.DhitoKittaNo || '—'}</span></p>
                  <p><span className="text-slate-600">स्थान:</span> <span>{[d?.DhitoVDCMUN, d?.DhitoWardNo].filter(Boolean).join('-') || '—'}</span></p>
                  <p><span className="text-slate-600">क्षेत्रफल:</span> <span>{d?.DhitoArea || '—'}</span></p>
                  <p><span className="text-slate-600">कैफियत:</span> <span>{d?.Remarks || '—'}</span></p>
                </div>
              </div>
            </div>

            {/* 5-11 Office Recommendation Overview */}
            <div className="mt-6 rounded border border-rule bg-paper/30 p-4 text-sm">
              <h4 className="mb-3 font-bold text-ink">कार्यालय प्रयोजन विवरण (Office Review):</h4>
              <div className="space-y-2 text-slate-700">
                <p>• आम्दानीको प्रमुख श्रोत: <span className="font-semibold text-ink">{r.IncomeSource || '—'}</span></p>
                <p>• जम्मा शेयर रकम: रु. {r.TotalShareAmount || '०'} | मासिक बचत: रु. {r.TotalMonthlySaving || '०'} | नियमित बचत: {r.RegularSaving || '—'}</p>
                <p>• ऋण विभाग सिफारिश रकम: <span className="font-bold text-ledger-dark">रू {r.Sifarish8LoanAmount || '—'}</span> (मिति: {r.Sifarish8LoanDate || '—'})</p>
                <p>• व्यवस्थापक सिफारिश रकम: <span className="font-bold text-ledger-dark">रू {r.Sifarish9LoanAmount || '—'}</span> (मिति: {r.Sifarish9LoanDate || '—'})</p>
                <p>• ऋण उपसमिति स्वीकृत रकम: <span className="font-bold text-ledger-dark">रू {r.UpasamitiApprovedLoanAmount || '—'}</span> (बैठक नं. {r.UpasamitiMeetingNo || '—'}{r.UpasamitiMeetingDate ? `, बैठक मिति: ${r.UpasamitiMeetingDate}` : ''}{r.UpasamitiApprovedLoanDate ? `, निर्णय मिति: ${r.UpasamitiApprovedLoanDate}` : ''})</p>
                <p>• संचालक समिति स्वीकृत रकम: <span className="font-bold text-ledger-dark">रू {r.SanchalakApprovedLoanAmount || '—'}</span> (बैठक नं. {r.SanchalakMeetingNo || '—'}{r.SanchalakMeetingDate ? `, बैठक मिति: ${r.SanchalakMeetingDate}` : ''}{r.SanchalakApprovedLoanDate ? `, निर्णय मिति: ${r.SanchalakApprovedLoanDate}` : ''})</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Status & Verification */}
        <div className="space-y-4">
          <div className="panel p-5">
            <h3 className="mb-3 font-semibold text-ink">फारम स्थिति (Status)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">अवस्था:</span>
                <StatusBadge status={isApproved ? 'APPROVED' : 'PENDING'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">दर्ता मिति:</span>
                <span className="font-medium">{r.EntryDate || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">शाखा:</span>
                <span className="font-medium">{r.branch_name || r.BranchID}</span>
              </div>
              {isApproved && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">स्वीकृत कर्ता:</span>
                  <span className="font-medium">{r.ApprovedBy}</span>
                </div>
              )}
            </div>

            {/* Approve Button */}
            {canApprove && !isApproved && (
              <div className="mt-5 border-t border-rule pt-4">
                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="btn-primary w-full"
                  >
                    <Check size={16} />फारम प्रमाणित/स्वीकृत गर्नुहोस्
                  </button>
                ) : (
                  <div className="rounded bg-amber-tint p-3 text-sm">
                    <p className="font-medium text-amber-900">के तपाईं यो ऋण माग फारम प्रमाणित गर्न निश्चित हुनुहुन्छ?</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={approve}
                        disabled={busy}
                        className="btn-primary !px-3 !py-1 text-xs"
                      >
                        हो, स्वीकृत गरियो
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        disabled={busy}
                        className="btn-secondary !px-3 !py-1 text-xs"
                      >
                        रद्द
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Print Action when approved */}
            {isApproved && (
              <div className="mt-4 border-t border-rule pt-4">
                <Link
                  to={`/loan/request/${id}/print`}
                  className="btn-primary flex w-full items-center justify-center gap-2"
                >
                  <Printer size={16} />A4 प्रिन्ट गर्नुहोस्
                </Link>
                <p className="mt-1 text-center text-xs text-slate-500">
                  प्रमाणित भएको हुनाले २ पाना A4 साइजमा प्रिन्ट गर्न मिल्छ।
                </p>
              </div>
            )}

            {/* Delete button if permitted */}
            {r.can_delete && (
              <div className="mt-4 border-t border-rule pt-4">
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  className="inline-flex items-center gap-1 text-xs text-stamp hover:underline"
                >
                  <Trash2 size={13} />यो ऋण माग फारम मेटाउनुहोस्
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

