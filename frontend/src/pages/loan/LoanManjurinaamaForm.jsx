import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Save, Loader2, Info, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';
import modDate from '../../utils/modDate';
import { loanManjurinaamaApi } from '../../api/loanManjurinaama';
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
  LandDhitoPersonName: Yup.string().required('मञ्जुरीनामा दिने (जग्गाधनी) को नाम अनिवार्य छ'),
});

export default function LoanManjurinaamaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [memberDetail, setMemberDetail] = useState(null);
  const [loanDetail, setLoanDetail] = useState(null);
  const [availableDhitos, setAvailableDhitos] = useState([]);
  const [availableSakshis, setAvailableSakshis] = useState([]);
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
          const res = await loanManjurinaamaApi.get(id);
          const r = res.manjurinaama;
          setInitialData({
            MemberNo: r.MemberNo || '',
            LoanNo: r.LoanNo || '',
            EntryDate: r.EntryDate || '',
            LandDhitoPersonName: r.LandDhitoPersonName || '',
            LandDhitoPersonProvince: r.LandDhitoPersonProvince || '',
            LandDhitoPersonDistrict: r.LandDhitoPersonDistrict || '',
            LandDhitoPersonMUNVDC: r.LandDhitoPersonMUNVDC || '',
            LandDhitoPersonWardNo: r.LandDhitoPersonWardNo || '',
            LandDhitoPersonGrandfather: r.LandDhitoPersonGrandfather || '',
            LandDhitoPersonFather: r.LandDhitoPersonFather || '',
            LandDhitoPersonSpouse: r.LandDhitoPersonSpouse || '',
            LandDhitoPersonAge: r.LandDhitoPersonAge || '',
            LoanPeriodYear: r.LoanPeriodYear || '',
            LoanPeriodMonth: r.LoanPeriodMonth || '',
            LoanPurpose: r.LoanPurpose || '',
            RateOfInterest: r.RateOfInterest || '',
            LoanAmount: r.LoanAmount || '',
            LandDhitoAddress: r.LandDhitoAddress || '',
            LandDhitoWardBlockNo: r.LandDhitoWardBlockNo || '',
            LandDhitoKittaNo: r.LandDhitoKittaNo || '',
            LandDhitoArea: r.LandDhitoArea || '',
            SachiName1: r.SachiName1 || '',
            SachiDistrict1: r.SachiDistrict1 || '',
            SachiMUNVDC1: r.SachiMUNVDC1 || '',
            SachiWardNo1: r.SachiWardNo1 || '',
            SachiAge1: r.SachiAge1 || '',
            SachiName2: r.SachiName2 || '',
            SachiDistrict2: r.SachiDistrict2 || '',
            SachiMUNVDC2: r.SachiMUNVDC2 || '',
            SachiWardNo2: r.SachiWardNo2 || '',
            SachiAge2: r.SachiAge2 || '',
            LegalYear: r.LegalYear || '',
            LegalMonth: r.LegalMonth || '',
            LegalDay: r.LegalDay || '',
            LegalDayOfWeek: r.LegalDayOfWeek || '',
            StaffID: r.StaffID || '',
            StaffName: r.StaffName || '',
            StaffPost: r.StaffPost || 'ऋण विभाग प्रमुख',
            Remarks: r.Remarks || '',
          });
          setMemberDetail(res.member || null);
          setLoanDetail(res.loan || null);
          setAvailableDhitos(res.dhitos || []);
          setAvailableSakshis(res.sakshis || []);
          setEnterprise(res.enterprise || null);
          setStaffs(res.staffs || []);

          const lRes = await loanManjurinaamaApi.loansForMember(r.MemberNo);
          setLoans(lRes || []);
        } else {
          const mRes = await loanManjurinaamaApi.members();
          setMembers(mRes || []);

          // Today's Nepali Date & Day of Week calculation
          const currentNepDate = modDate.getCurrentNepaliDate();
          const [curYear, curMonth, curDay] = currentNepDate.split('/');
          const dayOfWeekNum = modDate.getDayOfWeek(new Date()); // 1 = Sunday, 2 = Monday ... 7 = Saturday
          const dayOfWeekStr = String(dayOfWeekNum).padStart(2, '0');

          setInitialData({
            MemberNo: '',
            LoanNo: '',
            EntryDate: currentNepDate,
            LandDhitoPersonName: '',
            LandDhitoPersonProvince: '',
            LandDhitoPersonDistrict: '',
            LandDhitoPersonMUNVDC: '',
            LandDhitoPersonWardNo: '',
            LandDhitoPersonGrandfather: '',
            LandDhitoPersonFather: '',
            LandDhitoPersonSpouse: '',
            LandDhitoPersonAge: '',
            LoanPeriodYear: '',
            LoanPeriodMonth: '',
            LoanPurpose: '',
            RateOfInterest: '',
            LoanAmount: '',
            LandDhitoAddress: '',
            LandDhitoWardBlockNo: '',
            LandDhitoKittaNo: '',
            LandDhitoArea: '',
            SachiName1: '',
            SachiDistrict1: '',
            SachiMUNVDC1: '',
            SachiWardNo1: '',
            SachiAge1: '',
            SachiName2: '',
            SachiDistrict2: '',
            SachiMUNVDC2: '',
            SachiWardNo2: '',
            SachiAge2: '',
            LegalYear: curYear,
            LegalMonth: nepMonthsMap[curMonth] || '',
            LegalDay: curDay,
            LegalDayOfWeek: dayOfWeekStr,
            StaffID: '',
            StaffName: '',
            StaffPost: 'ऋण विभाग प्रमुख',
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
    setAvailableDhitos([]);
    setAvailableSakshis([]);

    if (!memberNo) return;

    try {
      const lRes = await loanManjurinaamaApi.loansForMember(memberNo);
      setLoans(lRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Populate from a selected Dhito record
  const applyDhitoRecord = (dhito, setFieldValue) => {
    if (!dhito) return;
    if (dhito.DhitoPerson) setFieldValue('LandDhitoPersonName', dhito.DhitoPerson);
    if (dhito.DhitoFather) setFieldValue('LandDhitoPersonFather', dhito.DhitoFather);
    if (dhito.DhitoSpouse) setFieldValue('LandDhitoPersonSpouse', dhito.DhitoSpouse);
    if (dhito.DhitoProvince) setFieldValue('LandDhitoPersonProvince', dhito.DhitoProvince);
    if (dhito.DhitoDistrict) setFieldValue('LandDhitoPersonDistrict', dhito.DhitoDistrict);
    if (dhito.DhitoVDCMUN) {
      setFieldValue('LandDhitoPersonMUNVDC', dhito.DhitoVDCMUN);
      setFieldValue('LandDhitoAddress', dhito.DhitoVDCMUN);
    }
    if (dhito.DhitoWardNo) {
      setFieldValue('LandDhitoPersonWardNo', dhito.DhitoWardNo);
      const wardBlock = dhito.DhitoBlockNo ? `${dhito.DhitoWardNo} / ${dhito.DhitoBlockNo}` : dhito.DhitoWardNo;
      setFieldValue('LandDhitoWardBlockNo', wardBlock);
    }
    if (dhito.DhitoKittaNo) setFieldValue('LandDhitoKittaNo', dhito.DhitoKittaNo);
    if (dhito.DhitoArea) setFieldValue('LandDhitoArea', dhito.DhitoArea);
  };

  // Handle Loan selection (Pulls Dhito and Sakshi details already saved in DB!)
  const handleLoanChange = async (memberNo, loanNo, setFieldValue) => {
    setFieldValue('LoanNo', loanNo);
    if (!memberNo || !loanNo) return;

    try {
      const ctx = await loanManjurinaamaApi.context(memberNo, loanNo);
      setMemberDetail(ctx.member || null);
      setLoanDetail(ctx.loan || null);
      setAvailableDhitos(ctx.dhitos || []);
      setAvailableSakshis(ctx.sakshis || []);
      setEnterprise(ctx.enterprise || null);
      setStaffs(ctx.staffs || []);

      const loan = ctx.loan || {};
      const dhitos = ctx.dhitos || [];
      const sakshis = ctx.sakshis || [];
      const headStaff = ctx.headStaff || null;

      // 1. Auto-fill from Loan Detail
      if (loan.LoanAmount) setFieldValue('LoanAmount', loan.LoanAmount);
      if (loan.RateOfInterest) setFieldValue('RateOfInterest', loan.RateOfInterest);
      if (loan.LoanPurpose) setFieldValue('LoanPurpose', loan.LoanPurpose);
      if (loan.LoanPeriodYear) setFieldValue('LoanPeriodYear', loan.LoanPeriodYear);
      if (loan.LoanPeriodMonth) setFieldValue('LoanPeriodMonth', loan.LoanPeriodMonth);

      // 2. Auto-fill Dhito details from database
      if (dhitos.length > 0) {
        applyDhitoRecord(dhitos[0], setFieldValue);
      }

      // 3. Auto-fill Sakshi details from database
      if (sakshis.length > 0) {
        const s1 = sakshis[0];
        setFieldValue('SachiName1', s1.SakshiPerson || '');
        setFieldValue('SachiDistrict1', s1.SakshiDistrict || '');
        setFieldValue('SachiMUNVDC1', s1.SakshiVDCMUN || '');
        setFieldValue('SachiWardNo1', s1.SakshiWardNo || '');
        setFieldValue('SachiAge1', s1.SakshiAge || '');

        if (sakshis.length > 1) {
          const s2 = sakshis[1];
          setFieldValue('SachiName2', s2.SakshiPerson || '');
          setFieldValue('SachiDistrict2', s2.SakshiDistrict || '');
          setFieldValue('SachiMUNVDC2', s2.SakshiVDCMUN || '');
          setFieldValue('SachiWardNo2', s2.SakshiWardNo || '');
          setFieldValue('SachiAge2', s2.SakshiAge || '');
        }
      }

      // 4. Auto-fill Loan Department Head
      if (headStaff) {
        setFieldValue('StaffName', headStaff.name || headStaff.name_eng || '');
        setFieldValue('StaffID', headStaff.staffno || '');
        setFieldValue('StaffPost', headStaff.post || 'ऋण विभाग प्रमुख');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await loanManjurinaamaApi.save(values, id);
      navigate(`/loan/manjurinaama/${id || res.id}`, {
        state: { message: isEdit ? 'मञ्जुरीनामा अद्यावधिक भयो।' : 'मञ्जुरीनामा सफलतापूर्वक दर्ता भयो।' },
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
        title={isEdit ? 'मञ्जुरीनामा सम्पादन' : 'नयाँ मञ्जुरीनामा (Loan Manjuri Naama)'}
        subtitle="धितो जग्गाधनीद्वारा संस्थालाई प्रदान गरिने मञ्जुरीनामा फारम भर्नुहोस्"
      >
        <Link to={isEdit ? `/loan/manjurinaama/${id}` : `/loan/manjurinaama`} className="btn-secondary">
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
        {({ values, errors, touched, setFieldValue, handleChange, handleBlur }) => (
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
                        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.MemberNo && touched.MemberNo
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
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.LoanNo && touched.LoanNo
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

              {/* DB Pre-fill Status Banner */}
              {availableDhitos.length > 0 && (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>
                      यस ऋणमा सुरक्षित <strong>{availableDhitos.length}</strong> धितो विवरण र <strong>{availableSakshis.length}</strong> साक्षी विवरण डाटाबेसबाट स्वतः भरिएको छ।
                    </span>
                  </div>
                  {availableDhitos.length > 1 && (
                    <div className="flex gap-2 items-center">
                      <span className="text-slate-600 font-semibold">अन्य धितो छान्नुहोस्:</span>
                      {availableDhitos.map((d, idx) => (
                        <button
                          key={d.id || idx}
                          type="button"
                          onClick={() => applyDhitoRecord(d, setFieldValue)}
                          className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded px-2 py-0.5 text-xs font-semibold"
                        >
                          धितो {idx + 1}: {d.DhitoPerson}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dhito Person Section (मञ्जुरीनामा दिने / जग्गाधनी विवरण) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                १. मञ्जुरीनामा दिने (जग्गा धनी) को तीनपुस्ते तथा ठेगाना विवरण
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    जग्गा धनीको नाम थर <span className="text-red-500">*</span>
                  </label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoPersonName"
                    value={values.LandDhitoPersonName}
                    onChange={handleChange}
                    placeholder="जग्गाधनीको नाम"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <ErrorMessage name="LandDhitoPersonName" component="div" className="mt-1 text-xs text-red-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">हजुरबुबाको नाम</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoPersonGrandfather"
                    value={values.LandDhitoPersonGrandfather}
                    onChange={handleChange}
                    placeholder="हजुरबुबाको नाम"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">बुबाको नाम</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoPersonFather"
                    value={values.LandDhitoPersonFather}
                    onChange={handleChange}
                    placeholder="बुबाको नाम"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">श्रीमान/श्रीमतीको नाम</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoPersonSpouse"
                    value={values.LandDhitoPersonSpouse}
                    onChange={handleChange}
                    placeholder="पति/पत्नीको नाम"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">प्रदेश</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoPersonProvince"
                    value={values.LandDhitoPersonProvince}
                    onChange={handleChange}
                    placeholder="प्रदेश"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">जिल्ला</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoPersonDistrict"
                    value={values.LandDhitoPersonDistrict}
                    onChange={handleChange}
                    placeholder="जिल्ला"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">न.पा./गा.पा.</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoPersonMUNVDC"
                    value={values.LandDhitoPersonMUNVDC}
                    onChange={handleChange}
                    placeholder="न.पा./गा.पा."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">वडा नं.</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoPersonWardNo"
                    value={values.LandDhitoPersonWardNo}
                    onChange={handleChange}
                    placeholder="वडा नं."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">उमेर (वर्ष)</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoPersonAge"
                    value={values.LandDhitoPersonAge}
                    onChange={handleChange}
                    placeholder="उदा: ४५"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Land Tapasil Section (तपसिल - जग्गाको विवरण) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                २. तपसिल (धितो जग्गाको विवरण)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">जग्गाको ठेगाना</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoAddress"
                    value={values.LandDhitoAddress}
                    onChange={handleChange}
                    placeholder="उदा: काठमाडौं"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">वडा नं. / ब्लक नं.</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoWardBlockNo"
                    value={values.LandDhitoWardBlockNo}
                    onChange={handleChange}
                    placeholder="उदा: ५ / ख"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">कित्ता नं.</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoKittaNo"
                    value={values.LandDhitoKittaNo}
                    onChange={handleChange}
                    placeholder="उदा: १२३"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">क्षेत्रफल</label>
                  <NepaliInput
                    type="text"
                    name="LandDhitoArea"
                    value={values.LandDhitoArea}
                    onChange={handleChange}
                    placeholder="उदा: ०-४-२-०"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Loan Terms & Conditions */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                ३. ऋण तथा भुक्तानी सम्बन्धी सर्तहरु
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ऋण रकम (रु.)</label>
                  <NepaliInput
                    type="text"
                    name="LoanAmount"
                    value={values.LoanAmount}
                    onChange={handleChange}
                    placeholder="रकम"
                    disabled
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ब्याजदर (%)</label>
                  <NepaliInput
                    type="text"
                    name="RateOfInterest"
                    value={values.RateOfInterest}
                    onChange={handleChange}
                    placeholder="उदा: १४"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ऋणको उद्देश्य/शिर्षक</label>
                  <NepaliInput
                    type="text"
                    name="LoanPurpose"
                    value={values.LoanPurpose}
                    onChange={handleChange}
                    placeholder="उद्देश्य"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Witnesses Section (साक्षीहरु) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                ४. साक्षीहरुको विवरण (फड्के किनारका साक्षी)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Witness 1 */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">साक्षी १</h4>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">नाम थर</label>
                    <NepaliInput
                      type="text"
                      name="SachiName1"
                      value={values.SachiName1}
                      onChange={handleChange}
                      disabled
                      placeholder="साक्षी १ को नाम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">जिल्ला</label>
                      <NepaliInput
                        type="text"
                        name="SachiDistrict1"
                        value={values.SachiDistrict1}
                        onChange={handleChange}
                        disabled
                        placeholder="जिल्ला"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">न.पा./गा.पा.</label>
                      <NepaliInput
                        type="text"
                        name="SachiMUNVDC1"
                        value={values.SachiMUNVDC1}
                        onChange={handleChange}
                        disabled
                        placeholder="न.पा./गा.पा."
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">वडा नं.</label>
                      <NepaliInput
                        type="text"
                        name="SachiWardNo1"
                        value={values.SachiWardNo1}
                        onChange={handleChange}
                        disabled
                        placeholder="वडा"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">उमेर (वर्ष)</label>
                      <NepaliInput
                        type="text"
                        name="SachiAge1"
                        value={values.SachiAge1}
                        onChange={handleChange}
                        disabled
                        placeholder="उमेर"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Witness 2 */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">साक्षी २</h4>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">नाम थर</label>
                    <NepaliInput
                      type="text"
                      name="SachiName2"
                      value={values.SachiName2}
                      onChange={handleChange}
                      disabled
                      placeholder="साक्षी २ को नाम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">जिल्ला</label>
                      <NepaliInput
                        type="text"
                        name="SachiDistrict2"
                        value={values.SachiDistrict2}
                        onChange={handleChange}
                        placeholder="जिल्ला"
                        disabled
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">न.पा./गा.पा.</label>
                      <NepaliInput
                        type="text"
                        name="SachiMUNVDC2"
                        value={values.SachiMUNVDC2}
                        onChange={handleChange}
                        placeholder="न.पा./गा.पा."
                        disabled
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">वडा नं.</label>
                      <NepaliInput
                        type="text"
                        name="SachiWardNo2"
                        value={values.SachiWardNo2}
                        onChange={handleChange}
                        placeholder="वडा"
                        disabled
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">उमेर (वर्ष)</label>
                      <NepaliInput
                        type="text"
                        name="SachiAge2"
                        value={values.SachiAge2}
                        onChange={handleChange}
                        placeholder="उमेर"
                        disabled
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Date Section (ईति सम्वत्) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                ५. ईति सम्वत् (कानूनी मिति तथा बार)
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
                    रोज (Day of week: 01=आइत, 02=सोम ... 07=शनि)
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

            {/* Staff & Remarks Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                ६. मञ्जुरीनामा गराउने कर्मचारी (ऋण विभाग प्रमुख)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">कर्मचारीको नाम</label>
                  <input
                    type="text"
                    name="StaffName"
                    value={values.StaffName}
                    onChange={handleChange}
                    placeholder="कर्मचारीको नाम"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">कर्मचारीको पद</label>
                  <input
                    type="text"
                    name="StaffPost"
                    value={values.StaffPost}
                    onChange={handleChange}
                    placeholder="ऋण विभाग प्रमुख"
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

            {/* Live Document Preview */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-6">
              <h4 className="text-sm font-bold text-center border-b border-blue-200 pb-2 mb-4 text-slate-800">
                मञ्जुरीनामा (प्रत्यक्ष नमुना पूर्वावलोकन)
              </h4>
              <p className="text-xs leading-relaxed text-justify text-slate-800 space-y-1">
                लिखितम् <strong>{values.LandDhitoPersonProvince || '……'}</strong> प्रदेश{' '}
                <strong>{values.LandDhitoPersonDistrict || '……'}</strong> जिल्ला{' '}
                <strong>{values.LandDhitoPersonMUNVDC || '……'}</strong> वडा नं.{' '}
                <strong>{convertToNepaliNumber(values.LandDhitoPersonWardNo) || values.LandDhitoPersonWardNo || '…'}</strong> बस्ने{' '}
                <strong>{values.LandDhitoPersonGrandfather || '…………'}</strong> को नाती/नातिनी{' '}
                <strong>{values.LandDhitoPersonFather || '…………'}</strong> को छोरा/छोरी{' '}
                <strong>{values.LandDhitoPersonSpouse || '…………'}</strong> को श्रीमान/श्रीमती बर्ष{' '}
                <strong>{convertToNepaliNumber(values.LandDhitoPersonAge) || values.LandDhitoPersonAge || '…'}</strong> को{' '}
                <strong>{values.LandDhitoPersonName || '………………'}</strong> आगे{' '}
                <strong>{enterprise?.province || '……'}</strong> प्रदेश{' '}
                <strong>{enterprise?.district || '……'}</strong> जिल्ला{' '}
                <strong>{enterprise?.munvdc || '……'}</strong> स्थित <strong>{enterprise?.companyname || 'हाम्रो सहकारी संस्था लि.'}</strong> बाट{' '}
                <strong>{values.LoanPurpose || '……'}</strong> उद्देश्यमा मासिक{' '}
                <strong>{convertToNepaliNumber(values.RateOfInterest) || values.RateOfInterest || '…'}%</strong> का दरले ब्याज बुझाउने गरि आजका मिति देखि{' '}
                <strong>{convertToNepaliNumber(values.LoanPeriodYear) || values.LoanPeriodYear || '०'}</strong> वर्ष{' '}
                <strong>{convertToNepaliNumber(values.LoanPeriodMonth) || values.LoanPeriodMonth || '०'}</strong> महिना भित्रमा सावा ब्याज किस्ताबन्दीमा बुझाउने गरि रु.{' '}
                <strong>{convertToNepaliNumber(values.LoanAmount) || values.LoanAmount || '………'}</strong> (अक्षरेपी रु.{' '}
                <strong>{values.LoanAmount ? convertToNepaliWords(values.LoanAmount) : '……………'}</strong> मात्र) ऋण लिनका लागि{' '}
                <strong>{memberDetail?.Province || '……'}</strong> प्रदेश{' '}
                <strong>{memberDetail?.District || '……'}</strong> जिल्ला{' '}
                <strong>{memberDetail?.MUNVDC || '……'}</strong> वडा नं.{' '}
                <strong>{convertToNepaliNumber(memberDetail?.WardNo) || memberDetail?.WardNo || '…'}</strong> बस्ने{' '}
                <strong>{memberDetail?.FullName || '………………'}</strong> को यस संस्थाको शेयर सदस्य नं.{' '}
                <strong>{values.MemberNo || '……'}</strong> ले मेरो नाममा रहेको तपसिल बमोजिमको जग्गा निजले त्यस ऋण लिने प्रयोजनको लागि त्यस संस्थामा धितो जमानत प्रदान गर्न म मन्जुर भएको हुदा यो मन्जुरी नामाको कागजमा सहिछाप गरि दिएको छु |
              </p>

              {/* ईति सम्वत् Live Line */}
              <div className="mt-4 text-center font-semibold text-xs text-slate-900 border-t border-blue-200 pt-3">
                ईति सम्वत् {convertToNepaliNumber(values.LegalYear) || values.LegalYear || '…………'} साल{' '}
                {values.LegalMonth || '…………'} महिना{' '}
                {convertToNepaliNumber(values.LegalDay) || values.LegalDay || '……'} गते{' '}
                {convertToNepaliNumber(values.LegalDayOfWeek) || values.LegalDayOfWeek || '……'} रोज शुभम् |
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3">
              <Link to="/loan/manjurinaama" className="btn-secondary">
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
        )}
      </Formik>
    </>
  );
}

