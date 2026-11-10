import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';
import modDate from '../../utils/modDate';
import { loanPariwarikSwikritiApi } from '../../api/loanPariwarikSwikriti';
import { errorMessage } from '../../api/axios';
import { NepaliInput } from '@itzsa/nepali-input';

const nepMonthsMap = {
  '01': 'बैशाख', '02': 'जेठ', '03': 'असार', '04': 'साउन',
  '05': 'भदौ', '06': 'असोज', '07': 'कार्तिक', '08': 'मंसिर',
  '09': 'पुस', '10': 'माघ', '11': 'फागुन', '12': 'चैत'
};

const validationSchema = Yup.object().shape({
  MemberNo: Yup.string().required('सदस्यता नं. अनिवार्य छ'),
  LoanNo: Yup.string().required('ऋण नं. अनिवार्य छ'),
  RelativeName: Yup.string().required('पारिवारिक स्वीकृति दिने नातेदारको नाम अनिवार्य छ'),
});

export default function LoanPariwarikSwikritiForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [memberDetail, setMemberDetail] = useState(null);
  const [loanDetail, setLoanDetail] = useState(null);
  const [enterprise, setEnterprise] = useState(null);
  const [staffs, setStaffs] = useState([]);

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        if (isEdit) {
          const res = await loanPariwarikSwikritiApi.get(id);
          const r = res.pariwarikSwikriti;
          setInitialData({
            MemberNo: r.MemberNo || '',
            LoanNo: r.LoanNo || '',
            EntryDate: r.EntryDate || '',
            RelativeGrandfatherName: r.RelativeGrandfatherName || '',
            RelativeFatherName: r.RelativeFatherName || '',
            RelativeSpouseName: r.RelativeSpouseName || '',
            RelativeName: r.RelativeName || '',
            Relationship: r.Relationship || '',
            LoanAmount: r.LoanAmount || '',
            RateOfInterest: r.RateOfInterest || '',
            LoanPurpose: r.LoanPurpose || '',
            LoanPeriodYear: r.LoanPeriodYear || '',
            LoanPeriodMonth: r.LoanPeriodMonth || '',
            LegalYear: r.LegalYear || '',
            LegalMonth: r.LegalMonth || '',
            LegalDay: r.LegalDay || '',
            LegalDayOfWeek: r.LegalDayOfWeek || '',
            LoanBhibhagPramukh: r.LoanBhibhagPramukh || '',
            KaryalayaPramukh: r.KaryalayaPramukh || '',
            StaffID: r.StaffID || '',
            StaffName: r.StaffName || '',
            StaffPost: r.StaffPost || '',
            Remarks: r.Remarks || '',
          });
          setMemberDetail(res.member || null);
          setLoanDetail(res.loan || null);
          setEnterprise(res.enterprise || null);
          setStaffs(res.staffs || []);

          const lRes = await loanPariwarikSwikritiApi.loansForMember(r.MemberNo);
          setLoans(lRes || []);
        } else {
          const mRes = await loanPariwarikSwikritiApi.members();
          setMembers(mRes || []);

          // Today's Nepali Date & Day of Week
          const currentNepDate = modDate.getCurrentNepaliDate();
          const [curYear, curMonth, curDay] = currentNepDate.split('/');
          const dayOfWeekNum = modDate.getDayOfWeek(new Date()); // 1 = Sunday ... 7 = Saturday
          const dayOfWeekStr = String(dayOfWeekNum).padStart(2, '0');

          setInitialData({
            MemberNo: '',
            LoanNo: '',
            EntryDate: currentNepDate,
            RelativeGrandfatherName: '',
            RelativeFatherName: '',
            RelativeSpouseName: '',
            RelativeName: '',
            Relationship: '',
            LoanAmount: '',
            RateOfInterest: '',
            LoanPurpose: '',
            LoanPeriodYear: '',
            LoanPeriodMonth: '',
            LegalYear: curYear,
            LegalMonth: nepMonthsMap[curMonth] || '',
            LegalDay: curDay,
            LegalDayOfWeek: dayOfWeekStr,
            LoanBhibhagPramukh: '',
            KaryalayaPramukh: '',
            StaffID: '',
            StaffName: '',
            StaffPost: '',
            Remarks: '',
          });
        }
      } catch (err) {
        setFormError(errorMessage(err, 'फारम विवरण लोड गर्न सकिएन।'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit]);

  // Handle Member selection
  const handleMemberChange = async (memberNo, setFieldValue) => {
    setFieldValue('MemberNo', memberNo);
    setFieldValue('LoanNo', '');
    setMemberDetail(null);
    setLoanDetail(null);
    setLoans([]);

    if (!memberNo) return;

    try {
      const lRes = await loanPariwarikSwikritiApi.loansForMember(memberNo);
      setLoans(lRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Loan selection
  const handleLoanChange = async (memberNo, loanNo, setFieldValue) => {
    setFieldValue('LoanNo', loanNo);
    if (!memberNo || !loanNo) return;

    try {
      const ctx = await loanPariwarikSwikritiApi.context(memberNo, loanNo);
      setMemberDetail(ctx.member || null);
      setLoanDetail(ctx.loan || null);
      setEnterprise(ctx.enterprise || null);
      setStaffs(ctx.staffs || []);

      const loan = ctx.loan || {};
      const loanHead = ctx.loanHead || null;
      const officeHead = ctx.officeHead || null;

      if (loan.LoanAmount) setFieldValue('LoanAmount', loan.LoanAmount);
      if (loan.RateOfInterest) setFieldValue('RateOfInterest', loan.RateOfInterest);
      if (loan.LoanPurpose) setFieldValue('LoanPurpose', loan.LoanPurpose);
      if (loan.LoanPeriodYear) setFieldValue('LoanPeriodYear', loan.LoanPeriodYear);
      if (loan.LoanPeriodMonth) setFieldValue('LoanPeriodMonth', loan.LoanPeriodMonth);

      if (loanHead) {
        setFieldValue('LoanBhibhagPramukh', loanHead.name || loanHead.name_eng || '');
      }
      if (officeHead) {
        setFieldValue('KaryalayaPramukh', officeHead.name || officeHead.name_eng || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await loanPariwarikSwikritiApi.save(values, id);
      navigate(`/loan/pariwarik-swikriti/${id || res.id}`, {
        state: { message: isEdit ? 'पारिवारिक स्वीकृति फारम अद्यावधिक भयो।' : 'पारिवारिक स्वीकृति फारम सफलतापूर्वक दर्ता भयो।' },
      });
    } catch (err) {
      setFormError(errorMessage(err, 'दर्ता गर्न सकिएन।'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="size-6 animate-spin mr-2" /> लोड हुँदैछ...
      </div>
    );
  }

  const memberAge = memberDetail?.DOB ? calculateAgeFromNepaliDate(memberDetail.DOB) : '';

  return (
    <>
      <PageHeader
        title={isEdit ? 'पारिवारिक स्वीकृति फारम सम्पादन' : 'नयाँ पारिवारिक स्वीकृति फारम (Pariwarik Swikriti)'}
        subtitle="ऋणी सदस्यको परिवारद्वारा प्रदान गरिने ऋण स्वीकृति तथा जमानी फारम भर्नुहोस्"
      >
        <Link to={isEdit ? `/loan/pariwarik-swikriti/${id}` : `/loan/pariwarik-swikriti`} className="btn-secondary">
          <ArrowLeft className="size-4" />फर्कनुहोस्
        </Link>
      </PageHeader>

      {formError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {formError}
        </div>
      )}

      <Formik
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, handleChange, handleBlur }) => {
          const loanWords = values.LoanAmount ? convertToNepaliWords(values.LoanAmount) : '';

          return (
            <Form className="space-y-6">
              {/* Member & Loan Selector Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                  <Info className="size-5 text-brand-600" /> आधारभूत छनौट (सदस्य र ऋण विवरण)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Member Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      सदस्यता नं. / नाम <span className="text-red-500">*</span>
                    </label>
                    {isEdit ? (
                      <input
                        type="text"
                        value={`${values.MemberNo} - ${memberDetail?.FullName || ''}`}
                        disabled
                        className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          list="memberOptions"
                          name="MemberNo"
                          value={values.MemberNo}
                          placeholder="सदस्यता नं. टाइप वा छनौट गर्नुहोस्"
                          onChange={(e) => handleMemberChange(e.target.value, setFieldValue)}
                          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                            errors.MemberNo && touched.MemberNo
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
                          }`}
                        />
                        <datalist id="memberOptions">
                          {members.map((m) => (
                            <option key={m.MemberNo} value={m.MemberNo}>
                              {m.FullName} ({m.MemberNo})
                            </option>
                          ))}
                        </datalist>
                      </>
                    )}
                    <ErrorMessage name="MemberNo" component="div" className="mt-1 text-xs text-red-500" />
                  </div>

                  {/* Loan Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ऋण नं. <span className="text-red-500">*</span>
                    </label>
                    {isEdit ? (
                      <input
                        type="text"
                        value={values.LoanNo}
                        disabled
                        className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                      />
                    ) : (
                      <select
                        name="LoanNo"
                        value={values.LoanNo}
                        disabled={!values.MemberNo || loans.length === 0}
                        onChange={(e) => handleLoanChange(values.MemberNo, e.target.value, setFieldValue)}
                        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                          errors.LoanNo && touched.LoanNo
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
                        }`}
                      >
                        <option value="">-- ऋण नं. छान्नुहोस् --</option>
                        {loans.map((l) => (
                          <option key={l.LoanNo} value={l.LoanNo}>
                            {l.LoanNo} - {l.LoanType || 'ऋण'} (रु. {l.LoanAmount})
                          </option>
                        ))}
                      </select>
                    )}
                    <ErrorMessage name="LoanNo" component="div" className="mt-1 text-xs text-red-500" />
                  </div>

                  {/* Entry Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      फारम मिति <span className="text-red-500">*</span>
                    </label>
                    <NepaliCalendar
                      value={values.EntryDate}
                      onChange={(date) => setFieldValue('EntryDate', date)}
                      width={180}
                    />
                    <ErrorMessage name="EntryDate" component="div" className="mt-1 text-xs text-red-500" />
                  </div>
                </div>

                {/* Member Preview Card */}
                {memberDetail && (
                  <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-slate-400 block">ऋणी सदस्यको नाम:</span>
                        <span className="font-semibold text-slate-900">{memberDetail.FullName}</span>
                        <span className="text-xs text-slate-500 block">उमेर: {memberAge ? `${memberAge} वर्ष` : '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">ऋण प्रकार / शीर्षक:</span>
                        <span className="font-medium text-slate-900">{loanDetail?.LoanType || '—'}</span>
                        <span className="text-xs text-slate-500 block">प्रयोजन: {loanDetail?.LoanPurpose || '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">ऋण रकम / ब्याजदर:</span>
                        <span className="font-semibold text-brand-700">
                          {loanDetail?.LoanAmount ? `रु. ${loanDetail.LoanAmount}` : '—'}
                        </span>
                        <span className="text-xs text-slate-500 block">{loanDetail?.RateOfInterest ? `${loanDetail.RateOfInterest}%` : ''}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Relative (पारिवारिक स्वीकृति दिने नातेदार विवरण) */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                  १. पारिवारिक स्वीकृति तथा जमानी दिने नातेदारको विवरण
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      स्वीकृति दिने व्यक्तिको नाम थर <span className="text-red-500">*</span>
                    </label>
                    <NepaliInput
                      type="text"
                      name="RelativeName"
                      value={values.RelativeName}
                      onChange={handleChange}
                      placeholder="नातेदारको पूरा नाम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 !text-[14px] h-10"
                    />
                    <ErrorMessage name="RelativeName" component="div" className="mt-1 text-xs text-red-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ऋणीसँगको नाता (Relationship)
                    </label>
                    <NepaliInput
                      type="text"
                      name="Relationship"
                      value={values.Relationship}
                      onChange={handleChange}
                      placeholder="उदा: छोरा, बुबा, पत्नी, श्रीमान, भाई"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 !text-[14px] h-10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">हजुरबुबाको नाम थर</label>
                    <NepaliInput
                      type="text"
                      name="RelativeGrandfatherName"
                      value={values.RelativeGrandfatherName}
                      onChange={handleChange}
                      placeholder="हजुरबुबाको नाम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 !text-[14px] h-10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">बुबाको नाम थर</label>
                    <NepaliInput
                      type="text"
                      name="RelativeFatherName"
                      value={values.RelativeFatherName}
                      onChange={handleChange}
                      placeholder="बुबाको नाम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 !text-[14px] h-10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">पति/पत्नीको नाम थर</label>
                    <NepaliInput
                      type="text"
                      name="RelativeSpouseName"
                      value={values.RelativeSpouseName}
                      onChange={handleChange}
                      placeholder="श्रीमान/श्रीमतीको नाम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 !text-[14px] h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Loan Details Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                  २. ऋण सम्बन्धी विवरण
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ऋण रकम (रु.)</label>
                    <NepaliInput
                      type="text"
                      name="LoanAmount"
                      value={values.LoanAmount}
                      onChange={handleChange}
                      placeholder="रकम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ब्याजदर (%)</label>
                    <NepaliInput
                      type="text"
                      name="RateOfInterest"
                      value={values.RateOfInterest}
                      onChange={handleChange}
                      placeholder="ब्याजदर"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ऋणको परियोजना / उद्देश्य</label>
                    <input
                      type="text"
                      name="LoanPurpose"
                      value={values.LoanPurpose}
                      onChange={handleChange}
                      placeholder="परियोजना"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ऋण अवधि (वर्ष)</label>
                    <NepaliInput
                      type="text"
                      name="LoanPeriodYear"
                      value={values.LoanPeriodYear}
                      onChange={handleChange}
                      placeholder="वर्ष"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ऋण अवधि (महिना)</label>
                    <NepaliInput
                      type="text"
                      name="LoanPeriodMonth"
                      value={values.LoanPeriodMonth}
                      onChange={handleChange}
                      placeholder="महिना"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Legal Date Section (ईति सम्वत्) */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                  ३. ईति सम्वत् (कानूनी मिति तथा बार)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">साल (Year)</label>
                    <NepaliInput
                      type="text"
                      name="LegalYear"
                      value={values.LegalYear}
                      onChange={handleChange}
                      placeholder="२०८३"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">महिना (Month)</label>
                    <input
                      type="text"
                      name="LegalMonth"
                      value={values.LegalMonth}
                      onChange={handleChange}
                      placeholder="कार्तिक"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">गते (Day)</label>
                    <NepaliInput
                      type="text"
                      name="LegalDay"
                      value={values.LegalDay}
                      onChange={handleChange}
                      placeholder="१८"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      रोज (Day: 01=आइत, 02=सोम ... 07=शनि)
                    </label>
                    <NepaliInput
                      type="text"
                      name="LegalDayOfWeek"
                      value={values.LegalDayOfWeek}
                      onChange={handleChange}
                      placeholder="०१ देखि ०७"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {values.LegalDayOfWeek ? `रोज कोड: ${values.LegalDayOfWeek} (${values.LegalDayOfWeek === '01' ? 'आइतबार' : values.LegalDayOfWeek === '02' ? 'सोमबार' : values.LegalDayOfWeek === '03' ? 'मंगलबार' : values.LegalDayOfWeek === '04' ? 'बुधबार' : values.LegalDayOfWeek === '05' ? 'बिहीबार' : values.LegalDayOfWeek === '06' ? 'शुक्रबार' : 'शनिबार'})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Staff Signatures Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                  ४. संस्थाका पदाधिकारीहरु
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ऋण विभाग प्रमुख</label>
                    <input
                      type="text"
                      name="LoanBhibhagPramukh"
                      value={values.LoanBhibhagPramukh}
                      onChange={handleChange}
                      placeholder="ऋण विभाग प्रमुखको नाम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">कार्यालय प्रमुख</label>
                    <input
                      type="text"
                      name="KaryalayaPramukh"
                      value={values.KaryalayaPramukh}
                      onChange={handleChange}
                      placeholder="कार्यालय प्रमुखको नाम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">कैफियत (Remarks)</label>
                    <input
                      type="text"
                      name="Remarks"
                      value={values.Remarks}
                      onChange={handleChange}
                      placeholder="कैफियत..."
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-6">
                <h4 className="text-sm font-bold text-center border-b border-indigo-200 pb-2 mb-4 text-slate-800">
                  पारिवारिक स्वीकृत फारम (प्रत्यक्ष नमुना पूर्वावलोकन)
                </h4>
                <p className="text-xs leading-relaxed text-justify text-slate-800 space-y-1">
                  लिखितम् <strong>{memberDetail?.TmpProvince || memberDetail?.Province || '……'}</strong> प्रदेश{' '}
                  <strong>{memberDetail?.TmpDistrict || memberDetail?.District || '……'}</strong> जिल्ला{' '}
                  <strong>{memberDetail?.TmpMUNVDC || memberDetail?.MUNVDC || '……'}</strong> वडा नं.{' '}
                  <strong>{convertToNepaliNumber(memberDetail?.TmpWardNo || memberDetail?.WardNo) || '…'}</strong> बस्ने{' '}
                  <strong>{memberDetail?.GrandfatherName || '…………'}</strong> को नाती/नातिनी{' '}
                  <strong>{memberDetail?.FatherName || '…………'}</strong> को छोरा/छोरी{' '}
                  <strong>{memberDetail?.SpouseName || '…………'}</strong> को श्रीमान/श्रीमती{' '}
                  <strong>{convertToNepaliNumber(memberAge) || memberAge || '…'}</strong> वर्षको{' '}
                  <strong>{memberDetail?.FullName || '………………'}</strong> ले यस{' '}
                  <strong>{enterprise?.companyname || 'हाम्रो सहकारी संस्था लि.'}</strong> बाट मासिक{' '}
                  <strong>{convertToNepaliNumber(values.RateOfInterest) || values.RateOfInterest || '…'}%</strong> ब्याजदरमा{' '}
                  <strong>{values.LoanPurpose || '……'}</strong> परियोजनाको निमित्त{' '}
                  <strong>{convertToNepaliNumber(values.LoanPeriodYear) || values.LoanPeriodYear || '०'}</strong> वर्ष{' '}
                  <strong>{convertToNepaliNumber(values.LoanPeriodMonth) || values.LoanPeriodMonth || '०'}</strong> महिनाको रु.{' '}
                  <strong>{convertToNepaliNumber(values.LoanAmount) || values.LoanAmount || '………'}</strong> (अक्षरेपी रु.{' '}
                  <strong>{loanWords || '……………'}</strong> मात्र) ऋण लिन लागेको भन्ने बारे घर सल्लाह भई पारिवारिक स्वीकृतिको लागि ऋणीको नाता{' '}
                  <strong>{values.RelativeGrandfatherName || '…………'}</strong> को नाती/नातिनी{' '}
                  <strong>{values.RelativeFatherName || '…………'}</strong> को छोरा/छोरी{' '}
                  <strong>{values.RelativeSpouseName || '…………'}</strong> को श्रीमान/श्रीमती म{' '}
                  <strong className="underline">{values.RelativeName || '………………'}</strong> ले पारिवारिक स्वीकृति पत्रमा सहिछाप गरिदिए | ऋण लिनको निम्ति मलाई धन जमानी बस्न मन्जुर छ छैन भनि निज ऋणी तथा संस्थाको रोहबरमा तपाई साहु संस्थाले म संग सोधनी गर्नु भएकोमा मेरो चीत्त बुझ्यो र सो ऋणको जमानी म भए |
                </p>

                {/* ईति सम्वत् Live Line */}
                <div className="mt-4 text-center font-semibold text-xs text-slate-900 border-t border-indigo-200 pt-3">
                  ईति सम्वत् {convertToNepaliNumber(values.LegalYear) || values.LegalYear || '…………'} साल{' '}
                  {values.LegalMonth || '…………'} महिना{' '}
                  {convertToNepaliNumber(values.LegalDay) || values.LegalDay || '……'} गते{' '}
                  {convertToNepaliNumber(values.LegalDayOfWeek) || values.LegalDayOfWeek || '……'} रोज शुभम् |
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3">
                <Link to="/loan/pariwarik-swikriti" className="btn-secondary">
                  रद्द गर्नुहोस्
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1" /> सुरक्षित गरिँदैछ...
                    </>
                  ) : (
                    <>
                      <Save className="size-4 mr-1" /> {isEdit ? 'अद्यावधिक गर्नुहोस्' : 'सुरक्षित गर्नुहोस्'}
                    </>
                  )}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </>
  );
}

