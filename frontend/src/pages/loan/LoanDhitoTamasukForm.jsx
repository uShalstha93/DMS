import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  User,
  DollarSign,
  ShieldAlert,
  Users,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';
import modDate from '../../utils/modDate';
import { NepaliInput } from '@itzsa/nepali-input';
import { loanDhitoTamasukApi } from '../../api/loanDhitoTamasuk';
import { errorMessage } from '../../api/axios';

const nepMonthsMap = {
  '01': 'बैशाख',
  '02': 'जेठ',
  '03': 'असार',
  '04': 'साउन',
  '05': 'भदौ',
  '06': 'असोज',
  '07': 'कार्तिक',
  '08': 'मंसिर',
  '09': 'पुस',
  '10': 'माघ',
  '11': 'फागुन',
  '12': 'चैत',
};

// Helper to safely extract string from NepaliInput event
const getVal = (e) => {
  if (typeof e === 'string' || typeof e === 'number') return String(e);
  if (e?.target?.value !== undefined) return String(e.target.value);
  return '';
};

const validationSchema = Yup.object().shape({
  MemberNo: Yup.string().required('सदस्यता नं. अनिवार्य छ'),
  LoanNo: Yup.string().required('ऋण नं. अनिवार्य छ'),
});

export default function LoanDhitoTamasukForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Dropdown / context lists
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [memberDetail, setMemberDetail] = useState(null);
  const [loanDetail, setLoanDetail] = useState(null);
  const [availableDhitos, setAvailableDhitos] = useState([]);
  const [availableSakshis, setAvailableSakshis] = useState([]);
  const [enterprise, setEnterprise] = useState(null);
  const [staffs, setStaffs] = useState([]);

  const [initialData, setInitialData] = useState({
    MemberNo: '',
    LoanNo: '',
    EntryDate: '',

    SahakariAin: '२०४८',
    JillaSahakariAddress: '',

    BorrowerName: '',
    BorrowerGrandfatherName: '',
    BorrowerFatherName: '',
    BorrowerProvince: '',
    BorrowerDistrict: '',
    BorrowerPalika: '',
    BorrowerWard: '',
    BorrowerTmpProvince: '',
    BorrowerTmpDistrict: '',
    BorrowerTmpPalika: '',
    BorrowerTmpWard: '',
    BorrowerCitizenshipNo: '',
    BorrowerCitizenshipDate: '',
    BorrowerCitizenshipDistrict: '',
    BorrowerAge: '',

    LoanPurpose: '',
    LoanApplicationDate: '',
    LoanAmount: '',
    LoanAmountWords: '',
    RateOfInterest: '',
    LoanPeriodYear: '',
    LoanPeriodMonth: '',
    LoanKista: '',

    DhitoPerson: '',
    DhitoDistrict: '',
    DhitoVDCMUN: '',
    DhitoWardNo: '',
    DhitoKittaNo: '',
    DhitoArea: '',
    DhitoRemarks: '',
    DhitoItems: [],

    SakshiName1: '',
    SakshiDistrict1: '',
    SakshiPalika1: '',
    SakshiWardNo1: '',
    SakshiMemberNo1: '',

    SakshiName2: '',
    SakshiDistrict2: '',
    SakshiPalika2: '',
    SakshiWardNo2: '',
    SakshiMemberNo2: '',

    LegalYear: '',
    LegalMonth: '',
    LegalDay: '',
    LegalDayOfWeek: '',

    LoanBhibhagPramukh: '',
    Byabasthapak: '',
    StaffID: '',
    StaffName: '',
    StaffPost: 'ऋण विभाग प्रमुख',
    Remarks: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        if (isEdit) {
          const res = await loanDhitoTamasukApi.get(id);
          const r = res.dhitoTamasuk || {};

          let dhitoItems = [];
          if (Array.isArray(r.DhitoItems)) {
            dhitoItems = r.DhitoItems;
          } else if (res.dhitos && res.dhitos.length > 0) {
            dhitoItems = res.dhitos;
          }

          setInitialData({
            MemberNo: r.MemberNo || '',
            LoanNo: r.LoanNo || '',
            EntryDate: r.EntryDate || '',

            SahakariAin: r.SahakariAin || '२०४८',
            JillaSahakariAddress: r.JillaSahakariAddress || '',

            BorrowerName: r.BorrowerName || '',
            BorrowerGrandfatherName: r.BorrowerGrandfatherName || '',
            BorrowerFatherName: r.BorrowerFatherName || '',
            BorrowerProvince: r.BorrowerProvince || '',
            BorrowerDistrict: r.BorrowerDistrict || '',
            BorrowerPalika: r.BorrowerPalika || '',
            BorrowerWard: r.BorrowerWard || '',
            BorrowerTmpProvince: r.BorrowerTmpProvince || '',
            BorrowerTmpDistrict: r.BorrowerTmpDistrict || '',
            BorrowerTmpPalika: r.BorrowerTmpPalika || '',
            BorrowerTmpWard: r.BorrowerTmpWard || '',
            BorrowerCitizenshipNo: r.BorrowerCitizenshipNo || '',
            BorrowerCitizenshipDate: r.BorrowerCitizenshipDate || '',
            BorrowerCitizenshipDistrict: r.BorrowerCitizenshipDistrict || '',
            BorrowerAge: r.BorrowerAge || '',

            LoanPurpose: r.LoanPurpose || '',
            LoanApplicationDate: r.LoanApplicationDate || '',
            LoanAmount: r.LoanAmount || '',
            LoanAmountWords: r.LoanAmountWords || '',
            RateOfInterest: r.RateOfInterest || '',
            LoanPeriodYear: r.LoanPeriodYear || '',
            LoanPeriodMonth: r.LoanPeriodMonth || '',
            LoanKista: r.LoanKista || '',

            DhitoPerson: r.DhitoPerson || '',
            DhitoDistrict: r.DhitoDistrict || '',
            DhitoVDCMUN: r.DhitoVDCMUN || '',
            DhitoWardNo: r.DhitoWardNo || '',
            DhitoKittaNo: r.DhitoKittaNo || '',
            DhitoArea: r.DhitoArea || '',
            DhitoRemarks: r.DhitoRemarks || '',
            DhitoItems: dhitoItems,

            SakshiName1: r.SakshiName1 || '',
            SakshiDistrict1: r.SakshiDistrict1 || '',
            SakshiPalika1: r.SakshiPalika1 || '',
            SakshiWardNo1: r.SakshiWardNo1 || '',
            SakshiMemberNo1: r.SakshiMemberNo1 || '',

            SakshiName2: r.SakshiName2 || '',
            SakshiDistrict2: r.SakshiDistrict2 || '',
            SakshiPalika2: r.SakshiPalika2 || '',
            SakshiWardNo2: r.SakshiWardNo2 || '',
            SakshiMemberNo2: r.SakshiMemberNo2 || '',

            LegalYear: r.LegalYear || '',
            LegalMonth: r.LegalMonth || '',
            LegalDay: r.LegalDay || '',
            LegalDayOfWeek: r.LegalDayOfWeek || '',

            LoanBhibhagPramukh: r.LoanBhibhagPramukh || '',
            Byabasthapak: r.Byabasthapak || '',
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

          const lRes = await loanDhitoTamasukApi.loansForMember(r.MemberNo);
          setLoans(Array.isArray(lRes) ? lRes : lRes?.loans || []);
        } else {
          const mRes = await loanDhitoTamasukApi.members();
          setMembers(mRes || []);

          // Today's Nepali Date & Day of Week calculation
          const currentNepDate = modDate.getCurrentNepaliDate();
          const [curYear, curMonth, curDay] = currentNepDate.split('/');
          const dayOfWeekNum = modDate.getDayOfWeek(new Date()); // 1 = Sunday ... 7 = Saturday
          const dayOfWeekStr = String(dayOfWeekNum).padStart(2, '0');

          setInitialData({
            MemberNo: '',
            LoanNo: '',
            EntryDate: currentNepDate,

            SahakariAin: '२०४८',
            JillaSahakariAddress: '',

            BorrowerName: '',
            BorrowerGrandfatherName: '',
            BorrowerFatherName: '',
            BorrowerProvince: '',
            BorrowerDistrict: '',
            BorrowerPalika: '',
            BorrowerWard: '',
            BorrowerTmpProvince: '',
            BorrowerTmpDistrict: '',
            BorrowerTmpPalika: '',
            BorrowerTmpWard: '',
            BorrowerCitizenshipNo: '',
            BorrowerCitizenshipDate: '',
            BorrowerCitizenshipDistrict: '',
            BorrowerAge: '',

            LoanPurpose: '',
            LoanApplicationDate: currentNepDate,
            LoanAmount: '',
            LoanAmountWords: '',
            RateOfInterest: '',
            LoanPeriodYear: '',
            LoanPeriodMonth: '',
            LoanKista: '',

            DhitoPerson: '',
            DhitoDistrict: '',
            DhitoVDCMUN: '',
            DhitoWardNo: '',
            DhitoKittaNo: '',
            DhitoArea: '',
            DhitoRemarks: '',
            DhitoItems: [],

            SakshiName1: '',
            SakshiDistrict1: '',
            SakshiPalika1: '',
            SakshiWardNo1: '',
            SakshiMemberNo1: '',

            SakshiName2: '',
            SakshiDistrict2: '',
            SakshiPalika2: '',
            SakshiWardNo2: '',
            SakshiMemberNo2: '',

            LegalYear: curYear || '',
            LegalMonth: nepMonthsMap[curMonth] || '',
            LegalDay: curDay || '',
            LegalDayOfWeek: dayOfWeekStr,

            LoanBhibhagPramukh: '',
            Byabasthapak: '',
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
      const res = await loanDhitoTamasukApi.loansForMember(memberNo);
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

        // Pre-fill Borrower details
        setFieldValue('BorrowerName', m.FullName || '');
        setFieldValue('BorrowerGrandfatherName', m.GrandfatherName || m.GrandFatherName || '');
        setFieldValue('BorrowerFatherName', m.FatherName || '');
        setFieldValue('BorrowerProvince', m.Province || m.State || '');
        setFieldValue('BorrowerDistrict', m.District || '');
        setFieldValue('BorrowerPalika', m.MUNVDC || '');
        setFieldValue('BorrowerWard', m.WardNo ? String(m.WardNo) : '');
        setFieldValue('BorrowerTmpProvince', m.TmpProvince || m.Province || '');
        setFieldValue('BorrowerTmpDistrict', m.TmpDistrict || m.District || '');
        setFieldValue('BorrowerTmpPalika', m.TmpMUNVDC || m.MUNVDC || '');
        setFieldValue('BorrowerTmpWard', m.TmpWardNo ? String(m.TmpWardNo) : m.WardNo ? String(m.WardNo) : '');
        setFieldValue('BorrowerAge', calcAge);
        setFieldValue('BorrowerCitizenshipNo', m.CitizenshipNo || '');
        setFieldValue('BorrowerCitizenshipDistrict', m.CitIssuedDistrict || m.CitizenshipDistrict || m.District || '');
        setFieldValue('BorrowerCitizenshipDate', m.CitIssuedDate || m.CitizenshipDate || '');
      }
    } catch (e) {
      console.error('Error fetching member loans:', e);
    }
  };

  // Handle loan change: fetch composite context including all Dhito & Sakshi
  const handleLoanChange = async (loanNo, memberNo, setFieldValue, values) => {
    setFieldValue('LoanNo', loanNo);
    if (!loanNo || !memberNo) return;

    try {
      const ctx = await loanDhitoTamasukApi.context(memberNo, loanNo);
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
      setFieldValue('BorrowerProvince', m.Province || m.State || '');
      setFieldValue('BorrowerDistrict', m.District || '');
      setFieldValue('BorrowerPalika', m.MUNVDC || '');
      setFieldValue('BorrowerWard', m.WardNo ? String(m.WardNo) : '');
      setFieldValue('BorrowerTmpProvince', m.TmpProvince || m.Province || '');
      setFieldValue('BorrowerTmpDistrict', m.TmpDistrict || m.District || '');
      setFieldValue('BorrowerTmpPalika', m.TmpMUNVDC || m.MUNVDC || '');
      setFieldValue('BorrowerTmpWard', m.TmpWardNo ? String(m.TmpWardNo) : m.WardNo ? String(m.WardNo) : '');
      setFieldValue('BorrowerAge', calcAge);
      setFieldValue('BorrowerCitizenshipNo', m.CitizenshipNo || '');
      setFieldValue('BorrowerCitizenshipDistrict', m.CitIssuedDistrict || m.CitizenshipDistrict || m.District || '');
      setFieldValue('BorrowerCitizenshipDate', m.CitIssuedDate || m.CitizenshipDate || '');

      // Pre-fill Loan
      setFieldValue('LoanPurpose', l.LoanPurpose || l.LoanType || '');
      setFieldValue('LoanApplicationDate', l.EntryDate || values.EntryDate || '');
      const rawLoanAmount = l.LoanAmount !== undefined && l.LoanAmount !== null ? String(l.LoanAmount) : '';
      setFieldValue('LoanAmount', rawLoanAmount);
      if (rawLoanAmount) {
        setFieldValue('LoanAmountWords', convertToNepaliWords(rawLoanAmount));
      }
      setFieldValue('RateOfInterest', l.RateOfInterest !== undefined && l.RateOfInterest !== null ? String(l.RateOfInterest) : '');
      setFieldValue('LoanPeriodYear', l.LoanPeriodYear !== undefined && l.LoanPeriodYear !== null ? String(l.LoanPeriodYear) : '');
      setFieldValue('LoanPeriodMonth', l.LoanPeriodMonth !== undefined && l.LoanPeriodMonth !== null ? String(l.LoanPeriodMonth) : '');
      setFieldValue('LoanKista', l.LoanKista !== undefined && l.LoanKista !== null ? String(l.LoanKista) : '');

      // Pre-fill District Coop address from Enterprise district
      if (!values.JillaSahakariAddress) {
        setFieldValue('JillaSahakariAddress', ent.district || ent.District || 'काठमाडौं');
      }

      // Pre-fill Dhito details from dhitojamanidetail table
      if (dhitos.length > 0) {
        const first = dhitos[0];
        setFieldValue('DhitoPerson', first.DhitoPerson || '');
        setFieldValue('DhitoDistrict', first.DhitoDistrict || '');
        setFieldValue('DhitoVDCMUN', first.DhitoVDCMUN || '');
        setFieldValue('DhitoWardNo', first.DhitoWardNo ? String(first.DhitoWardNo) : '');
        setFieldValue('DhitoKittaNo', first.DhitoKittaNo || '');
        setFieldValue('DhitoArea', first.DhitoArea || '');
        setFieldValue('DhitoRemarks', first.Remarks || '');

        setFieldValue(
          'DhitoItems',
          dhitos.map((d) => ({
            DhitoPerson: d.DhitoPerson || '',
            DhitoDistrict: d.DhitoDistrict || '',
            DhitoVDCMUN: d.DhitoVDCMUN || '',
            DhitoWardNo: d.DhitoWardNo ? String(d.DhitoWardNo) : '',
            DhitoKittaNo: d.DhitoKittaNo || '',
            DhitoArea: d.DhitoArea || '',
            Remarks: d.Remarks || '',
          }))
        );
      } else {
        setFieldValue('DhitoItems', []);
      }

      // Pre-fill Sakshis from sakshidetail table if present
      if (sakshis.length > 0) {
        const s1 = sakshis[0];
        setFieldValue('SakshiName1', s1.SakshiPerson || '');
        setFieldValue('SakshiDistrict1', s1.SakshiDistrict || '');
        setFieldValue('SakshiPalika1', s1.SakshiVDCMUN || '');
        setFieldValue('SakshiWardNo1', s1.SakshiWardNo ? String(s1.SakshiWardNo) : '');
        setFieldValue('SakshiMemberNo1', '');

        if (sakshis.length > 1) {
          const s2 = sakshis[1];
          setFieldValue('SakshiName2', s2.SakshiPerson || '');
          setFieldValue('SakshiDistrict2', s2.SakshiDistrict || '');
          setFieldValue('SakshiPalika2', s2.SakshiVDCMUN || '');
          setFieldValue('SakshiWardNo2', s2.SakshiWardNo ? String(s2.SakshiWardNo) : '');
          setFieldValue('SakshiMemberNo2', '');
        }
      }

      // Pre-fill Staff & Officials
      if (ctx.loanHead && !values.LoanBhibhagPramukh) {
        setFieldValue('LoanBhibhagPramukh', ctx.loanHead.name || ctx.loanHead.StaffName || '');
      }
      if (ctx.manager && !values.Byabasthapak) {
        setFieldValue('Byabasthapak', ctx.manager.name || ctx.manager.StaffName || '');
      }
    } catch (e) {
      console.error('Error fetching context:', e);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await loanDhitoTamasukApi.save(values, id);
      navigate(`/loan/dhito-tamasuk/${res.id || id}`, {
        state: {
          message: isEdit
            ? 'धितो तमसुक सफलतापूर्वक अद्यावधिक भयो।'
            : 'नयाँ धितो तमसुक सुरक्षित भयो।',
        },
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
        title={isEdit ? 'धितो तमसुक सम्पादन' : 'नयाँ धितो तमसुक दर्ता'}
        subtitle="जग्गा धितो राखी ऋण लगानी गर्दा तयार गरिने आधिकारिक कानूनी तमसुक फारम"
      >
        <Link to="/loan/dhito-tamasuk" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
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
                    सदस्य नं. <span className="text-red-500">*</span>
                  </label>
                  {isEdit ? (
                    <input
                      type="text"
                      disabled
                      value={values.MemberNo}
                      className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                    />
                  ) : (
                    <div>
                      <input
                        type="text"
                        list="member-list"
                        placeholder="सदस्य नं. छान्नुहोस् वा लेख्नुहोस्..."
                        value={values.MemberNo}
                        onChange={(e) => handleMemberChange(e.target.value, setFieldValue)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <datalist id="member-list">
                        {members.map((m) => (
                          <option key={m.MemberNo} value={m.MemberNo}>
                            {m.FullName} ({m.MemberNo})
                          </option>
                        ))}
                      </datalist>
                    </div>
                  )}
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
                      className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                    />
                  ) : (
                    <select
                      value={values.LoanNo}
                      onChange={(e) =>
                        handleLoanChange(e.target.value, values.MemberNo, setFieldValue, values)
                      }
                      disabled={!values.MemberNo || loans.length === 0}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100"
                    >
                      <option value="">-- ऋण नं. छान्नुहोस् --</option>
                      {loans.map((l) => (
                        <option key={l.LoanNo} value={l.LoanNo}>
                          {l.LoanNo} - {l.LoanType || l.LoanPurpose || 'ऋण'} (रु.{' '}
                          {l.LoanAmount || '०'})
                        </option>
                      ))}
                    </select>
                  )}
                  {loans.length === 0 && values.MemberNo && !isEdit && (
                    <p className="mt-1 text-xs text-amber-600">
                      यस सदस्यको ऋण विवरण भेटिएन वा उपलब्ध छैन।
                    </p>
                  )}
                </div>

                {/* Entry Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    तमसुक दर्ता मिति
                  </label>
                  <NepaliCalendar
                    value={values.EntryDate}
                    onChange={(date) => setFieldValue('EntryDate', date)}
                    placeholder="YYYY/MM/DD"
                    width={180}
                  />
                </div>
              </div>
            </div>

            {/* 2. सहकारी ऐन तथा दर्ता सम्बन्धी विवरण */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="size-5 text-amber-600" /> २. सहकारी ऐन तथा दर्ता कार्यालय विवरण
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    सहकारी ऐन (वर्ष)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.SahakariAin}
                    onChange={(e) => setFieldValue('SahakariAin', getVal(e))}
                    placeholder="२०४८ वा २०७४"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">उदाहरण: २०४८ वा २०७४</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    जिल्ला सहकारी कार्यालय रहेको जिल्ला
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.JillaSahakariAddress}
                    onChange={(e) => setFieldValue('JillaSahakariAddress', getVal(e))}
                    placeholder="जस्तै: काठमाडौं, ललितपुर..."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. ऋणीको विवरण (Borrower Information) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2">
                <User className="size-5 text-emerald-600" /> ३. ऋणी (सदस्य) को व्यक्तिगत विवरण
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ऋणीको पूरा नाम
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerName}
                    onChange={(e) => setFieldValue('BorrowerName', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    हजुरबुबाको नाम (Grandfather)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerGrandfatherName}
                    onChange={(e) => setFieldValue('BorrowerGrandfatherName', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    बुबाको नाम (Father)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerFatherName}
                    onChange={(e) => setFieldValue('BorrowerFatherName', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Permanent Address */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    स्थायी प्रदेश
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerProvince}
                    onChange={(e) => setFieldValue('BorrowerProvince', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    स्थायी जिल्ला
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerDistrict}
                    onChange={(e) => setFieldValue('BorrowerDistrict', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    स्थायी न.पा./गा.पा.
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerPalika}
                    onChange={(e) => setFieldValue('BorrowerPalika', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    स्थायी वडा नं. / उमेर
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="वडा"
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

                {/* Temporary Address */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    हालको प्रदेश (Temporary)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerTmpProvince}
                    onChange={(e) => setFieldValue('BorrowerTmpProvince', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    हालको जिल्ला
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerTmpDistrict}
                    onChange={(e) => setFieldValue('BorrowerTmpDistrict', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    हालको न.पा./गा.पा.
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerTmpPalika}
                    onChange={(e) => setFieldValue('BorrowerTmpPalika', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    हालको वडा नं.
                  </label>
                  <input
                    type="text"
                    placeholder="वडा"
                    value={values.BorrowerTmpWard}
                    onChange={(e) => setFieldValue('BorrowerTmpWard', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Citizenship */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    नागरिकता प्रमाणपत्र नं.
                  </label>
                  <input
                    type="text"
                    value={values.BorrowerCitizenshipNo}
                    onChange={(e) => setFieldValue('BorrowerCitizenshipNo', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    नागरिकता जारी मिति
                  </label>
                  <NepaliCalendar
                    value={values.BorrowerCitizenshipDate}
                    onChange={(date) => setFieldValue('BorrowerCitizenshipDate', date)}
                    placeholder="YYYY/MM/DD"
                    width={180}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    नागरिकता जारी जिल्ला
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.BorrowerCitizenshipDistrict}
                    onChange={(e) => setFieldValue('BorrowerCitizenshipDistrict', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. ऋण सम्बन्धी विवरण (Loan Details) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2">
                <DollarSign className="size-5 text-blue-600" /> ४. ऋण सम्बन्धी शर्त तथा विवरण
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ऋण प्रयोजन (Loan Purpose)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.LoanPurpose}
                    onChange={(e) => setFieldValue('LoanPurpose', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ऋण निवेदन मिति (Application Date)
                  </label>
                  <NepaliCalendar
                    value={values.LoanApplicationDate}
                    onChange={(date) => setFieldValue('LoanApplicationDate', date)}
                    placeholder="YYYY/MM/DD"
                    width={180}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ऋण रकम रु. (Loan Amount)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.LoanAmount}
                    onChange={(e) => {
                      const val = getVal(e);
                      setFieldValue('LoanAmount', val);
                      if (val) {
                        setFieldValue('LoanAmountWords', convertToNepaliWords(val));
                      }
                    }}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    अक्षरेपी (In Words)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.LoanAmountWords}
                    onChange={(e) => setFieldValue('LoanAmountWords', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    वार्षिक ब्याजदर (%)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.RateOfInterest}
                    onChange={(e) => setFieldValue('RateOfInterest', getVal(e))}
                    placeholder="जस्तै: १४.५"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ऋण अवधि (वर्ष)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.LoanPeriodYear}
                    onChange={(e) => setFieldValue('LoanPeriodYear', getVal(e))}
                    placeholder="वर्ष"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ऋण अवधि (महिना)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.LoanPeriodMonth}
                    onChange={(e) => setFieldValue('LoanPeriodMonth', getVal(e))}
                    placeholder="महिना"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    किस्ता संख्या (Kista)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.LoanKista}
                    onChange={(e) => setFieldValue('LoanKista', getVal(e))}
                    placeholder="किस्ता संख्या"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. तपसिल: जग्गा धितोको विवरण (Mortgage Details) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="size-5 text-indigo-600" /> ५. तपसिल: जग्गा धितोको विवरण (Mortgage Details)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const currentItems = Array.isArray(values.DhitoItems) ? values.DhitoItems : [];
                    setFieldValue('DhitoItems', [
                      ...currentItems,
                      {
                        DhitoPerson: values.DhitoPerson || '',
                        DhitoDistrict: values.DhitoDistrict || '',
                        DhitoVDCMUN: values.DhitoVDCMUN || '',
                        DhitoWardNo: values.DhitoWardNo || '',
                        DhitoKittaNo: '',
                        DhitoArea: '',
                        Remarks: '',
                      },
                    ]);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  <Plus className="size-3.5" /> थप जग्गा थप्नुहोस्
                </button>
              </div>

              {/* Primary Dhito Quick Inputs */}
              <div className="mb-4 rounded-lg bg-indigo-50/40 border border-indigo-100 p-4">
                <h4 className="text-xs font-semibold text-indigo-900 mb-3">
                  मुख्य जग्गा धितो विवरण (Primary Parcel)
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      जग्गाधनीको नामथर
                    </label>
                    <NepaliInput
                      type="text"
                      value={values.DhitoPerson}
                      onChange={(e) => setFieldValue('DhitoPerson', getVal(e))}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">जिल्ला</label>
                    <NepaliInput
                      type="text"
                      value={values.DhitoDistrict}
                      onChange={(e) => setFieldValue('DhitoDistrict', getVal(e))}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      न.पा./गा.पा.
                    </label>
                    <NepaliInput
                      type="text"
                      value={values.DhitoVDCMUN}
                      onChange={(e) => setFieldValue('DhitoVDCMUN', getVal(e))}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">वडा नं.</label>
                    <input
                      type="text"
                      value={values.DhitoWardNo}
                      onChange={(e) => setFieldValue('DhitoWardNo', e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      कित्ता नं.
                    </label>
                    <NepaliInput
                      type="text"
                      value={values.DhitoKittaNo}
                      onChange={(e) => setFieldValue('DhitoKittaNo', getVal(e))}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      क्षेत्रफल
                    </label>
                    <NepaliInput
                      type="text"
                      value={values.DhitoArea}
                      onChange={(e) => setFieldValue('DhitoArea', getVal(e))}
                      placeholder="जस्तै: ०-४-२-०"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      कैफियत (Remarks)
                    </label>
                    <NepaliInput
                      type="text"
                      value={values.DhitoRemarks}
                      onChange={(e) => setFieldValue('DhitoRemarks', getVal(e))}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Multiple Dhito Table (from database or dynamic rows) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 border-r">जग्गाधनीको नामथर</th>
                      <th className="px-3 py-2 border-r">जिल्ला</th>
                      <th className="px-3 py-2 border-r">न.पा./गा.पा.</th>
                      <th className="px-3 py-2 border-r">वडा नं.</th>
                      <th className="px-3 py-2 border-r">कित्ता नं.</th>
                      <th className="px-3 py-2 border-r">क्षेत्रफल</th>
                      <th className="px-3 py-2 border-r">कैफियत</th>
                      <th className="px-3 py-2 text-center">हटाउने</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.isArray(values.DhitoItems) && values.DhitoItems.length > 0 ? (
                      values.DhitoItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-1 border-r">
                            <NepaliInput
                              type="text"
                              value={item.DhitoPerson || ''}
                              onChange={(e) =>
                                setFieldValue(`DhitoItems.${idx}.DhitoPerson`, getVal(e))
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <NepaliInput
                              type="text"
                              value={item.DhitoDistrict || ''}
                              onChange={(e) =>
                                setFieldValue(`DhitoItems.${idx}.DhitoDistrict`, getVal(e))
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <NepaliInput
                              type="text"
                              value={item.DhitoVDCMUN || ''}
                              onChange={(e) =>
                                setFieldValue(`DhitoItems.${idx}.DhitoVDCMUN`, getVal(e))
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <input
                              type="text"
                              value={item.DhitoWardNo || ''}
                              onChange={(e) =>
                                setFieldValue(`DhitoItems.${idx}.DhitoWardNo`, e.target.value)
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <NepaliInput
                              type="text"
                              value={item.DhitoKittaNo || ''}
                              onChange={(e) =>
                                setFieldValue(`DhitoItems.${idx}.DhitoKittaNo`, getVal(e))
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-semibold"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <NepaliInput
                              type="text"
                              value={item.DhitoArea || ''}
                              onChange={(e) =>
                                setFieldValue(`DhitoItems.${idx}.DhitoArea`, getVal(e))
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <NepaliInput
                              type="text"
                              value={item.Remarks || ''}
                              onChange={(e) =>
                                setFieldValue(`DhitoItems.${idx}.Remarks`, getVal(e))
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = values.DhitoItems.filter((_, i) => i !== idx);
                                setFieldValue('DhitoItems', updated);
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="हटाउनुहोस्"
                            >
                              <Trash2 className="size-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400">
                          {values.DhitoKittaNo
                            ? 'माथिको मुख्य जग्गा धितो विवरण प्रयोग गरिनेछ वा "थप जग्गा थप्नुहोस्" बटन क्लिक गरी थप विवरण भर्नुहोस्।'
                            : 'यस ऋणमा कुनै धितो जग्गा रेकर्ड फेला परेन। माथिबाट वा तलबाट प्रविष्टि गर्नुहोस्।'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. साक्षीहरूको विवरण (Witnesses) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2">
                <Users className="size-5 text-purple-600" /> ६. साक्षीहरूको विवरण (Witnesses)
              </h3>
              <div className="space-y-4">
                {/* Sakshi 1 */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-3">
                    १. पहिलो साक्षी (Witness 1)
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        साक्षीको नाम
                      </label>
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
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        न.पा./गा.पा.
                      </label>
                      <NepaliInput
                        type="text"
                        value={values.SakshiPalika1}
                        onChange={(e) => setFieldValue('SakshiPalika1', getVal(e))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        वडा नं.
                      </label>
                      <input
                        type="text"
                        value={values.SakshiWardNo1}
                        onChange={(e) => setFieldValue('SakshiWardNo1', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        सदस्य नं. (यदि भए)
                      </label>
                      <input
                        type="text"
                        value={values.SakshiMemberNo1}
                        onChange={(e) => setFieldValue('SakshiMemberNo1', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Sakshi 2 */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-3">
                    २. दोस्रो साक्षी (Witness 2)
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        साक्षीको नाम
                      </label>
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
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        न.पा./गा.पा.
                      </label>
                      <NepaliInput
                        type="text"
                        value={values.SakshiPalika2}
                        onChange={(e) => setFieldValue('SakshiPalika2', getVal(e))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        वडा नं.
                      </label>
                      <input
                        type="text"
                        value={values.SakshiWardNo2}
                        onChange={(e) => setFieldValue('SakshiWardNo2', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        सदस्य नं. (यदि भए)
                      </label>
                      <input
                        type="text"
                        value={values.SakshiMemberNo2}
                        onChange={(e) => setFieldValue('SakshiMemberNo2', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. कानूनी मिति तथा कर्मचारी विवरण */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="size-5 text-brand-600" /> ७. कानूनी मिति (ईति सम्वत्) र कर्मचारी विवरण
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ईति सम्वत् साल
                  </label>
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    रोज (०१ = आइत, ..., ०७ = शनि)
                  </label>
                  <input
                    type="text"
                    value={values.LegalDayOfWeek}
                    onChange={(e) => setFieldValue('LegalDayOfWeek', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    तयार गर्ने (ऋण विभाग प्रमुख)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.LoanBhibhagPramukh}
                    onChange={(e) => setFieldValue('LoanBhibhagPramukh', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    रुजु गर्ने (व्यवस्थापक)
                  </label>
                  <NepaliInput
                    type="text"
                    value={values.Byabasthapak}
                    onChange={(e) => setFieldValue('Byabasthapak', getVal(e))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    कैफियत (Remarks)
                  </label>
                  <input
                    type="text"
                    value={values.Remarks}
                    onChange={(e) => setFieldValue('Remarks', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 8. Live Preview of Deed */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800 flex items-center justify-between border-b pb-2">
                <span>लाइभ धितो तमसुक ड्राफ्ट (Live Deed Preview)</span>
                <span className="text-xs font-normal text-slate-400">
                  फारममा भरिएका विवरणहरू स्वतः देखिन्छन्
                </span>
              </h3>

              <div className="border border-slate-300 bg-amber-50/20 p-6 rounded-lg text-sm text-slate-800 leading-relaxed space-y-4">
                <div className="text-center font-bold text-base text-slate-900 border-b pb-2">
                  धितो तमसुक
                </div>

                {/* Top Office Sanction & Endorsement Memo Block (कार्यालय लगानी टिप्पणी खण्ड) */}
                <div className="border border-slate-300 rounded-lg p-3 bg-white text-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {/* Left Thumbprints Box */}
                    <div className="flex flex-col items-center justify-center p-2 border-b sm:border-b-0 sm:border-r border-slate-300 pr-4 shrink-0 self-stretch sm:self-auto">
                      <div className="flex items-end">
                        <div className="flex items-end justify-center w-16 h-16 border border-slate-400 bg-slate-50 p-1">
                          <p className="text-xs text-slate-500 font-medium">दायाँ</p>
                        </div>
                        <div className="h-6 border-l border-slate-400 mx-1"></div>
                        <div className="flex items-end justify-center w-16 h-16 border border-slate-400 bg-slate-50 p-1">
                          <p className="text-xs text-slate-500 font-medium">बायाँ</p>
                        </div>
                      </div>
                      <p className="text-[11px] font-medium text-slate-600 mt-1">सहिछाप / ल्याप्चे</p>
                    </div>

                    {/* Right: Reg & Date + Memo Statement + Staff Signs */}
                    <div className="flex-1 w-full flex flex-col justify-between space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-xs">
                        <div>
                          दर्ता नं. :{' '}
                          <span className="font-bold text-slate-900">
                            {convertToNepaliNumber(
                              enterprise?.RegisterNo ||
                                enterprise?.registerno ||
                                enterprise?.panno ||
                                ''
                            )}
                          </span>
                        </div>
                        <div>
                          मिति :{' '}
                          <span className="font-bold font-mono text-slate-900">
                            {convertToNepaliNumber(values.EntryDate || '')}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-800 leading-relaxed text-justify">
                        <p>
                          श्री{' '}
                          <strong>
                            {enterprise?.CompanyName || enterprise?.companyname || 'सहकारी संस्था लि.'}
                          </strong>{' '}
                          को मुख्य कार्यलय संस्थाका शेयर सदस्य श्री{' '}
                          <strong>{values.BorrowerName || memberDetail?.FullName || '—'}</strong> ले
                          संस्थाका ऋण व्यवस्थापन कार्यबिधि तथा तत्सम्बन्धी कानुनी प्रकृया समेत
                          पढीबाची सुनाउदा चित्त बुझाई सहिछाप गरी ऋण लिएकोले आजकै मितिमा ने. रू.{' '}
                          <strong>{convertToNepaliNumber(values.LoanAmount) || '—'}</strong>{' '}
                          (अक्षरेपी रु. <strong>{values.LoanAmountWords || '—'}</strong>) मात्र लगानी
                          गरियो |
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-between gap-4 pt-2 border-t border-slate-200 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">तमसुक तयार गर्ने :</p>
                          <p className="text-slate-400">दस्तखत: ....................</p>
                          <p>
                            नाम : <strong>{values.LoanBhibhagPramukh || '—'}</strong>
                          </p>
                          <p className="text-slate-500 text-[11px]">पद : ऋण बिभाग प्रमुख</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">तमसुक प्रमाणित गर्ने :</p>
                          <p className="text-slate-400">दस्तखत: ....................</p>
                          <p>
                            नाम : <strong>{values.Byabasthapak || '—'}</strong>
                          </p>
                          <p className="text-slate-500 text-[11px]">पद : व्यवस्थापक</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-justify indent-6">
                  लिखितम धनीका नाम सहकारी ऐन <strong>{values.SahakariAin || '२०४८'}</strong> बमोजिम
                  जिल्ला सहकारी कार्यालय, <strong>{values.JillaSahakariAddress || 'काठमाडौं'}</strong>{' '}
                  जिल्लामा दर्ता भइ{' '}
                  <strong>
                    {enterprise?.Province || enterprise?.province || 'बागमती'}
                  </strong>{' '}
                  प्रदेश{' '}
                  <strong>
                    {enterprise?.District || enterprise?.district || 'काठमाडौं'}
                  </strong>{' '}
                  जिल्ला{' '}
                  <strong>
                    {enterprise?.VDCMUN || enterprise?.munvdc || 'काठमाण्डौ'}
                  </strong>{' '}
                  म.न.पा./उ.म.न.पा./न.पा./ग.पा. वडा नं.{' '}
                  <strong>
                    {convertToNepaliNumber(enterprise?.WardNo || enterprise?.wardno || '१०')}
                  </strong>{' '}
                  स्थित श्री{' '}
                  <strong>
                    {enterprise?.CompanyName || enterprise?.companyname || 'सहकारी संस्था लि.'}
                  </strong>{' '}
                  सो धन व्यहोर्ने ऋणीका नाम{' '}
                  <strong>{values.BorrowerGrandfatherName || '—'}</strong> को नाति/नातिनी/बुहारी{' '}
                  <strong>{values.BorrowerFatherName || '—'}</strong> को छोरा/छोरी/श्रीमती{' '}
                  <strong>{values.BorrowerProvince || '—'}</strong> प्रदेश{' '}
                  <strong>{values.BorrowerDistrict || '—'}</strong> जिल्ला{' '}
                  <strong>{values.BorrowerPalika || '—'}</strong> न.पा/गा.पा वडा नं.{' '}
                  <strong>{convertToNepaliNumber(values.BorrowerWard) || '—'}</strong> को हाल{' '}
                  <strong>{values.BorrowerTmpProvince || '—'}</strong> प्रदेश{' '}
                  <strong>{values.BorrowerTmpDistrict || '—'}</strong> जिल्ला{' '}
                  <strong>{values.BorrowerTmpPalika || '—'}</strong> न.पा/गा.पा वडा नं.{' '}
                  <strong>{convertToNepaliNumber(values.BorrowerTmpWard) || '—'}</strong> बस्ने
                  नागरिकता प्रमाणपत्र नं.{' '}
                  <strong>{values.BorrowerCitizenshipNo || '—'}</strong> (जारी मिति{' '}
                  <strong>{convertToNepaliNumber(values.BorrowerCitizenshipDate) || '—'}</strong>{' '}
                  जारी जिल्ला{' '}
                  <strong>{values.BorrowerCitizenshipDistrict || '—'}</strong>) वर्ष{' '}
                  <strong>{convertToNepaliNumber(values.BorrowerAge) || '—'}</strong> का धनी
                  संस्थाको सदस्य नं.{' '}
                  <strong>{convertToNepaliNumber(values.MemberNo) || '—'}</strong> का सदस्य
                  श्री/श्रीमती/सुश्री <strong>{values.BorrowerName || '—'}</strong> ले जग्गा धितो
                  जमानत अन्तर्गत <strong>{values.LoanPurpose || 'ऋण'}</strong> कार्य गर्नका लागि
                  मिति{' '}
                  <strong>{convertToNepaliNumber(values.LoanApplicationDate) || '—'}</strong> मा
                  पेश गरेको ऋण निवेदनमा उल्लेखित शर्तहरु र तपसिल बमोजिमका धनजमानी राखी संस्थाको
                  स्वीकृत ऋण व्यवस्थापन कार्यविधि तथा निर्देशन समेतलाई पालना गर्ने गरी आजका मितिमा
                  रु. <strong>{convertToNepaliNumber(values.LoanAmount) || '—'}</strong> (अक्षरेपी
                  रु. <strong>{values.LoanAmountWords || '—'}</strong> मात्र |) ऋण लिएको ठिक साँचो
                  हो |
                </p>

                <p className="text-justify indent-6">
                  उक्त ऋण रकम र सो मा बार्षिक{' '}
                  <strong>{convertToNepaliNumber(values.RateOfInterest) || '—'}</strong> प्रतिशतका
                  दरले ब्याज समेत राखी{' '}
                  <strong>{convertToNepaliNumber(values.LoanPeriodYear) || '०'}</strong> वर्ष{' '}
                  <strong>{convertToNepaliNumber(values.LoanPeriodMonth) || '०'}</strong> महिना
                  भित्र <strong>{convertToNepaliNumber(values.LoanKista) || '—'}</strong> किस्तामा
                  सम्पूर्ण साँवा तथा मासिक रुपमा ब्याज धनि संस्थामा तिर्ने बुझाउने छु| जुन कार्यका
                  लागि ऋण लिएको हो, सो कार्यमा नलगाएमा एवम् भाखा भित्र साँवा तथा ब्याज बुझाउन
                  नल्याएमा धनी संस्थाको नियमानुसार लाग्ने हर्जाना/बिलम्ब शुल्क समेत बुझाउन मंजुर
                  छु/छौं |
                </p>

                <p className="text-justify indent-6">
                  कथकदाचित मैले बुझाउन पर्ने साँवा तथा ब्याज र हर्जाना समेत नबुझाएमा मेरो यस सहकारी
                  संस्थामा जम्मा भएको बचत रकमबाट र तपसिल बमोजिम व्यक्तिहरुको जमानी राखेको रकमबाट
                  अशुल उपर गरिलिनु र उक्त रकमबाट पनि पुरा असुल हुन नसकेमा मेरा एकाघरका सगोलको
                  परिवारको नाममा रहेको चलअचल श्रीसम्पतिबाट प्रचलित कानुन बमोजिम असुलउपर गरिलिनु
                  भएमा कुनै प्रकारको उजुरबाजुर गर्ने छैन भनि राजीखुसि तथा मंजुरीले किनाराका
                  साक्षीहरुको रोहबरमा धनी संस्थामा बसी यो तमसुकमा सहीछाप गरी धनी संस्थालाई दिएँ|
                </p>

                {/* Table preview */}
                <div className="pt-2">
                  <div className="text-center font-bold text-xs uppercase mb-1">
                    तपसिल: जग्गा धितोको विवरण
                  </div>
                  <table className="w-full text-xs border border-slate-300 text-center">
                    <thead className="bg-slate-100 font-semibold border-b">
                      <tr>
                        <th className="border-r p-1">जग्गाधनीको नामथर</th>
                        <th className="border-r p-1">जिल्ला</th>
                        <th className="border-r p-1">न.पा/गा.पा</th>
                        <th className="border-r p-1">वडा नं.</th>
                        <th className="border-r p-1">कित्ता नं.</th>
                        <th className="border-r p-1">क्षेत्रफल</th>
                        <th className="p-1">कैफियत</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(values.DhitoItems) && values.DhitoItems.length > 0 ? (
                        values.DhitoItems.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="border-r p-1 font-semibold">{item.DhitoPerson || '—'}</td>
                            <td className="border-r p-1">{item.DhitoDistrict || '—'}</td>
                            <td className="border-r p-1">{item.DhitoVDCMUN || '—'}</td>
                            <td className="border-r p-1">
                              {convertToNepaliNumber(item.DhitoWardNo) || '—'}
                            </td>
                            <td className="border-r p-1 font-semibold">
                              {convertToNepaliNumber(item.DhitoKittaNo) || '—'}
                            </td>
                            <td className="border-r p-1">{item.DhitoArea || '—'}</td>
                            <td className="p-1">{item.Remarks || '—'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="border-r p-1 font-semibold">{values.DhitoPerson || '—'}</td>
                          <td className="border-r p-1">{values.DhitoDistrict || '—'}</td>
                          <td className="border-r p-1">{values.DhitoVDCMUN || '—'}</td>
                          <td className="border-r p-1">
                            {convertToNepaliNumber(values.DhitoWardNo) || '—'}
                          </td>
                          <td className="border-r p-1 font-semibold">
                            {convertToNepaliNumber(values.DhitoKittaNo) || '—'}
                          </td>
                          <td className="border-r p-1">{values.DhitoArea || '—'}</td>
                          <td className="p-1">{values.DhitoRemarks || '—'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Legal date */}
                <div className="text-center font-semibold pt-4">
                  ईति सम्वत्{' '}
                  <strong>{convertToNepaliNumber(values.LegalYear) || '—'}</strong> साल{' '}
                  <strong>{values.LegalMonth || '—'}</strong> महिना{' '}
                  <strong>{convertToNepaliNumber(values.LegalDay) || '—'}</strong> गते रोज{' '}
                  <strong>{convertToNepaliNumber(values.LegalDayOfWeek) || '—'}</strong> शुभम्
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link to="/loan/dhito-tamasuk" className="btn-secondary">
                रद्द गर्नुहोस्
              </Link>
              <button
                type="submit"
                disabled={submitting || formikSubmitting}
                className="btn-primary inline-flex items-center gap-2"
              >
                {submitting || formikSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> सुरक्षित हुँदैछ...
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> {isEdit ? 'अद्यावधिक गर्नुहोस्' : 'धितो तमसुक सुरक्षित गर्नुहोस्'}
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
