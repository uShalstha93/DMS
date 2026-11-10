import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Save, Loader2, Info, Users, FileText, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';
import modDate from '../../utils/modDate';
import { loanBektigatJamaniApi } from '../../api/loanBektigatJamani';
import { errorMessage } from '../../api/axios';
import { NepaliInput } from '@itzsa/nepali-input';

const nepMonthsMap = {
  '01': 'बैशाख', '02': 'जेठ', '03': 'असार', '04': 'साउन',
  '05': 'भदौ', '06': 'असोज', '07': 'कार्तिक', '08': 'मंसिर',
  '09': 'पुस', '10': 'माघ', '11': 'फागुन', '12': 'चैत'
};

const getVal = (e) => {
  if (e === null || e === undefined) return '';
  if (typeof e === 'string' || typeof e === 'number') return String(e);
  if (e.target && e.target.value !== undefined) return String(e.target.value);
  return '';
};

const safeStr = (v, fallback = '...........') => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'string') return v.trim() ? v : fallback;
  if (typeof v === 'number') return String(v);
  return fallback;
};

const validationSchema = Yup.object().shape({
  MemberNo: Yup.string().required('सदस्यता नं. अनिवार्य छ'),
  LoanNo: Yup.string().required('ऋण नं. अनिवार्य छ'),
  JamaniName: Yup.string().required('जमानी दिने व्यक्तिको नाम अनिवार्य छ'),
});

export default function LoanBektigatJamaniForm() {
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
          const res = await loanBektigatJamaniApi.get(id);
          const r = res.bektigatJamani;
          setInitialData({
            MemberNo: r.MemberNo || '',
            LoanNo: r.LoanNo || '',
            EntryDate: r.EntryDate || '',

            BorrowerName: r.BorrowerName || '',
            BorrowerGrandfatherName: r.BorrowerGrandfatherName || '',
            BorrowerFatherName: r.BorrowerFatherName || '',
            BorrowerSpouseName: r.BorrowerSpouseName || '',
            BorrowerProvince: r.BorrowerProvince || '',
            BorrowerDistrict: r.BorrowerDistrict || '',
            BorrowerPalika: r.BorrowerPalika || '',
            BorrowerWard: r.BorrowerWard || '',
            BorrowerAge: r.BorrowerAge || '',
            BorrowerCitizenshipNo: r.BorrowerCitizenshipNo || '',
            BorrowerCitizenshipDistrict: r.BorrowerCitizenshipDistrict || '',
            BorrowerCitizenshipPalika: r.BorrowerCitizenshipPalika || '',
            BorrowerCitizenshipWard: r.BorrowerCitizenshipWard || '',
            BorrowerCitizenshipDate: r.BorrowerCitizenshipDate || '',

            LoanPurpose: r.LoanPurpose || '',
            LoanAmount: r.LoanAmount || '',
            LoanAmountWords: r.LoanAmountWords || '',
            LoanDate: r.LoanDate || '',

            JamaniName: r.JamaniName || '',
            JamaniGrandfatherName: r.JamaniGrandfatherName || '',
            JamaniFatherName: r.JamaniFatherName || '',
            JamaniSpouseName: r.JamaniSpouseName || '',
            JamaniProvince: r.JamaniProvince || '',
            JamaniDistrict: r.JamaniDistrict || '',
            JamaniPalika: r.JamaniPalika || '',
            JamaniWard: r.JamaniWard || '',
            JamaniAge: r.JamaniAge || '',
            JamaniMemberNo: r.JamaniMemberNo || '',
            JamaniCitizenshipNo: r.JamaniCitizenshipNo || '',

            SakshiName1: r.SakshiName1 || '',
            SakshiDistrict1: r.SakshiDistrict1 || '',
            SakshiPalika1: r.SakshiPalika1 || '',
            SakshiWardNo1: r.SakshiWardNo1 || '',
            SakshiAge1: r.SakshiAge1 || '',
            SakshiRelation1: r.SakshiRelation1 || '',

            SakshiName2: r.SakshiName2 || '',
            SakshiDistrict2: r.SakshiDistrict2 || '',
            SakshiPalika2: r.SakshiPalika2 || '',
            SakshiWardNo2: r.SakshiWardNo2 || '',
            SakshiAge2: r.SakshiAge2 || '',
            SakshiRelation2: r.SakshiRelation2 || '',

            LegalYear: r.LegalYear || '',
            LegalMonth: r.LegalMonth || '',
            LegalDay: r.LegalDay || '',
            LegalDayOfWeek: r.LegalDayOfWeek || '',

            LoanBhibhagPramukh: r.LoanBhibhagPramukh || '',
            Bhyabasthapak: r.Bhyabasthapak || '',
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

          const lRes = await loanBektigatJamaniApi.loansForMember(r.MemberNo);
          setLoans(lRes || []);
        } else {
          const mRes = await loanBektigatJamaniApi.members();
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

            BorrowerName: '',
            BorrowerGrandfatherName: '',
            BorrowerFatherName: '',
            BorrowerSpouseName: '',
            BorrowerProvince: '',
            BorrowerDistrict: '',
            BorrowerPalika: '',
            BorrowerWard: '',
            BorrowerAge: '',
            BorrowerCitizenshipNo: '',
            BorrowerCitizenshipDistrict: '',
            BorrowerCitizenshipPalika: '',
            BorrowerCitizenshipWard: '',
            BorrowerCitizenshipDate: '',

            LoanPurpose: '',
            LoanAmount: '',
            LoanAmountWords: '',
            LoanDate: currentNepDate,

            JamaniName: '',
            JamaniGrandfatherName: '',
            JamaniFatherName: '',
            JamaniSpouseName: '',
            JamaniProvince: '',
            JamaniDistrict: '',
            JamaniPalika: '',
            JamaniWard: '',
            JamaniAge: '',
            JamaniMemberNo: '',
            JamaniCitizenshipNo: '',

            SakshiName1: '',
            SakshiDistrict1: '',
            SakshiPalika1: '',
            SakshiWardNo1: '',
            SakshiAge1: '',
            SakshiRelation1: '',

            SakshiName2: '',
            SakshiDistrict2: '',
            SakshiPalika2: '',
            SakshiWardNo2: '',
            SakshiAge2: '',
            SakshiRelation2: '',

            LegalYear: curYear || '',
            LegalMonth: nepMonthsMap[curMonth] || '',
            LegalDay: curDay || '',
            LegalDayOfWeek: dayOfWeekStr,

            LoanBhibhagPramukh: '',
            Bhyabasthapak: '',
            StaffID: '',
            StaffName: '',
            StaffPost: 'ऋण विभाग प्रमुख',
            Remarks: '',
          });
        }
      } catch (e) {
        setFormError(errorMessage(e, 'विवरण लोड गर्न सकिएन।'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit]);

  // Handle member change: fetch member loans & context
  const handleMemberChange = async (memberNo, setFieldValue) => {
    setFieldValue('MemberNo', memberNo);
    setFieldValue('LoanNo', '');
    setLoanDetail(null);
    setAvailableDhitos([]);
    setAvailableSakshis([]);

    if (!memberNo) {
      setLoans([]);
      setMemberDetail(null);
      return;
    }

    try {
      const res = await loanBektigatJamaniApi.loansForMember(memberNo);
      const loansList = Array.isArray(res) ? res : res?.loans || [];
      const m = res?.member || null;
      setLoans(loansList);

      if (m) {
        setMemberDetail(m);
        let calcAge = '';
        if (m.DOB) {
          try {
            const a = calculateAgeFromNepaliDate(m.DOB);
            if (a) calcAge = String(a);
          } catch (_) { }
        }

        // Immediately pre-fill Borrower details when member is selected
        setFieldValue('BorrowerName', m.FullName || '');
        setFieldValue('BorrowerGrandfatherName', m.GrandfatherName || m.GrandFatherName || '');
        setFieldValue('BorrowerFatherName', m.FatherName || '');
        setFieldValue('BorrowerSpouseName', m.SpouseName || '');
        setFieldValue('BorrowerProvince', m.Province || m.State || '');
        setFieldValue('BorrowerDistrict', m.District || '');
        setFieldValue('BorrowerPalika', m.MUNVDC || '');
        setFieldValue('BorrowerWard', m.WardNo ? String(m.WardNo) : '');
        setFieldValue('BorrowerAge', calcAge);
        setFieldValue('BorrowerCitizenshipNo', m.CitizenshipNo || '');
        setFieldValue('BorrowerCitizenshipDistrict', m.CitIssuedDistrict || m.CitizenshipDistrict || m.District || '');
        setFieldValue('BorrowerCitizenshipPalika', m.MUNVDC || '');
        setFieldValue('BorrowerCitizenshipWard', m.WardNo ? String(m.WardNo) : '');
        setFieldValue('BorrowerCitizenshipDate', m.CitIssuedDate || m.CitizenshipDate || '');
      }
    } catch (e) {
      console.error('Error fetching member loans:', e);
    }
  };

  // Handle loan change: fetch composite context
  const handleLoanChange = async (loanNo, memberNo, setFieldValue, values) => {
    setFieldValue('LoanNo', loanNo);
    if (!loanNo || !memberNo) return;

    try {
      const ctx = await loanBektigatJamaniApi.context(memberNo, loanNo);
      const m = ctx.member || {};
      const l = ctx.loan || {};
      const ent = ctx.enterprise || {};
      const dhitos = ctx.dhitos || [];
      const sakshis = ctx.sakshis || [];

      setMemberDetail(m);
      setLoanDetail(l);
      setEnterprise(ent);
      setAvailableDhitos(dhitos);
      setAvailableSakshis(sakshis);
      setStaffs(ctx.staffs || []);

      // Calculate Borrower Age from DOB
      let calcAge = '';
      if (m.DOB) {
        try {
          const a = calculateAgeFromNepaliDate(m.DOB);
          if (a) calcAge = String(a);
        } catch (_) { }
      }

      // Pre-fill Borrower
      setFieldValue('BorrowerName', m.FullName || '');
      setFieldValue('BorrowerGrandfatherName', m.GrandfatherName || m.GrandFatherName || '');
      setFieldValue('BorrowerFatherName', m.FatherName || '');
      setFieldValue('BorrowerSpouseName', m.SpouseName || '');
      setFieldValue('BorrowerProvince', m.Province || m.State || '');
      setFieldValue('BorrowerDistrict', m.District || '');
      setFieldValue('BorrowerPalika', m.MUNVDC || '');
      setFieldValue('BorrowerWard', m.WardNo ? String(m.WardNo) : '');
      setFieldValue('BorrowerAge', calcAge);
      setFieldValue('BorrowerCitizenshipNo', m.CitizenshipNo || '');
      setFieldValue('BorrowerCitizenshipDistrict', m.CitIssuedDistrict || m.CitizenshipDistrict || m.District || '');
      setFieldValue('BorrowerCitizenshipPalika', m.MUNVDC || '');
      setFieldValue('BorrowerCitizenshipWard', m.WardNo ? String(m.WardNo) : '');
      setFieldValue('BorrowerCitizenshipDate', m.CitIssuedDate || m.CitizenshipDate || '');

      // Pre-fill Loan
      setFieldValue('LoanPurpose', l.LoanPurpose || l.LoanType || '');
      const rawLoanAmount = l.LoanAmount !== undefined && l.LoanAmount !== null ? String(l.LoanAmount) : '';
      setFieldValue('LoanAmount', rawLoanAmount);
      if (rawLoanAmount) {
        setFieldValue('LoanAmountWords', convertToNepaliWords(rawLoanAmount));
      }
      setFieldValue('LoanDate', l.EntryDate || values.EntryDate || '');

      // Pre-fill Guarantor from loandetail if available, or first dhitojamanidetail
      if (!values.JamaniName) {
        if (l.JamaniName) {
          setFieldValue('JamaniName', l.JamaniName || '');
          setFieldValue('JamaniGrandfatherName', l.JamaniGrandFatherName || l.JamaniGrandfatherName || '');
          setFieldValue('JamaniFatherName', l.JamaniFatherName || '');
          setFieldValue('JamaniSpouseName', l.JamaniSpouseName || '');
          setFieldValue('JamaniProvince', l.JamaniProvince || '');
          setFieldValue('JamaniDistrict', l.JamaniDistrict || '');
          setFieldValue('JamaniPalika', l.JamaniVDCMUN || '');
          setFieldValue('JamaniWard', l.JamaniWardNo ? String(l.JamaniWardNo) : '');
          setFieldValue('JamaniMemberNo', l.JamaniMemberNo || '');
        } else if (dhitos.length > 0) {
          const d = dhitos[0];
          setFieldValue('JamaniName', d.DhitoPerson || '');
          setFieldValue('JamaniGrandfatherName', d.DhitoFather || '');
          setFieldValue('JamaniFatherName', d.DhitoFather || '');
          setFieldValue('JamaniSpouseName', d.DhitoSpouse || '');
          setFieldValue('JamaniProvince', d.DhitoProvince || '');
          setFieldValue('JamaniDistrict', d.DhitoDistrict || '');
          setFieldValue('JamaniPalika', d.DhitoVDCMUN || '');
          setFieldValue('JamaniWard', d.DhitoWardNo ? String(d.DhitoWardNo) : '');
        }
      }

      // Pre-fill Sakshis from sakshidetail if available
      if (sakshis.length > 0) {
        const s1 = sakshis[0];
        if (s1) {
          setFieldValue('SakshiName1', s1.SakshiPerson || '');
          setFieldValue('SakshiDistrict1', s1.SakshiDistrict || '');
          setFieldValue('SakshiPalika1', s1.SakshiVDCMUN || '');
          setFieldValue('SakshiWardNo1', s1.SakshiWardNo ? String(s1.SakshiWardNo) : '');
          setFieldValue('SakshiAge1', s1.SakshiAge ? String(s1.SakshiAge) : '');
        }
        if (sakshis.length > 1) {
          const s2 = sakshis[1];
          setFieldValue('SakshiName2', s2.SakshiPerson || '');
          setFieldValue('SakshiDistrict2', s2.SakshiDistrict || '');
          setFieldValue('SakshiPalika2', s2.SakshiVDCMUN || '');
          setFieldValue('SakshiWardNo2', s2.SakshiWardNo ? String(s2.SakshiWardNo) : '');
          setFieldValue('SakshiAge2', s2.SakshiAge ? String(s2.SakshiAge) : '');
        }
      }

      // Pre-fill Staff heads
      if (ctx.loanHead?.name && !values.LoanBhibhagPramukh) {
        setFieldValue('LoanBhibhagPramukh', ctx.loanHead.name);
      }
      if (ctx.manager?.name && !values.Bhyabasthapak) {
        setFieldValue('Bhyabasthapak', ctx.manager.name);
      }
    } catch (e) {
      console.error('Error fetching context:', e);
    }
  };

  const handleApplyDhito = (d, setFieldValue) => {
    if (!d) return;
    setFieldValue('JamaniName', d.DhitoPerson || '');
    setFieldValue('JamaniFatherName', d.DhitoFather || '');
    setFieldValue('JamaniSpouseName', d.DhitoSpouse || '');
    setFieldValue('JamaniProvince', d.DhitoProvince || '');
    setFieldValue('JamaniDistrict', d.DhitoDistrict || '');
    setFieldValue('JamaniPalika', d.DhitoVDCMUN || '');
    setFieldValue('JamaniWard', d.DhitoWardNo ? String(d.DhitoWardNo) : '');
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await loanBektigatJamaniApi.save(values, id);
      navigate(`/loan/bektigat-jamani/${res.id || id}`, {
        state: { message: isEdit ? 'व्यक्तिगत जमानी तमसुक अद्यावधिक भयो।' : 'नयाँ व्यक्तिगत जमानी तमसुक सुरक्षित भयो।' },
      });
    } catch (e) {
      setFormError(errorMessage(e, 'सुरक्षित गर्न सकिएन।'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'व्यक्तिगत जमानी तमसुक सम्पादन' : 'नयाँ व्यक्तिगत जमानी तमसुक दर्ता'}
        subtitle="ऋण असुलीको व्यक्तिगत जमानी तमसुक फारम तयार गर्नुहोस्"
      >
        <Link to="/loan/bektigat-jamani" className="btn-secondary">
          <ArrowLeft className="size-4" /> पछाडि जानुहोस्
        </Link>
      </PageHeader>

      {formError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {formError}
        </div>
      )}

      <Formik
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={false}
      >
        {({ values, setFieldValue, isSubmitting: formikSubmitting }) => (
          <Form className="space-y-6">
            {/* 1. सदस्य र ऋण छनौट */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2">
                <Users className="size-5 text-brand-600" /> १. सदस्य र ऋण विवरण छनौट
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Member Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    सदस्यता नं. / नाम <span className="text-red-500">*</span>
                  </label>
                  {isEdit ? (
                    <input
                      type="text"
                      disabled
                      value={`${values.MemberNo} - ${memberDetail?.FullName || ''}`}
                      className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                    />
                  ) : (
                    <select
                      value={values.MemberNo}
                      onChange={(e) => handleMemberChange(e.target.value, setFieldValue)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">-- सदस्य छान्नुहोस् --</option>
                      {members.map((m) => (
                        <option key={m.MemberNo} value={m.MemberNo}>
                          {m.MemberNo} - {m.FullName}
                        </option>
                      ))}
                    </select>
                  )}
                  <ErrorMessage name="MemberNo" component="div" className="mt-1 text-xs text-red-500" />
                </div>

                {/* Loan Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ऋण नं. <span className="text-red-500">*</span>
                  </label>
                  {isEdit ? (
                    <input
                      type="text"
                      disabled
                      value={values.LoanNo}
                      className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                    />
                  ) : (
                    <select
                      value={values.LoanNo}
                      disabled={!values.MemberNo}
                      onChange={(e) => handleLoanChange(e.target.value, values.MemberNo, setFieldValue, values)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100"
                    >
                      <option value="">-- ऋण छान्नुहोस् --</option>
                      {loans.map((l) => (
                        <option key={l.LoanNo} value={l.LoanNo}>
                          {l.LoanNo} - {l.LoanType} (रु. {l.LoanAmount})
                        </option>
                      ))}
                    </select>
                  )}
                  <ErrorMessage name="LoanNo" component="div" className="mt-1 text-xs text-red-500" />
                </div>

                {/* Entry Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">फारम / दर्ता मिति</label>
                  <NepaliCalendar
                    value={values.EntryDate}
                    onChange={(d) => setFieldValue('EntryDate', d)}
                    width={180}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. ऋणीको विवरण (Borrower) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="size-5 text-indigo-600" /> २. ऋणी सदस्यको विवरण (Borrower Details)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ऋणीको नाम</label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerName}
                    onChange={(e) => setFieldValue('BorrowerName', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">हजुरबुवाको नाम</label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerGrandfatherName}
                    onChange={(e) => setFieldValue('BorrowerGrandfatherName', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">बुवाको नाम</label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerFatherName}
                    onChange={(e) => setFieldValue('BorrowerFatherName', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">श्रीमान् / श्रीमतीको नाम</label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerSpouseName}
                    onChange={(e) => setFieldValue('BorrowerSpouseName', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">प्रदेश</label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerProvince}
                    onChange={(e) => setFieldValue('BorrowerProvince', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">जिल्ला</label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerDistrict}
                    onChange={(e) => setFieldValue('BorrowerDistrict', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">गा.वि.स. / नगरपालिका</label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerPalika}
                    onChange={(e) => setFieldValue('BorrowerPalika', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">वडा नं. / उमेर</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="वडा नं."
                      value={values.BorrowerWard}
                      onChange={(e) => setFieldValue('BorrowerWard', e.target.value)}
                      className="w-1/2 rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="वर्ष"
                      value={values.BorrowerAge}
                      onChange={(e) => setFieldValue('BorrowerAge', e.target.value)}
                      className="w-1/2 rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">नागरिकता नं.</label>
                  <input
                    type="text"
                    value={values.BorrowerCitizenshipNo}
                    onChange={(e) => setFieldValue('BorrowerCitizenshipNo', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">नागरिकता जारी जिल्ला</label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerCitizenshipDistrict}
                    onChange={(e) => setFieldValue('BorrowerCitizenshipDistrict', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">नागरिकता बमोजिम गा.वि.स./न.पा. वडा</label>
                  <div className="flex gap-2">
                    <NepaliInput
                      type="text"
                      placeholder="गा.पा./न.पा."
                      value={values.BorrowerCitizenshipPalika}
                      onChange={(e) => setFieldValue('BorrowerCitizenshipPalika', getVal(e))}
                      className="w-2/3 rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="वडा"
                      value={values.BorrowerCitizenshipWard}
                      onChange={(e) => setFieldValue('BorrowerCitizenshipWard', e.target.value)}
                      className="w-1/3 rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">नागरिकता जारी मिति</label>
                  <NepaliCalendar
                    value={values.BorrowerCitizenshipDate}
                    onChange={(d) => setFieldValue('BorrowerCitizenshipDate', d)}
                    width={180}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. ऋण सम्बन्धी विवरण (Loan Details) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="size-5 text-emerald-600" /> ३. ऋण विवरण (Loan Amount & Purpose)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">परियोजना / ऋणको नाम</label>
                  <NepaliInput
                    type="text"
                    value={values.LoanPurpose}
                    onChange={(e) => setFieldValue('LoanPurpose', getVal(e))}
                    placeholder="उदा. व्यापार, कृषि..."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ऋण रकम (रु.)</label>
                  <NepaliInput
                    type="text"
                    value={values.LoanAmount}
                    onChange={(e) => {
                      const v = getVal(e);
                      setFieldValue('LoanAmount', v);
                      if (v) setFieldValue('LoanAmountWords', convertToNepaliWords(v));
                    }}
                    placeholder="रकम"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">ऋण रकम (अक्षरेपी)</label>
                  <NepaliInput
                    type="text"
                    value={values.LoanAmountWords}
                    onChange={(e) => setFieldValue('LoanAmountWords', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. व्यक्तिगत जमानी दिने विवरण (Guarantor Details) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="size-5 text-brand-600" /> ४. व्यक्तिगत जमानी दिने व्यक्तिको विवरण (Guarantor)
                </h3>
                {availableDhitos.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">ऋणमा उपलब्ध धितो/जमानीकर्ता:</span>
                    {availableDhitos.map((d, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyDhito(d, setFieldValue)}
                        className="rounded bg-indigo-50 px-2 py-1 font-medium text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                      >
                        + {d.DhitoPerson}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    जमानी दिनेको नाम <span className="text-red-500">*</span>
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.JamaniName}
                    onChange={(e) => setFieldValue('JamaniName', getVal(e))}
                    placeholder="जमानीकर्ताको पूरा नाम"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                  />
                  <ErrorMessage name="JamaniName" component="div" className="mt-1 text-xs text-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">हजुरबुवाको नाम</label>
                  <NepaliInput
                    type="text"
                    value={values.JamaniGrandfatherName}
                    onChange={(e) => setFieldValue('JamaniGrandfatherName', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">बुवाको नाम</label>
                  <NepaliInput
                    type="text"
                    value={values.JamaniFatherName}
                    onChange={(e) => setFieldValue('JamaniFatherName', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">श्रीमान् / श्रीमतीको नाम</label>
                  <NepaliInput
                    type="text"
                    value={values.JamaniSpouseName}
                    onChange={(e) => setFieldValue('JamaniSpouseName', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">प्रदेश</label>
                  <NepaliInput
                    type="text"
                    value={values.JamaniProvince}
                    onChange={(e) => setFieldValue('JamaniProvince', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">जिल्ला</label>
                  <NepaliInput
                    type="text"
                    value={values.JamaniDistrict}
                    onChange={(e) => setFieldValue('JamaniDistrict', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">गा.वि.स. / नगरपालिका</label>
                  <NepaliInput
                    type="text"
                    value={values.JamaniPalika}
                    onChange={(e) => setFieldValue('JamaniPalika', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">वडा नं. / उमेर</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="वडा"
                      value={values.JamaniWard}
                      onChange={(e) => setFieldValue('JamaniWard', e.target.value)}
                      className="w-1/2 rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="वर्ष"
                      value={values.JamaniAge}
                      onChange={(e) => setFieldValue('JamaniAge', e.target.value)}
                      className="w-1/2 rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">सदस्य नं. (यदि सदस्य भए)</label>
                  <input
                    type="text"
                    value={values.JamaniMemberNo}
                    onChange={(e) => setFieldValue('JamaniMemberNo', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">नागरिकता नं.</label>
                  <input
                    type="text"
                    value={values.JamaniCitizenshipNo}
                    onChange={(e) => setFieldValue('JamaniCitizenshipNo', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 5. साक्षीहरूको विवरण (Witnesses) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2">
                <Users className="size-5 text-purple-600" /> ५. साक्षीहरूको विवरण (Witnesses)
              </h3>
              <div className="space-y-4">
                {/* Sakshi 1 */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-3">१. पहिलो साक्षी (Witness 1)</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">साक्षीको नाम</label>
                      <NepaliInput
                        type="text"
                        value={values.SakshiName1}
                        onChange={(e) => setFieldValue('SakshiName1', getVal(e))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">जिल्ला</label>
                      <NepaliInput
                        type="text"
                        value={values.SakshiDistrict1}
                        onChange={(e) => setFieldValue('SakshiDistrict1', getVal(e))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">गा.वि.स./न.पा.</label>
                      <NepaliInput
                        type="text"
                        value={values.SakshiPalika1}
                        onChange={(e) => setFieldValue('SakshiPalika1', getVal(e))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">वडा नं. / वर्ष</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="वडा"
                          value={values.SakshiWardNo1}
                          onChange={(e) => setFieldValue('SakshiWardNo1', e.target.value)}
                          className="w-1/2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="वर्ष"
                          value={values.SakshiAge1}
                          onChange={(e) => setFieldValue('SakshiAge1', e.target.value)}
                          className="w-1/2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">को (नाता / बाबुको नाम)</label>
                      <NepaliInput
                        type="text"
                        placeholder="को..."
                        value={values.SakshiRelation1}
                        onChange={(e) => setFieldValue('SakshiRelation1', getVal(e))}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Sakshi 2 */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-3">२. दोस्रो साक्षी (Witness 2)</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">साक्षीको नाम</label>
                      <NepaliInput
                        type="text"
                        value={values.SakshiName2}
                        onChange={(e) => setFieldValue('SakshiName2', getVal(e))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">जिल्ला</label>
                      <NepaliInput
                        type="text"
                        value={values.SakshiDistrict2}
                        onChange={(e) => setFieldValue('SakshiDistrict2', getVal(e))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">गा.वि.स./न.पा.</label>
                      <NepaliInput
                        type="text"
                        value={values.SakshiPalika2}
                        onChange={(e) => setFieldValue('SakshiPalika2', getVal(e))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">वडा नं. / वर्ष</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="वडा"
                          value={values.SakshiWardNo2}
                          onChange={(e) => setFieldValue('SakshiWardNo2', e.target.value)}
                          className="w-1/2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="वर्ष"
                          value={values.SakshiAge2}
                          onChange={(e) => setFieldValue('SakshiAge2', e.target.value)}
                          className="w-1/2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">को (नाता / बाबुको नाम)</label>
                      <NepaliInput
                        type="text"
                        placeholder="को..."
                        value={values.SakshiRelation2}
                        onChange={(e) => setFieldValue('SakshiRelation2', getVal(e))}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. कानूनी मिति तथा कर्मचारी विवरण */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="size-5 text-brand-600" /> ६. कानूनी मिति (ईति सम्वत्) र कर्मचारी विवरण
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ईति सम्वत् साल</label>
                  <input
                    type="text"
                    value={values.LegalYear}
                    onChange={(e) => setFieldValue('LegalYear', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">महिना</label>
                  <input
                    type="text"
                    value={values.LegalMonth}
                    onChange={(e) => setFieldValue('LegalMonth', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">गते</label>
                  <input
                    type="text"
                    value={values.LegalDay}
                    onChange={(e) => setFieldValue('LegalDay', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">रोज (०१ = आइत, ..., ०७ = शनि)</label>
                  <input
                    type="text"
                    value={values.LegalDayOfWeek}
                    onChange={(e) => setFieldValue('LegalDayOfWeek', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">तयार गर्ने (ऋण विभाग प्रमुख)</label>
                  <NepaliInput
                    type="text"
                    value={values.LoanBhibhagPramukh}
                    onChange={(e) => setFieldValue('LoanBhibhagPramukh', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">रुजु गर्ने (व्यवस्थापक)</label>
                  <NepaliInput
                    type="text"
                    value={values.Bhyabasthapak}
                    onChange={(e) => setFieldValue('Bhyabasthapak', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">कैफियत (Remarks)</label>
                  <input
                    type="text"
                    value={values.Remarks}
                    onChange={(e) => setFieldValue('Remarks', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 7. Live Preview of Deed */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center justify-between border-b pb-2">
                <span>लाइभ व्यक्तिगत जमानी तमसुक ड्राफ्ट (Deed Preview)</span>
                <span className="text-xs font-normal text-slate-400">फारममा भरिएका विवरणहरू स्वतः देखिन्छन्</span>
              </h3>

              <div className="border border-slate-300 bg-amber-50/20 p-6 rounded-lg text-sm text-slate-800 leading-relaxed space-y-4">
                <div className="text-center font-bold text-base text-slate-900 border-b pb-2">
                  व्यक्तिगत जमानी तमसुक
                </div>

                <p className="text-justify indent-8">
                  लिखितम <strong className="underline decoration-slate-400">{safeStr(values.BorrowerProvince)}</strong> प्रदेश{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.BorrowerDistrict)}</strong> जिल्ला{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.BorrowerPalika)}</strong> महा-नगर/ उप-महानगर/ नगरपालिका/ गाउपालिका वडा न.{' '}
                  <strong className="underline decoration-slate-400">{convertToNepaliNumber(values.BorrowerWard) || '.....'}</strong> बस्ने वर्ष{' '}
                  <strong className="underline decoration-slate-400">{convertToNepaliNumber(values.BorrowerAge) || '.....'}</strong> को सदस्य न.{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.MemberNo, '.....')}</strong> को म{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.BorrowerGrandfatherName)}</strong> को नाती/नातिनी{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.BorrowerFatherName)}</strong> को छोरा/छोरी{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.BorrowerSpouseName)}</strong> श्रीमान/ श्रीमती{' '}
                  नागरिकता बमोजिम <strong className="underline decoration-slate-400">{safeStr(values.BorrowerCitizenshipDistrict)}</strong> जिल्ला{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.BorrowerCitizenshipPalika)}</strong> गा. वि. स. / नगरपालिका/ गाउपालिका वडा न.{' '}
                  <strong className="underline decoration-slate-400">{convertToNepaliNumber(values.BorrowerCitizenshipWard) || '.....'}</strong> जारी मिति{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.BorrowerCitizenshipDate)}</strong> जारी जिल्ला{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.BorrowerCitizenshipDistrict)}</strong> आगे यस{' '}
                  <strong className="font-bold">{enterprise?.CompanyName || 'सहकारी संस्था'}</strong> बाट{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.LoanPurpose)}</strong> परियोजनाको निमित्त रु.{' '}
                  <strong className="underline decoration-slate-400">{convertToNepaliNumber(values.LoanAmount) || '...........'}</strong> (अक्षरेपी{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.LoanAmountWords)}</strong>) मात्र ऋण लिई मिति{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.LoanDate)}</strong> मा तमसुक गरि लिएको कर्जा निजको{' '}
                  <strong className="font-bold">{enterprise?.CompanyName || 'सहकारी संस्था'}</strong>{' '}
                  {enterprise?.VDCMUN || ''} न पा/गा.पा वडा न. {enterprise?.WardNo || ''} संगको सर्त सम्झौता उल्लघन गरि कर्जा नतिरेमा लिलाम बिक्रि वा अन्य ब्यबस्थावाट{' '}
                  <strong className="font-bold">{enterprise?.CompanyName || 'सहकारी संस्था'}</strong> ले लिने रकम असुल गरेमा मन्जुरी छ भनि त्यस संस्थाबाट सोधनी गर्दा मेरो चित्त बुझ्यो । उपयुक्त{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.BorrowerName, 'ऋणी')}</strong> ले कर्जा लिदा लेखिदिएको धितो, बचत, शेयर तथा घरघरानाबाट{' '}
                  {enterprise?.CompanyName || 'सहकारी संस्था'} को लिने रकम असुल हुन नसकेमा निजले कर्जा लिदा गरिदिएको तमसुकलाई यसै लिखतको अभिन्न अंग मानी म{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.JamaniGrandfatherName)}</strong> को नाती/नातिनी{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.JamaniFatherName)}</strong> को छोरा/छोरी{' '}
                  <strong className="underline decoration-slate-400">{safeStr(values.JamaniSpouseName)}</strong> श्रीमान/ श्रीमती म{' '}
                  <strong className="underline decoration-slate-400 text-indigo-900 font-bold">{safeStr(values.JamaniName)}</strong> स्वयमको नाममा रहेको जुनसुकै चलअचल सम्पति{' '}
                  {enterprise?.CompanyName || 'सहकारी संस्था'} ले लिने रकम असुलउपर गरेमा र असुलीको सिलसिलामा मेरो नाम कालो सुचिमा समावेश गरेमा मेरो पूर्ण मन्जुरी छ । पछी निजको नामको बाकी कर्जा मेरो नामको सम्पतिबाट असुलउपर गर्न पाउने होइन र मलाई कालो सुचिमा राख्न पाउने छैन भनि कहिँ कतै कुनै किसिमको उजुर वाजुर गर्ने छैन, गरे यसै कागजबाट बदर गरिदिनु हुन भनि मेरो मनोमानी, राजीखुसीले{' '}
                  {enterprise?.CompanyName || 'सहकारी संस्था'} मा बसी किनारामा साक्षीको रोहबरमा यो व्यक्तिगत जमानिको कागज गरिदियाँ ।
                </p>

                <div className="pt-4 flex justify-between items-center text-xs font-semibold text-slate-700">
                  <div>
                    ईति सम्वत् {convertToNepaliNumber(values.LegalYear)} साल {values.LegalMonth} महिना {convertToNepaliNumber(values.LegalDay)} गते रोज {convertToNepaliNumber(values.LegalDayOfWeek)} शुभम्
                  </div>
                  <div>
                    जमानी दिनेको सहि: <span className="font-bold">{safeStr(values.JamaniName, '..................')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link to="/loan/bektigat-jamani" className="btn-secondary">
                रद्द गर्नुहोस्
              </Link>
              <button
                type="submit"
                disabled={formikSubmitting || submitting}
                className="btn-primary inline-flex items-center gap-2"
              >
                {formikSubmitting || submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> सुरक्षित हुँदैछ...
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> {isEdit ? 'अद्यावधिक गर्नुहोस्' : 'सुरक्षित गर्नुहोस्'}
                  </>
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
