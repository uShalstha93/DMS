import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Loader2, Save, Printer } from 'lucide-react';
import { NepaliInput } from '@itzsa/nepali-input';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import PageHeader from '../../components/PageHeader';
import { loanRequestsApi } from '../../api/loanRequests';
import { errorMessage } from '../../api/axios';

const IMG_URL = import.meta.env.VITE_IMG_URL;

const validationSchema = Yup.object().shape({
  memberno: Yup.string().required('सदस्यता नं. आवश्यक छ'),
  loanNo: Yup.string().required('ऋण नं. आवश्यक छ'),
  entryDate: Yup.string().required('मिति आवश्यक छ'),
});

export default function LoanRequestForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const myBranch = useSelector((s) => s.auth.user?.branch);

  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedMemberNo, setSelectedMemberNo] = useState('');
  const [selectedLoanNo, setSelectedLoanNo] = useState('');

  const [memberDetail, setMemberDetail] = useState(null);
  const [loanDetail, setLoanDetail] = useState(null);
  const [dhitoDetail, setDhitoDetail] = useState(null);
  const [branchDetail, setBranchDetail] = useState(null);
  const [staffList, setStaffList] = useState([]);

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Load initial members list for select/autocomplete
  useEffect(() => {
    loanRequestsApi.members()
      .then((m) => setMembers(m || []))
      .catch((e) => console.error('Error fetching members:', e));
  }, []);

  // 2. If editing existing request, load data
  useEffect(() => {
    if (!editing) {
      setInitialData({
        memberno: '',
        loanNo: '',
        entryDate: '',
        incomeSource: 'व्यापार/ब्यबसाय',
        totalShareAmount: '',
        totalMonthlySaving: '',
        monthlySavingRate: '',
        depositUptoDate: '',
        regularSaving: '',
        hasDailySaving: 'छैन',
        hasChildSaving: 'छैन',
        hasFixedSaving: 'छैन',
        hasOtherSaving: 'छैन',
        hasRemainingLoan: 'छैन',
        remainingInterest: '',
        hasOptionalSavingTrans: 'नभएको',
        hasGivenDhitoOrJamani: 'नदिएको',
        conditionOfOldLoan: 'राम्रो',
        otherCondition: '',
        sifarish8LoanAmount: '',
        sifarish8LoanDate: '',
        sifarish9LoanAmount: '',
        sifarish9LoanDate: '',
        upasamitiMeetingDate: '',
        upasamitiMeetingNo: '',
        upasamitiApprovedLoanAmount: '',
        upasamitiApprovedLoanDate: '',
        sanchalakMeetingDate: '',
        sanchalakMeetingNo: '',
        sanchalakApprovedLoanAmount: '',
        sanchalakApprovedLoanDate: '',
      });
      setLoading(false);
      return;
    }

    loanRequestsApi.get(id)
      .then((data) => {
        const req = data.request;
        setSelectedMemberNo(req.MemberNo);
        setSelectedLoanNo(req.LoanNo);
        setMemberDetail(data.member);
        setLoanDetail(data.loan);
        setDhitoDetail(data.dhitoDetail);
        setBranchDetail(data.branch);
        setStaffList(data.staffs || []);

        setInitialData({
          memberno: req.MemberNo || '',
          loanNo: req.LoanNo || '',
          entryDate: req.EntryDate || '',
          incomeSource: req.IncomeSource || 'व्यापार/ब्यबसाय',
          totalShareAmount: req.TotalShareAmount || '',
          totalMonthlySaving: req.TotalMonthlySaving || '',
          monthlySavingRate: req.MonthlySavingRate || '',
          depositUptoDate: req.DepositUptoDate || '',
          regularSaving: req.RegularSaving || '',
          hasDailySaving: req.HasDailySaving ? 'छ' : 'छैन',
          hasChildSaving: req.HasChildSaving ? 'छ' : 'छैन',
          hasFixedSaving: req.HasFixedSaving ? 'छ' : 'छैन',
          hasOtherSaving: req.HasOtherSaving ? 'छ' : 'छैन',
          hasRemainingLoan: req.HasRemainingLoan ? 'छ' : 'छैन',
          remainingInterest: req.RemainingInterest || '',
          hasOptionalSavingTrans: req.HasOptSavingTrans ? 'भएको' : 'नभएको',
          hasGivenDhitoOrJamani: req.HasGivenDhitoOrJamani ? 'दिएको' : 'नदिएको',
          conditionOfOldLoan: req.ConditionOfOldLoan || 'राम्रो',
          otherCondition: req.OtherCondition || '',
          sifarish8LoanAmount: req.Sifarish8LoanAmount || '',
          sifarish8LoanDate: req.Sifarish8LoanDate || '',
          sifarish9LoanAmount: req.Sifarish9LoanAmount || '',
          sifarish9LoanDate: req.Sifarish9LoanDate || '',
          upasamitiMeetingDate: req.UpasamitiMeetingDate || '',
          upasamitiMeetingNo: req.UpasamitiMeetingNo || '',
          upasamitiApprovedLoanAmount: req.UpasamitiApprovedLoanAmount || '',
          upasamitiApprovedLoanDate: req.UpasamitiApprovedLoanDate || '',
          sanchalakMeetingDate: req.SanchalakMeetingDate || '',
          sanchalakMeetingNo: req.SanchalakMeetingNo || '',
          sanchalakApprovedLoanAmount: req.SanchalakApprovedLoanAmount || '',
          sanchalakApprovedLoanDate: req.SanchalakApprovedLoanDate || '',
        });

        // Also fetch loans list for this member
        loanRequestsApi.loansForMember(req.MemberNo)
          .then((lList) => setLoans(lList || []))
          .catch(() => { });
      })
      .catch((e) => setError(errorMessage(e, 'Unable to load loan request')))
      .finally(() => setLoading(false));
  }, [id, editing]);

  // When Member changes: fetch member's loans and full context
  const handleMemberChange = async (memberNo, setFieldValue) => {
    setSelectedMemberNo(memberNo);
    setFieldValue('memberno', memberNo);
    setFieldValue('loanNo', '');
    setSelectedLoanNo('');
    setLoanDetail(null);
    setDhitoDetail(null);

    if (!memberNo) {
      setLoans([]);
      setMemberDetail(null);
      return;
    }

    try {
      const lList = await loanRequestsApi.loansForMember(memberNo);
      setLoans(lList || []);
      if (lList && lList.length === 1) {
        // If only 1 loan, auto select it!
        handleLoanNoChange(lList[0].LoanNo, memberNo, setFieldValue);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // When Loan changes: fetch composite context (member, loan, dhito, staff)
  const handleLoanNoChange = async (loanNo, memberNo, setFieldValue) => {
    const mem = memberNo || selectedMemberNo;
    setSelectedLoanNo(loanNo);
    setFieldValue('loanNo', loanNo);

    if (!loanNo || !mem) return;

    try {
      const ctx = await loanRequestsApi.context(mem, loanNo);
      setMemberDetail(ctx.member);
      setLoanDetail(ctx.loan);
      setDhitoDetail(ctx.dhitoDetail);
      setBranchDetail(ctx.branch);
      setStaffList(ctx.staffs || []);
      // If loan already has business name / purpose, preset some defaults
      if (ctx.loan?.LoanAmount && !setFieldValue.sifarish8LoanAmount) {
        setFieldValue('sifarish8LoanAmount', ctx.loan.LoanAmount);
        setFieldValue('sifarish9LoanAmount', ctx.loan.LoanAmount);
        setFieldValue('upasamitiApprovedLoanAmount', ctx.loan.LoanAmount);
        setFieldValue('sanchalakApprovedLoanAmount', ctx.loan.LoanAmount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Staff post finders
  const loanOfficer = staffList.find((s) => s.post?.includes('ऋण बिभाग प्रमुख'))?.name || 'ऋण बिभाग प्रमुख';
  const manager = staffList.find((s) => s.post?.includes('व्यवस्थापक'))?.name || 'व्यवस्थापक';
  const committeeHead = staffList.find((s) => s.post?.includes('संयोजक'))?.name || 'ऋण उपसमिति संयोजक';
  const president = staffList.find((s) => s.post?.includes('अध्यक्ष'))?.name || 'अध्यक्ष';

  // Age calculation
  const calculatedAge = memberDetail?.DOB ? calculateAgeFromNepaliDate(memberDetail.DOB) : null;
  const nepaliAge = calculatedAge !== null ? convertToNepaliNumber(calculatedAge) : '';

  const submit = async (values) => {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        MemberNo: values.memberno,
        LoanNo: values.loanNo,
        EntryDate: values.entryDate,
        IncomeSource: values.incomeSource,
        TotalShareAmount: values.totalShareAmount,
        TotalMonthlySaving: values.totalMonthlySaving,
        MonthlySavingRate: values.monthlySavingRate,
        DepositUptoDate: values.depositUptoDate,
        RegularSaving: values.regularSaving,
        HasDailySaving: values.hasDailySaving === 'छ',
        HasChildSaving: values.hasChildSaving === 'छ',
        HasFixedSaving: values.hasFixedSaving === 'छ',
        HasOtherSaving: values.hasOtherSaving === 'छ',
        HasRemainingLoan: values.hasRemainingLoan === 'छ',
        RemainingInterest: values.remainingInterest,
        HasOptSavingTrans: values.hasOptionalSavingTrans === 'भएको',
        HasGivenDhitoOrJamani: values.hasGivenDhitoOrJamani === 'दिएको',
        ConditionOfOldLoan: values.conditionOfOldLoan,
        OtherCondition: values.otherCondition,
        Sifarish8LoanAmount: values.sifarish8LoanAmount,
        Sifarish8LoanDate: values.sifarish8LoanDate,
        Sifarish9LoanAmount: values.sifarish9LoanAmount,
        Sifarish9LoanDate: values.sifarish9LoanDate,
        UpasamitiMeetingDate: values.upasamitiMeetingDate,
        UpasamitiMeetingNo: values.upasamitiMeetingNo,
        UpasamitiApprovedLoanAmount: values.upasamitiApprovedLoanAmount,
        UpasamitiApprovedLoanDate: values.upasamitiApprovedLoanDate,
        SanchalakMeetingDate: values.sanchalakMeetingDate,
        SanchalakMeetingNo: values.sanchalakMeetingNo,
        SanchalakApprovedLoanAmount: values.sanchalakApprovedLoanAmount,
        SanchalakApprovedLoanDate: values.sanchalakApprovedLoanDate,
        BranchID: loanDetail?.BranchID || memberDetail?.BranchID || myBranch?.code,
      };

      const res = await loanRequestsApi.save(payload, editing ? id : null);
      navigate(`/loan/request/${res.id || id}`, {
        state: { message: editing ? 'ऋण माग फारम अद्यावधिक भयो।' : 'ऋण माग फारम सफलतापूर्वक दर्ता भयो।' },
      });
    } catch (e) {
      setError(errorMessage(e, 'फारम सेभ गर्न समस्या भयो'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;

  return (
    <>
      <PageHeader
        title={editing ? 'ऋण रकम माग फारम सम्पादन' : 'नयाँ ऋण रकम माग फारम'}
        subtitle="सदस्य नं. र ऋण नं. छान्नुहोस्, अन्य विवरणहरू स्वतः आउनेछन्।"
      >
        <Link to={editing ? `/loan/request/${id}` : '/loan/request'} className="btn-secondary">
          <ArrowLeft size={16} />फर्कनुहोस्
        </Link>
      </PageHeader>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">
          {error}
        </p>
      )}

      <Formik
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={submit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleSubmit, setFieldValue }) => (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Green Banner */}
            <div className="flex h-12 w-full items-center justify-between rounded-t-lg bg-ledger px-6 text-white shadow">
              <h2 className="text-base font-bold tracking-wide">ऋण रकम माग फारम (Loan Request Form)</h2>
              <div className="flex items-center gap-2 text-sm">
                <span>दर्ता मिति:</span>
                <div>
                  <NepaliCalendar
                    value={values.entryDate}
                    onChange={(d) => setFieldValue('entryDate', d || '')}
                    placeholder="YYYY/MM/DD"
                    width={130}
                  />
                </div>
              </div>
            </div>

            {/* Container */}
            <div className="panel space-y-6 p-6">
              {/* Header block with Enterprise name & Member Photo */}
              <div className="flex flex-col-reverse justify-between gap-4 border-b border-rule pb-4 sm:flex-row sm:items-start">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700">श्री व्यवस्थापक / ऋण संयोजक / अध्यक्ष ज्यू,</p>
                  <p className="text-lg font-bold text-ink">{branchDetail?.name || myBranch?.name || 'सहकारी संस्था लिमिटेड'}</p>
                  <p className="text-sm text-slate-600">{branchDetail?.address || myBranch?.address || 'ठेगाना'}</p>
                  <h3 className="pt-2 font-bold text-ledger-dark underline">विषय: ऋण रकम माग सम्बन्धमा।</h3>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex h-28 w-24 items-center justify-center overflow-hidden rounded border border-rule bg-paper">
                    {memberDetail?.PhotoIm ? (
                      <img
                        src={`${IMG_URL}/membership/photo/${memberDetail.PhotoIm}`}
                        alt="Photo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">फोटो</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Declaration text */}
              <p className="text-justify text-sm leading-relaxed text-slate-700">
                महोदय, उपयुक्त सम्बन्धमा मलाई तपसिलको व्यवसाय/परियोजना संचालन गर्नको लागि ऋण रकमको आवश्यकता परेको हुँदा संस्थाको नियमानुसार बचत / धितो जमानत राखी उल्लेखित ऋण उपलब्ध गरिदिनुहुन यो निवेदन पेश गर्दछु। म यस संस्थाको सम्पूर्ण शर्त तथा नियमहरूका साथै संस्थाले यस पश्चात जारी गर्ने नीति, नियम समेत पालना गर्दछु।
              </p>

              {/* ── Section 1: Applicant Details ── */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-ink">१. ऋण माग गर्नेको विवरण:</h3>

                {/* Select Member and Loan */}
                <div className="mb-3 grid gap-4 rounded-md border border-ledger/20 bg-ledger-tint/20 p-3 sm:grid-cols-2">
                  <div>
                    <label className="label">सदस्यता नं. *</label>
                    <select
                      name="memberno"
                      value={values.memberno}
                      onChange={(e) => handleMemberChange(e.target.value, setFieldValue)}
                      className="field font-semibold"
                    >
                      <option value="">-- सदस्यता नं. छान्नुहोस् --</option>
                      {members.map((m) => (
                        <option key={m.MemberNo} value={m.MemberNo}>
                          {m.MemberNo} — {m.FullName || m.FullNameEng}
                        </option>
                      ))}
                    </select>
                    {touched.memberno && errors.memberno && (
                      <p className="mt-1 text-xs text-stamp">{errors.memberno}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">ऋण नं. *</label>
                    <select
                      name="loanNo"
                      value={values.loanNo}
                      disabled={!values.memberno}
                      onChange={(e) => handleLoanNoChange(e.target.value, values.memberno, setFieldValue)}
                      className="field font-semibold"
                    >
                      <option value="">-- ऋण नं. छान्नुहोस् --</option>
                      {loans.map((l) => (
                        <option key={l.LoanNo} value={l.LoanNo}>
                          {l.LoanNo} ({l.LoanType} — रू {l.LoanAmount})
                        </option>
                      ))}
                    </select>
                    {touched.loanNo && errors.loanNo && (
                      <p className="mt-1 text-xs text-stamp">{errors.loanNo}</p>
                    )}
                  </div>
                </div>

                {/* Auto-filled details table */}
                <div className="overflow-x-auto rounded border border-rule">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-rule">
                      <tr className="bg-paper/40">
                        <td className="w-44 px-3 py-2 font-semibold">आवेदकको नाम थर</td>
                        <td className="px-3 py-2 font-medium">{memberDetail?.FullName || '—'}</td>
                        <td className="w-44 px-3 py-2 font-semibold">ठेगाना</td>
                        <td className="px-3 py-2">{[memberDetail?.Tole, memberDetail?.MUNVDC, memberDetail?.District].filter(Boolean).join(', ') || '—'}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold">बाबुको नाम थर</td>
                        <td className="px-3 py-2">{memberDetail?.FatherName || '—'}</td>
                        <td className="px-3 py-2 font-semibold">आमाको नाम थर</td>
                        <td className="px-3 py-2">{memberDetail?.MotherName || '—'}</td>
                      </tr>
                      <tr className="bg-paper/40">
                        <td className="px-3 py-2 font-semibold">बाजेको नाम थर</td>
                        <td className="px-3 py-2">{memberDetail?.GrandfatherName || '—'}</td>
                        <td className="px-3 py-2 font-semibold">उमेर</td>
                        <td className="px-3 py-2 tabular-nums">{nepaliAge ? `${nepaliAge} वर्ष` : '—'}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold">पति/पत्नीको नाम</td>
                        <td className="px-3 py-2">{memberDetail?.SpouseName || '—'}</td>
                        <td className="px-3 py-2 font-semibold">मोबाइल नं.</td>
                        <td className="px-3 py-2 tabular-nums">{memberDetail?.MobileNo || '—'}</td>
                      </tr>
                      <tr className="bg-paper/40">
                        <td className="px-3 py-2 font-semibold">ससुराको नाम थर</td>
                        <td className="px-3 py-2">{memberDetail?.FatherInLaw || '—'}</td>
                        <td className="px-3 py-2 font-semibold">नागरिकता नं.</td>
                        <td className="px-3 py-2 tabular-nums">{memberDetail?.CitizenshipNo || '—'}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold">ना. जारी मिति</td>
                        <td className="px-3 py-2 tabular-nums">{memberDetail?.CitIssuedDate ? convertToNepaliNumber(memberDetail.CitIssuedDate) : '—'}</td>
                        <td className="px-3 py-2 font-semibold">ना. जारी जिल्ला</td>
                        <td className="px-3 py-2">{memberDetail?.CitIssuedDistrict || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Section 2: Loan & Project Details ── */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-ink">२. ऋणको परियोजना विवरण:</h3>
                <div className="overflow-x-auto rounded border border-rule">
                  <table className="w-full text-center text-sm">
                    <thead className="bg-paper text-xs font-semibold text-slate-700">
                      <tr>
                        <th className="border-r border-rule px-3 py-2" rowSpan={2}>परियोजना वा व्यवसायको नाम</th>
                        <th className="border-b border-r border-rule px-3 py-2" colSpan={3}>परियोजना / व्यवसायको लागत</th>
                        <th className="px-3 py-2" rowSpan={2}>ऋणको किसिम</th>
                      </tr>
                      <tr className="border-b border-rule">
                        <th className="border-r border-rule px-2 py-1 font-normal">सदस्यको आफ्नो श्रोत (मेरो लगानी)</th>
                        <th className="border-r border-rule px-2 py-1 font-normal">संस्थाबाट लिने ऋण रकम रु.</th>
                        <th className="border-r border-rule px-2 py-1 font-normal">जम्मा लागत रु.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border-r border-rule px-3 py-2 font-medium">{loanDetail?.BusinessName || loanDetail?.LoanPurpose || '—'}</td>
                        <td className="border-r border-rule px-3 py-2">{loanDetail?.IncomeSource || '—'}</td>
                        <td className="border-r border-rule px-3 py-2 font-bold tabular-nums">{loanDetail?.LoanAmount ? `रू ${loanDetail.LoanAmount}` : '—'}</td>
                        <td className="border-r border-rule px-3 py-2">{loanDetail?.IncomeSourceRs || '—'}</td>
                        <td className="px-3 py-2">{loanDetail?.LoanType || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-semibold">ऋणको रकम अक्षरेपी: </span>
                  <span className="font-medium text-ledger-dark">
                    {loanDetail?.LoanAmount ? `${convertToNepaliWords(loanDetail.LoanAmount)} मात्र` : '—'}
                  </span>
                </div>
              </div>

              {/* ── Section 3: Deposit Jamani ── */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">३. बचत जमानतको विवरण:</h3>
                  <span className="text-xs text-slate-600">
                    व्यवसायको पान नं: <span className="font-mono font-bold">{loanDetail?.BusinessPAN || '—'}</span> {loanDetail?.HasBusiness ? '(व्यवसाय छ ✓)' : ''}
                  </span>
                </div>
                <div className="overflow-x-auto rounded border border-rule">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-paper text-xs font-semibold text-slate-700">
                      <tr>
                        <th className="px-2 py-2">क्र.सं.</th>
                        <th className="px-2 py-2">जमानी बस्नेको नाम</th>
                        <th className="px-2 py-2">ठेगाना</th>
                        <th className="px-2 py-2">सदस्यता नं.</th>
                        <th className="px-2 py-2">जमानतको बचत प्रकार</th>
                        <th className="px-2 py-2">कबोल रकम</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-2 py-2">१</td>
                        <td className="px-2 py-2 font-medium">{loanDetail?.JamaniName || '—'}</td>
                        <td className="px-2 py-2">{[loanDetail?.JamaniDistrict, loanDetail?.JamaniVDCMUN, loanDetail?.JamaniWardNo].filter(Boolean).join(', ') || '—'}</td>
                        <td className="px-2 py-2 tabular-nums">{loanDetail?.JamaniMemberNo || '—'}</td>
                        <td className="px-2 py-2">{loanDetail?.JamaniType || '—'}</td>
                        <td className="px-2 py-2 font-semibold tabular-nums">{loanDetail?.JamaniTypeRs ? `रू ${loanDetail.JamaniTypeRs}` : '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Section 4: Dhito Details ── */}
              <div>
                <h3 className="mb-2 text-sm font-bold text-ink">४. धितोको विवरण:</h3>
                <div className="overflow-x-auto rounded border border-rule">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-paper text-xs font-semibold text-slate-700">
                      <tr>
                        <th className="px-2 py-2">क्र.सं.</th>
                        <th className="px-2 py-2">धितो दिनेको नाम</th>
                        <th className="px-2 py-2">धितोको किसिम</th>
                        <th className="px-2 py-2">गा.वि.स./न.पा.</th>
                        <th className="px-2 py-2">वडा / ब्लक</th>
                        <th className="px-2 py-2">कित्ता नं.</th>
                        <th className="px-2 py-2">क्षेत्रफल</th>
                        <th className="px-2 py-2">कैफियत</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-2 py-2">१</td>
                        <td className="px-2 py-2 font-medium">{dhitoDetail?.DhitoPerson || '—'}</td>
                        <td className="px-2 py-2">{dhitoDetail?.DhitoType || '—'}</td>
                        <td className="px-2 py-2">{dhitoDetail?.DhitoVDCMUN || '—'}</td>
                        <td className="px-2 py-2">{[dhitoDetail?.DhitoWardNo, dhitoDetail?.DhitoBlockNo].filter(Boolean).join(' / ') || '—'}</td>
                        <td className="px-2 py-2 tabular-nums">{dhitoDetail?.DhitoKittaNo || '—'}</td>
                        <td className="px-2 py-2">{dhitoDetail?.DhitoArea || '—'}</td>
                        <td className="px-2 py-2">{dhitoDetail?.Remarks || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Section 5: Office Use Only Header ── */}
              <div className="rounded-lg border-2 border-dashed border-stamp/40 bg-stamp-tint/10 p-4">
                <div className="mb-4 text-center">
                  <span className="rounded bg-stamp px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    कार्यालय प्रयोजनको लागि मात्र (For Office Use Only)
                  </span>
                </div>

                {/* 5. Income Source Radio */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold">५. ऋणीको ऋण तिर्ने आय श्रोतको आधार:</h4>
                  <div className="grid gap-2 sm:grid-cols-4">
                    {['व्यापार/ब्यबसाय', 'पशुपंक्षी पालन/कृषि ब्यबसाय', 'बैदेशिक रोजगार', 'नोकरी/अन्य'].map((opt) => (
                      <label key={opt} className="flex cursor-pointer items-center gap-2 rounded border border-rule bg-white p-2 text-sm hover:border-ledger">
                        <input
                          type="radio"
                          name="incomeSource"
                          value={opt}
                          checked={values.incomeSource === opt}
                          onChange={handleChange}
                          className="h-4 w-4 accent-ledger"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 6. Share and Savings Status */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-bold">६. सदस्यको संस्थामा शेयर र नियमित बचत कारोबारको अवस्था:</h4>
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <div>
                      <label className="label text-xs">जम्मा शेयर रकम</label>
                      <NepaliInput
                        name="totalShareAmount"
                        mode="unicode"
                        placeholder="रकम"
                        value={values.totalShareAmount}
                        onChange={handleChange}
                        className="field !text-[14px] h-10"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">जम्मा मासिक बचत</label>
                      <NepaliInput
                        name="totalMonthlySaving"
                        mode="unicode"
                        placeholder="रकम"
                        value={values.totalMonthlySaving}
                        onChange={handleChange}
                        className="field !text-[14px] h-10"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">मासिक बचतको दर</label>
                      <NepaliInput
                        name="monthlySavingRate"
                        mode="unicode"
                        placeholder="दर"
                        value={values.monthlySavingRate}
                        onChange={handleChange}
                        className="field !text-[14px] h-10"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">बचत गरेको मिति सम्म</label>
                      <NepaliCalendar
                        value={values.depositUptoDate}
                        onChange={(d) => setFieldValue('depositUptoDate', d || '')}
                        placeholder="YYYY/MM/DD"
                        width={180}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">नियमित बचत</label>
                      <NepaliInput
                        name="regularSaving"
                        mode="unicode"
                        placeholder="अवस्था"
                        value={values.regularSaving}
                        onChange={handleChange}
                        className="field !text-[14px] h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Past Transactions */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-bold">७. सदस्यको संस्थामा विगतको बचत र ऋणको कारोबारको अवस्था:</h4>
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {[
                      ['hasDailySaving', 'दैनिक बचत छ?'],
                      ['hasChildSaving', 'बाल बचत छ?'],
                      ['hasFixedSaving', 'आवधिक बचत छ?'],
                      ['hasOtherSaving', 'अन्य बचत छ?'],
                      ['hasRemainingLoan', 'तिर्न बाँकी ऋण?'],
                    ].map(([f, lbl]) => (
                      <div key={f}>
                        <label className="label text-xs">{lbl}</label>
                        <select
                          name={f}
                          value={values[f]}
                          onChange={handleChange}
                          className="field"
                        >
                          <option value="छ">छ</option>
                          <option value="छैन">छैन</option>
                        </select>
                      </div>
                    ))}
                    <div>
                      <label className="label text-xs">बाँकी ब्याज (रु)</label>
                      <NepaliInput
                        name="remainingInterest"
                        mode="unicode"
                        placeholder="ब्याज"
                        value={values.remainingInterest}
                        onChange={handleChange}
                        className="field !text-[14px] h-10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 pt-2 sm:grid-cols-4">
                    <div>
                      <label className="label text-xs">ऐच्छिक बचत कारोबार</label>
                      <select
                        name="hasOptionalSavingTrans"
                        value={values.hasOptionalSavingTrans}
                        onChange={handleChange}
                        className="field"
                      >
                        <option value="भएको">भएको</option>
                        <option value="नभएको">नभएको</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">अरुलाई धितो/जमानी दिएको</label>
                      <select
                        name="hasGivenDhitoOrJamani"
                        value={values.hasGivenDhitoOrJamani}
                        onChange={handleChange}
                        className="field"
                      >
                        <option value="दिएको">दिएको</option>
                        <option value="नदिएको">नदिएको</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">विगतको ऋण कारोबार</label>
                      <select
                        name="conditionOfOldLoan"
                        value={values.conditionOfOldLoan}
                        onChange={handleChange}
                        className="field"
                      >
                        <option value="राम्रो">राम्रो</option>
                        <option value="ठिकै">ठिकै</option>
                        <option value="नराम्रो">नराम्रो</option>
                        <option value="सुरुवात">सुरुवात</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">अन्य अवस्था</label>
                      <NepaliInput
                        name="otherCondition"
                        mode="unicode"
                        placeholder="अन्य अवस्था"
                        value={values.otherCondition}
                        onChange={handleChange}
                        className="field !text-[14px] h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* 8. Loan Department Recommendation */}
                <div className="mt-5 space-y-2 rounded border border-rule bg-white p-3">
                  <h4 className="text-sm font-bold text-ink">८. ऋण विभागको सिफारिश:</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="label text-xs">सिफारिश रकम रु.</label>
                      <NepaliInput
                        name="sifarish8LoanAmount"
                        mode="unicode"
                        placeholder="सिफारिश रकम"
                        value={values.sifarish8LoanAmount}
                        onChange={handleChange}
                        className="field font-bold !text-[14px] h-10"
                      />
                      {values.sifarish8LoanAmount && (
                        <p className="mt-1 text-xs text-ledger-dark">
                          अक्षरेपी: {convertToNepaliWords(values.sifarish8LoanAmount)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label text-xs">मिति</label>
                      <NepaliCalendar
                        value={values.sifarish8LoanDate}
                        onChange={(d) => setFieldValue('sifarish8LoanDate', d || '')}
                        placeholder="YYYY/MM/DD"
                        width={180}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">ऋण बिभाग प्रमुख</label>
                      <div className="field bg-paper text-slate-700">{loanOfficer}</div>
                    </div>
                  </div>
                </div>

                {/* 9. Manager Recommendation */}
                <div className="mt-4 space-y-2 rounded border border-rule bg-white p-3">
                  <h4 className="text-sm font-bold text-ink">९. ऋणको स्वीकृत एवं सिफारिश (व्यवस्थापक):</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="label text-xs">पेश गरिएको रकम रु.</label>
                      <NepaliInput
                        name="sifarish9LoanAmount"
                        mode="unicode"
                        placeholder="रकम"
                        value={values.sifarish9LoanAmount}
                        onChange={handleChange}
                        className="field font-bold !text-[14px] h-10"
                      />
                      {values.sifarish9LoanAmount && (
                        <p className="mt-1 text-xs text-ledger-dark">
                          अक्षरेपी: {convertToNepaliWords(values.sifarish9LoanAmount)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label text-xs">मिति</label>
                      <NepaliCalendar
                        value={values.sifarish9LoanDate}
                        onChange={(d) => setFieldValue('sifarish9LoanDate', d || '')}
                        placeholder="YYYY/MM/DD"
                        width={180}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">व्यवस्थापक</label>
                      <div className="field bg-paper text-slate-700">{manager}</div>
                    </div>
                  </div>
                </div>

                {/* 10. Subcommittee Approval */}
                <div className="mt-4 space-y-2 rounded border border-rule bg-white p-3">
                  <h4 className="text-sm font-bold text-ink">१०. ऋण उप-समितिको स्वीकृति वा सिफारिश:</h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="label text-xs">बैठक मिति</label>
                      <NepaliCalendar
                        value={values.upasamitiMeetingDate}
                        onChange={(d) => setFieldValue('upasamitiMeetingDate', d || '')}
                        placeholder="YYYY/MM/DD"
                        width={180}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">बैठक नं.</label>
                      <NepaliInput
                        name="upasamitiMeetingNo"
                        mode="unicode"
                        placeholder="औं बैठक"
                        value={values.upasamitiMeetingNo}
                        onChange={handleChange}
                        className="field !text-[14px] h-10"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">स्वीकृत ऋण रकम रु.</label>
                      <NepaliInput
                        name="upasamitiApprovedLoanAmount"
                        mode="unicode"
                        placeholder="रकम"
                        value={values.upasamitiApprovedLoanAmount}
                        onChange={handleChange}
                        className="field font-bold !text-[14px] h-10"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">ऋण उपसमिति संयोजक</label>
                      <div className="field bg-paper text-slate-700">{committeeHead}</div>
                    </div>
                  </div>
                </div>

                {/* 11. Board Approval */}
                <div className="mt-4 space-y-2 rounded border border-rule bg-white p-3">
                  <h4 className="text-sm font-bold text-ink">११. संचालक समितिको स्वीकृति:</h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="label text-xs">बैठक मिति</label>
                      <NepaliCalendar
                        value={values.sanchalakMeetingDate}
                        onChange={(d) => setFieldValue('sanchalakMeetingDate', d || '')}
                        placeholder="YYYY/MM/DD"
                        width={180}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">बैठक नं.</label>
                      <NepaliInput
                        name="sanchalakMeetingNo"
                        mode="unicode"
                        placeholder="औं बैठक"
                        value={values.sanchalakMeetingNo}
                        onChange={handleChange}
                        className="field !text-[14px] h-10"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">स्वीकृत ऋण रकम रु.</label>
                      <NepaliInput
                        name="sanchalakApprovedLoanAmount"
                        mode="unicode"
                        placeholder="रकम"
                        value={values.sanchalakApprovedLoanAmount}
                        onChange={handleChange}
                        className="field font-bold !text-[14px] h-10"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">अध्यक्ष</label>
                      <div className="field bg-paper text-slate-700">{president}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions sticky footer */}
              <div className="sticky bottom-0 -mx-6 flex justify-end gap-3 border-t border-rule bg-white/95 px-6 py-3 backdrop-blur">
                <Link to={editing ? `/loan/request/${id}` : '/loan/request'} className="btn-secondary">
                  रद्द गर्नुहोस्
                </Link>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editing ? 'अद्यावधिक गर्नुहोस्' : 'सेभ गर्नुहोस्'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Formik>
    </>
  );
}

