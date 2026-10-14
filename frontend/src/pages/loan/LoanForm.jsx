import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Formik, Form, FieldArray, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Loader2, Plus, Trash2, Search, CheckCircle2 } from 'lucide-react';
import { NepaliInput } from '@itzsa/nepali-input';
import PageHeader from '../../components/PageHeader';
import FormField, { StepTitle, bindField } from '../../components/FormField';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { loansApi } from '../../api/loans';
import { membersApi, addressApi } from '../../api/members';
import { errorMessage } from '../../api/axios';
import { selectCan } from '../../store/authSlice';
import api from '../../api/axios';

// ── Shared class for NepaliInput & Selects ──────────────────────────────────
const NI = '!text-[14px] h-10';

// ── Helper to keep saved value even if not yet in option list ────────────────
const withValue = (items, value, getName = (x) => x, make = (x) => x) =>
  value && !items.some((i) => getName(i) === value) ? [make(value), ...items] : items;

// ── Address dropdowns hook ───────────────────────────────────────────────────
function useAddressOptions(province, district) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  useEffect(() => {
    addressApi.provinces().then(setProvinces).catch((e) => console.error('Error getting provinces:', e));
  }, []);

  useEffect(() => {
    if (!province) { setDistricts([]); return; }
    let alive = true;
    addressApi.districts(province).then((d) => alive && setDistricts(d)).catch((e) => console.error(e));
    return () => { alive = false; };
  }, [province]);

  useEffect(() => {
    if (!district) { setMunicipalities([]); return; }
    let alive = true;
    addressApi.municipalities(province, district).then((m) => alive && setMunicipalities(m)).catch((e) => console.error(e));
    return () => { alive = false; };
  }, [province, district]);

  return { provinces, districts, municipalities };
}

// ── Scroll to first invalid field ────────────────────────────────────────────
function ScrollToError() {
  const { submitCount, isSubmitting, errors } = useFormikContext();
  useEffect(() => {
    if (submitCount > 0 && !isSubmitting && Object.keys(errors).length) {
      const el = document.querySelector('[aria-invalid="true"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus?.({ preventScroll: true });
    }
  }, [isSubmitting]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ── Validation ────────────────────────────────────────────────────────────────
const schema = Yup.object().shape({
  MemberNo: Yup.string().trim().required('सदस्य नं. आवश्यक छ'),
  MemberName: Yup.string().trim().required('सदस्यको नाम आवश्यक छ'),
  LoanType: Yup.string().trim().required('ऋणको प्रकार आवश्यक छ'),
  LoanAmount: Yup.string().trim().required('ऋण रकम आवश्यक छ'),
  LoanPurpose: Yup.string().trim().required('ऋणको उद्देश्य आवश्यक छ'),
  EntryDate: Yup.string().trim().required('मिति आवश्यक छ'),
});

// ── Blank templates ───────────────────────────────────────────────────────────
const blankDhito = () => ({
  DhitoPerson: '', DhitoFather: '', DhitoSpouse: '',
  DhitoType: '', DhitoProvince: '', DhitoDistrict: '', DhitoVDCMUN: '',
  DhitoWardNo: '', DhitoBlockNo: '', DhitoKittaNo: '', DhitoArea: '', Remarks: '',
});

const blankSakshi = () => ({
  SakshiPerson: '', SakshiProvince: '', SakshiDistrict: '',
  SakshiVDCMUN: '', SakshiWardNo: '', SakshiAge: '',
});

const blankValues = () => ({
  MemberNo: '', MemberName: '',
  BusinessPAN: '', HasBusiness: false, BusinessName: '', IncomeSource: '', IncomeSourceRs: '',
  LoanType: '', LoanPurpose: '', LoanAmount: '',
  HasRateOfInterest: false, RateOfInterest: '',
  LoanPeriodYear: '', LoanPeriodMonth: '', LoanKista: '',
  HasDepositJamani: false,
  JamaniMemberNo: '', JamaniName: '', JamaniGrandFatherName: '', JamaniFatherName: '',
  JamaniSpouseName: '', JamaniProvince: '', JamaniDistrict: '', JamaniVDCMUN: '',
  JamaniWardNo: '', JamaniDOB: '', JamaniType: '', JamaniTypeRs: '',
  HasDhitoJamani: false,
  HasSakshi: false,
  EntryDate: '',
  dhitoItems: [],
  sakshiItems: [],
});

function toFormValues(loan) {
  return {
    MemberNo: loan.MemberNo || '',
    MemberName: loan.MemberName || '',
    BusinessPAN: loan.BusinessPAN || '',
    HasBusiness: !!loan.HasBusiness,
    BusinessName: loan.BusinessName || '',
    IncomeSource: loan.IncomeSource || '',
    IncomeSourceRs: loan.IncomeSourceRs || '',
    LoanType: loan.LoanType || '',
    LoanPurpose: loan.LoanPurpose || '',
    LoanAmount: loan.LoanAmount || '',
    HasRateOfInterest: !!loan.HasRateOfInterest,
    RateOfInterest: loan.RateOfInterest || '',
    LoanPeriodYear: loan.LoanPeriodYear || '',
    LoanPeriodMonth: loan.LoanPeriodMonth || '',
    LoanKista: loan.LoanKista || '',
    HasDepositJamani: !!loan.HasDepositJamani,
    JamaniMemberNo: loan.JamaniMemberNo || '',
    JamaniName: loan.JamaniName || '',
    JamaniGrandFatherName: loan.JamaniGrandFatherName || '',
    JamaniFatherName: loan.JamaniFatherName || '',
    JamaniSpouseName: loan.JamaniSpouseName || '',
    JamaniProvince: loan.JamaniProvince || '',
    JamaniDistrict: loan.JamaniDistrict || '',
    JamaniVDCMUN: loan.JamaniVDCMUN || '',
    JamaniWardNo: loan.JamaniWardNo || '',
    JamaniDOB: loan.JamaniDOB || '',
    JamaniType: loan.JamaniType || '',
    JamaniTypeRs: loan.JamaniTypeRs || '',
    HasDhitoJamani: !!loan.HasDhitoJamani,
    HasSakshi: !!loan.HasSakshi,
    EntryDate: loan.EntryDate || '',
    dhitoItems: loan.dhitoItems || [],
    sakshiItems: loan.sakshiItems || [],
  };
}

// ── Member lookup hook ────────────────────────────────────────────────────────
function useMemberLookup(memberNo, onFound) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'found' | 'notfound'
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const no = (memberNo || '').trim();
    if (!no) { setStatus('idle'); return; }

    setStatus('loading');
    timerRef.current = setTimeout(async () => {
      try {
        const m = await membersApi.get(no);
        setStatus('found');
        onFound(m);
      } catch {
        setStatus('notfound');
      }
    }, 600);

    return () => clearTimeout(timerRef.current);
  }, [memberNo]); // eslint-disable-line react-hooks/exhaustive-deps

  return status;
}

// ── Checkbox ──────────────────────────────────────────────────────────────────
function Checkbox({ label, name, values, handleChange, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        checked={!!values[name]}
        onChange={handleChange}
        className="mt-0.5 h-4 w-4 rounded border-rule accent-ledger"
      />
      <span>
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

// ── Member lookup status indicator ───────────────────────────────────────────
function MemberStatus({ status }) {
  if (status === 'loading') return (
    <span className="flex items-center gap-1 text-xs text-slate-400">
      <Loader2 size={12} className="animate-spin" />खोज्दै…
    </span>
  );
  if (status === 'found') return (
    <span className="flex items-center gap-1 text-xs text-ledger-dark">
      <CheckCircle2 size={12} />सदस्य फेला पर्यो
    </span>
  );
  if (status === 'notfound') return (
    <span className="flex items-center gap-1 text-xs text-stamp">
      <Search size={12} />सदस्य फेला परेन
    </span>
  );
  return null;
}

// ── Section 1: Basic Info ─────────────────────────────────────────────────────
function BasicInfoSection({ values, errors, touched, handleChange, setFieldValue }) {
  const bind = bindField(touched, errors);
  const setDate = (name) => (date) => setFieldValue(name, date || '');

  const memberStatus = useMemberLookup(values.MemberNo, (m) => {
    setFieldValue('MemberName', m.FullName || m.FullNameEng || '');
  });

  return (
    <div className="panel p-6">
      <StepTitle>१. आधारभूत जानकारी</StepTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Member No with live lookup */}
        <FormField label="सदस्य नं." name="MemberNo" required touched={touched} errors={errors}>
          <div className="relative">
            <input
              {...bind('MemberNo')}
              placeholder="सदस्य नं."
              value={values.MemberNo}
              onChange={handleChange}
              className={`${bind('MemberNo').className} ${NI}`}
            />
            <div className="absolute right-2 top-2.5">
              <MemberStatus status={memberStatus} />
            </div>
          </div>
        </FormField>

        {/* Member Name — auto-filled, editable */}
        <FormField label="सदस्यको नाम" name="MemberName" required touched={touched} errors={errors}>
          <NepaliInput
            {...bind('MemberName')}
            mode="unicode"
            placeholder="सदस्यको नाम"
            value={values.MemberName}
            onChange={handleChange}
            className={`${bind('MemberName').className} ${NI}`}
          />
        </FormField>

        <FormField label="ऋणको प्रकार" name="LoanType" required touched={touched} errors={errors}>
          <NepaliInput
            {...bind('LoanType')}
            mode="unicode"
            placeholder="ऋणको प्रकार"
            value={values.LoanType}
            onChange={handleChange}
            className={`${bind('LoanType').className} ${NI}`}
          />
        </FormField>

        <FormField label="ऋण रकम (रू)" name="LoanAmount" required touched={touched} errors={errors}>
          <NepaliInput
            {...bind('LoanAmount')}
            mode="unicode"
            placeholder="ऋण रकम"
            value={values.LoanAmount}
            onChange={handleChange}
            className={`${bind('LoanAmount').className} ${NI}`}
          />
        </FormField>

        <FormField label="ऋणको उद्देश्य" name="LoanPurpose" required touched={touched} errors={errors}>
          <NepaliInput
            {...bind('LoanPurpose')}
            mode="unicode"
            placeholder="ऋणको उद्देश्य"
            value={values.LoanPurpose}
            onChange={handleChange}
            className={`${bind('LoanPurpose').className} ${NI}`}
          />
        </FormField>

        <FormField label="दर्ता मिति" name="EntryDate" required touched={touched} errors={errors}>
          <NepaliCalendar
            name="EntryDate"
            value={values.EntryDate}
            onChange={setDate('EntryDate')}
            placeholder="YYYY/MM/DD"
            width="100%"
          />
        </FormField>

        <FormField label="आयको स्रोत" name="IncomeSource" touched={touched} errors={errors}>
          <NepaliInput {...bind('IncomeSource')} mode="unicode" placeholder="आयको स्रोत" value={values.IncomeSource} onChange={handleChange} className={`${bind('IncomeSource').className} ${NI}`} />
        </FormField>

        <FormField label="आय (रू)" name="IncomeSourceRs" touched={touched} errors={errors}>
          <NepaliInput {...bind('IncomeSourceRs')} mode="unicode" placeholder="आय रकम" value={values.IncomeSourceRs} onChange={handleChange} className={`${bind('IncomeSourceRs').className} ${NI}`} />
        </FormField>
      </div>

      {/* Business toggle */}
      <div className="mt-4 space-y-3">
        <Checkbox label="व्यवसाय छ?" name="HasBusiness" values={values} handleChange={handleChange} />
        {values.HasBusiness && (
          <div className="ml-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="व्यवसाय PAN" name="BusinessPAN" touched={touched} errors={errors}>
              <NepaliInput {...bind('BusinessPAN')} mode="unicode" placeholder="PAN" value={values.BusinessPAN} onChange={handleChange} className={`${bind('BusinessPAN').className} ${NI}`} />
            </FormField>
            <FormField label="व्यवसायको नाम" name="BusinessName" touched={touched} errors={errors}>
              <NepaliInput {...bind('BusinessName')} mode="unicode" placeholder="व्यवसायको नाम" value={values.BusinessName} onChange={handleChange} className={`${bind('BusinessName').className} ${NI}`} />
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section 2: Loan Terms ─────────────────────────────────────────────────────
function LoanTermsSection({ values, errors, touched, handleChange, setFieldValue }) {
  const bind = bindField(touched, errors);
  return (
    <div className="panel p-6">
      <StepTitle>२. ऋणको शर्तहरू</StepTitle>
      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-4">
          <FormField label="ऋण अवधि (वर्ष)" name="LoanPeriodYear" touched={touched} errors={errors}>
            <NepaliInput {...bind('LoanPeriodYear')} mode="unicode" placeholder="वर्ष" value={values.LoanPeriodYear} onChange={handleChange} className={`${bind('LoanPeriodYear').className} ${NI}`} />
          </FormField>
          <FormField label="ऋण अवधि (महिना)" name="LoanPeriodMonth" touched={touched} errors={errors}>
            <NepaliInput {...bind('LoanPeriodMonth')} mode="unicode" placeholder="महिना" value={values.LoanPeriodMonth} onChange={handleChange} className={`${bind('LoanPeriodMonth').className} ${NI}`} />
          </FormField>
          <FormField label="किस्ता" name="LoanKista" touched={touched} errors={errors}>
            <NepaliInput {...bind('LoanKista')} mode="unicode" placeholder="किस्ता" value={values.LoanKista} onChange={handleChange} className={`${bind('LoanKista').className} ${NI}`} />
          </FormField>
        </div>
        <Checkbox label="ब्याजदर छ?" name="HasRateOfInterest" values={values} handleChange={handleChange} />
        {values.HasRateOfInterest && (
          <div className="ml-7 grid gap-4 sm:grid-cols-4">
            <FormField label="ब्याजदर (%)" name="RateOfInterest" touched={touched} errors={errors} className="max-w-xs">
              <NepaliInput {...bind('RateOfInterest')} mode="unicode" placeholder="ब्याजदर" value={values.RateOfInterest} onChange={handleChange} className={`${bind('RateOfInterest').className} ${NI}`} />
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section 3: Deposit Jamani ─────────────────────────────────────────────────
function DepositJamaniSection({ values, errors, touched, handleChange, setFieldValue }) {
  const bind = bindField(touched, errors);
  const setDate = (name) => (date) => setFieldValue(name, date || '');

  // Address options for Jamani
  const {
    provinces: jamaniProvinces,
    districts: jamaniDistricts,
    municipalities: jamaniMunicipalities
  } = useAddressOptions(values.JamaniProvince, values.JamaniDistrict);

  // When JamaniMemberNo changes, look up that member and auto-fill jamani fields
  const jamaniStatus = useMemberLookup(values.JamaniMemberNo, (m) => {
    setFieldValue('JamaniName', m.FullName || '');
    setFieldValue('JamaniGrandFatherName', m.GrandfatherName || '');
    setFieldValue('JamaniFatherName', m.FatherName || '');
    setFieldValue('JamaniSpouseName', m.SpouseName || '');
    setFieldValue('JamaniProvince', m.Province || '');
    setFieldValue('JamaniDistrict', m.District || '');
    setFieldValue('JamaniVDCMUN', m.MUNVDC || '');
    setFieldValue('JamaniWardNo', m.WardNo || '');
    setFieldValue('JamaniDOB', m.DOB || '');
  });

  return (
    <div className="panel p-6">
      <StepTitle>३. निक्षेप जमानी विवरण</StepTitle>
      <div className="space-y-3">
        <Checkbox label="निक्षेप जमानी छ?" name="HasDepositJamani" values={values} handleChange={handleChange} />
        {values.HasDepositJamani && (
          <div className="ml-7 space-y-4">
            {/* Jamani member lookup */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="जमानकर्ता सदस्य नं." name="JamaniMemberNo" touched={touched} errors={errors}>
                <div className="relative">
                  <input
                    {...bind('JamaniMemberNo')}
                    placeholder="सदस्य नं."
                    value={values.JamaniMemberNo}
                    onChange={handleChange}
                    className={`${bind('JamaniMemberNo').className} ${NI}`}
                  />
                  <div className="absolute right-2 top-2.5">
                    <MemberStatus status={jamaniStatus} />
                  </div>
                </div>
              </FormField>

              <FormField label="जमानकर्ताको नाम" name="JamaniName" touched={touched} errors={errors}>
                <NepaliInput {...bind('JamaniName')} mode="unicode" placeholder="जमानकर्ताको नाम" value={values.JamaniName} onChange={handleChange} className={`${bind('JamaniName').className} ${NI}`} />
              </FormField>

              <FormField label="बाजेको नाम" name="JamaniGrandFatherName" touched={touched} errors={errors}>
                <NepaliInput {...bind('JamaniGrandFatherName')} mode="unicode" placeholder="बाजेको नाम" value={values.JamaniGrandFatherName} onChange={handleChange} className={`${bind('JamaniGrandFatherName').className} ${NI}`} />
              </FormField>

              <FormField label="बुबाको नाम" name="JamaniFatherName" touched={touched} errors={errors}>
                <NepaliInput {...bind('JamaniFatherName')} mode="unicode" placeholder="बुबाको नाम" value={values.JamaniFatherName} onChange={handleChange} className={`${bind('JamaniFatherName').className} ${NI}`} />
              </FormField>

            </div>

            {/* Personal Info */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <FormField label="पति/पत्नीको नाम" name="JamaniSpouseName" touched={touched} errors={errors}>
                <NepaliInput {...bind('JamaniSpouseName')} mode="unicode" placeholder="पति/पत्नीको नाम" value={values.JamaniSpouseName} onChange={handleChange} className={`${bind('JamaniSpouseName').className} ${NI}`} />
              </FormField>

              <FormField label="जन्म मिति" name="JamaniDOB" touched={touched} errors={errors}>
                <NepaliCalendar
                  name="JamaniDOB"
                  value={values.JamaniDOB}
                  onChange={setDate('JamaniDOB')}
                  placeholder="YYYY/MM/DD"
                  width="100%"
                />
              </FormField>

              <FormField label="प्रदेश" name="JamaniProvince" touched={touched} errors={errors}>
                <select
                  {...bind('JamaniProvince')}
                  value={values.JamaniProvince}
                  onChange={(e) => {
                    handleChange(e);
                    setFieldValue('JamaniDistrict', '', false);
                    setFieldValue('JamaniVDCMUN', '', false);
                  }}
                  className={`${bind('JamaniProvince').className} ${NI}`}
                >
                  <option value="">-- छान्नुहोस् --</option>
                  {withValue(jamaniProvinces, values.JamaniProvince).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="जिल्ला" name="JamaniDistrict" touched={touched} errors={errors}>
                <select
                  {...bind('JamaniDistrict')}
                  value={values.JamaniDistrict}
                  disabled={!values.JamaniProvince}
                  onChange={(e) => {
                    handleChange(e);
                    setFieldValue('JamaniVDCMUN', '', false);
                  }}
                  className={`${bind('JamaniDistrict').className} ${NI}`}
                >
                  <option value="">-- छान्नुहोस् --</option>
                  {withValue(jamaniDistricts, values.JamaniDistrict).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="न.पा./गा.पा." name="JamaniVDCMUN" touched={touched} errors={errors}>
                <select
                  {...bind('JamaniVDCMUN')}
                  value={values.JamaniVDCMUN}
                  disabled={!values.JamaniDistrict}
                  onChange={handleChange}
                  className={`${bind('JamaniVDCMUN').className} ${NI}`}
                >
                  <option value="">-- छान्नुहोस् --</option>
                  {withValue(jamaniMunicipalities, values.JamaniVDCMUN, (m) => m.name, (name) => ({ name, type: '' })).map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.type ? `${m.name} (${m.type})` : m.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="वडा नं." name="JamaniWardNo" touched={touched} errors={errors}>
                <NepaliInput
                  {...bind('JamaniWardNo')}
                  mode="unicode"
                  placeholder="वडा नं."
                  value={values.JamaniWardNo}
                  onChange={handleChange}
                  className={`${bind('JamaniWardNo').className} ${NI}`}
                />
              </FormField>

              <FormField label="जमानीको प्रकार" name="JamaniType" touched={touched} errors={errors}>
                <NepaliInput {...bind('JamaniType')} mode="unicode" placeholder="जमानीको प्रकार" value={values.JamaniType} onChange={handleChange} className={`${bind('JamaniType').className} ${NI}`} />
              </FormField>

              <FormField label="जमानी रकम (रू)" name="JamaniTypeRs" touched={touched} errors={errors}>
                <NepaliInput {...bind('JamaniTypeRs')} mode="unicode" placeholder="जमानी रकम" value={values.JamaniTypeRs} onChange={handleChange} className={`${bind('JamaniTypeRs').className} ${NI}`} />
              </FormField>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dhito Item Row with Province/District/Municipality select ────────────────
function DhitoItemRow({ item, idx, handleChange, setFieldValue, remove }) {
  const { provinces, districts, municipalities } = useAddressOptions(item.DhitoProvince, item.DhitoDistrict);

  return (
    <div className="relative rounded-lg border border-rule bg-paper p-4">
      <button
        type="button"
        onClick={() => remove(idx)}
        className="absolute right-3 top-3 text-slate-400 hover:text-stamp"
        aria-label="Remove"
      >
        <Trash2 size={16} />
      </button>
      <p className="mb-3 text-sm font-semibold text-slate-600">धितो #{idx + 1}</p>

      {/* Basic fields */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">धितोको व्यक्ति</label>
          <NepaliInput
            id={`dhitoItems[${idx}].DhitoPerson`}
            name={`dhitoItems[${idx}].DhitoPerson`}
            mode="unicode"
            placeholder="धितोको व्यक्ति"
            value={item.DhitoPerson ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
        <div>
          <label className="label">बुबाको नाम</label>
          <NepaliInput
            id={`dhitoItems[${idx}].DhitoFather`}
            name={`dhitoItems[${idx}].DhitoFather`}
            mode="unicode"
            placeholder="बुबाको नाम"
            value={item.DhitoFather ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
        <div>
          <label className="label">पति/पत्नीको नाम</label>
          <NepaliInput
            id={`dhitoItems[${idx}].DhitoSpouse`}
            name={`dhitoItems[${idx}].DhitoSpouse`}
            mode="unicode"
            placeholder="पति/पत्नीको नाम"
            value={item.DhitoSpouse ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
        <div>
          <label className="label">धितोको प्रकार</label>
          <NepaliInput
            id={`dhitoItems[${idx}].DhitoType`}
            name={`dhitoItems[${idx}].DhitoType`}
            mode="unicode"
            placeholder="धितोको प्रकार"
            value={item.DhitoType ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
      </div>

      {/* Address Dropdowns */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">प्रदेश</label>
          <select
            name={`dhitoItems[${idx}].DhitoProvince`}
            value={item.DhitoProvince ?? ''}
            onChange={(e) => {
              handleChange(e);
              setFieldValue(`dhitoItems[${idx}].DhitoDistrict`, '', false);
              setFieldValue(`dhitoItems[${idx}].DhitoVDCMUN`, '', false);
            }}
            className={`field ${NI}`}
          >
            <option value="">-- छान्नुहोस् --</option>
            {withValue(provinces, item.DhitoProvince).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">जिल्ला</label>
          <select
            name={`dhitoItems[${idx}].DhitoDistrict`}
            value={item.DhitoDistrict ?? ''}
            disabled={!item.DhitoProvince}
            onChange={(e) => {
              handleChange(e);
              setFieldValue(`dhitoItems[${idx}].DhitoVDCMUN`, '', false);
            }}
            className={`field ${NI}`}
          >
            <option value="">-- छान्नुहोस् --</option>
            {withValue(districts, item.DhitoDistrict).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">न.पा./गा.पा.</label>
          <select
            name={`dhitoItems[${idx}].DhitoVDCMUN`}
            value={item.DhitoVDCMUN ?? ''}
            disabled={!item.DhitoDistrict}
            onChange={handleChange}
            className={`field ${NI}`}
          >
            <option value="">-- छान्नुहोस् --</option>
            {withValue(municipalities, item.DhitoVDCMUN, (m) => m.name, (name) => ({ name, type: '' })).map((m) => (
              <option key={m.name} value={m.name}>
                {m.type ? `${m.name} (${m.type})` : m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">वडा नं.</label>
          <NepaliInput
            id={`dhitoItems[${idx}].DhitoWardNo`}
            name={`dhitoItems[${idx}].DhitoWardNo`}
            mode="unicode"
            placeholder="वडा नं."
            value={item.DhitoWardNo ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
      </div>

      {/* Property / Land Details */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">ब्लक नं.</label>
          <NepaliInput
            id={`dhitoItems[${idx}].DhitoBlockNo`}
            name={`dhitoItems[${idx}].DhitoBlockNo`}
            mode="unicode"
            placeholder="ब्लक नं."
            value={item.DhitoBlockNo ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
        <div>
          <label className="label">किट्टा नं.</label>
          <NepaliInput
            id={`dhitoItems[${idx}].DhitoKittaNo`}
            name={`dhitoItems[${idx}].DhitoKittaNo`}
            mode="unicode"
            placeholder="किट्टा नं."
            value={item.DhitoKittaNo ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
        <div>
          <label className="label">क्षेत्रफल</label>
          <NepaliInput
            id={`dhitoItems[${idx}].DhitoArea`}
            name={`dhitoItems[${idx}].DhitoArea`}
            mode="unicode"
            placeholder="क्षेत्रफल"
            value={item.DhitoArea ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
        <div>
          <label className="label">कैफियत</label>
          <NepaliInput
            id={`dhitoItems[${idx}].Remarks`}
            name={`dhitoItems[${idx}].Remarks`}
            mode="unicode"
            placeholder="कैफियत"
            value={item.Remarks ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
      </div>
    </div>
  );
}

// ── Section 4: Dhito Jamani ───────────────────────────────────────────────────
function DhitoJamaniSection({ values, handleChange, setFieldValue }) {
  return (
    <div className="panel p-6">
      <StepTitle>४. धितो जमानी विवरण</StepTitle>
      <div className="space-y-4">
        <Checkbox label="धितो जमानी छ?" name="HasDhitoJamani" values={values} handleChange={handleChange} />
        {values.HasDhitoJamani && (
          <FieldArray name="dhitoItems">
            {({ push, remove }) => (
              <div className="ml-7 space-y-4">
                {values.dhitoItems.map((item, idx) => (
                  <DhitoItemRow
                    key={idx}
                    item={item}
                    idx={idx}
                    handleChange={handleChange}
                    setFieldValue={setFieldValue}
                    remove={remove}
                  />
                ))}
                <button type="button" onClick={() => push(blankDhito())} className="btn-secondary">
                  <Plus size={16} />धितो थप्नुहोस्
                </button>
              </div>
            )}
          </FieldArray>
        )}
      </div>
    </div>
  );
}

// ── Sakshi Item Row with Province/District/Municipality select ────────────────
function SakshiItemRow({ item, idx, handleChange, setFieldValue, remove }) {
  const { provinces, districts, municipalities } = useAddressOptions(item.SakshiProvince, item.SakshiDistrict);

  return (
    <div className="relative rounded-lg border border-rule bg-paper p-4">
      <button
        type="button"
        onClick={() => remove(idx)}
        className="absolute right-3 top-3 text-slate-400 hover:text-stamp"
        aria-label="Remove"
      >
        <Trash2 size={16} />
      </button>
      <p className="mb-3 text-sm font-semibold text-slate-600">साक्षी #{idx + 1}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label">साक्षीको नाम</label>
          <NepaliInput
            id={`sakshiItems[${idx}].SakshiPerson`}
            name={`sakshiItems[${idx}].SakshiPerson`}
            mode="unicode"
            placeholder="साक्षीको नाम"
            value={item.SakshiPerson ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
        <div>
          <label className="label">उमेर</label>
          <NepaliInput
            id={`sakshiItems[${idx}].SakshiAge`}
            name={`sakshiItems[${idx}].SakshiAge`}
            mode="unicode"
            placeholder="उमेर"
            value={item.SakshiAge ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
        <div>
          <label className="label">वडा नं.</label>
          <NepaliInput
            id={`sakshiItems[${idx}].SakshiWardNo`}
            name={`sakshiItems[${idx}].SakshiWardNo`}
            mode="unicode"
            placeholder="वडा नं."
            value={item.SakshiWardNo ?? ''}
            onChange={handleChange}
            className={`field ${NI}`}
          />
        </div>
      </div>

      {/* Address Dropdowns */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">प्रदेश</label>
          <select
            name={`sakshiItems[${idx}].SakshiProvince`}
            value={item.SakshiProvince ?? ''}
            onChange={(e) => {
              handleChange(e);
              setFieldValue(`sakshiItems[${idx}].SakshiDistrict`, '', false);
              setFieldValue(`sakshiItems[${idx}].SakshiVDCMUN`, '', false);
            }}
            className={`field ${NI}`}
          >
            <option value="">-- छान्नुहोस् --</option>
            {withValue(provinces, item.SakshiProvince).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">जिल्ला</label>
          <select
            name={`sakshiItems[${idx}].SakshiDistrict`}
            value={item.SakshiDistrict ?? ''}
            disabled={!item.SakshiProvince}
            onChange={(e) => {
              handleChange(e);
              setFieldValue(`sakshiItems[${idx}].SakshiVDCMUN`, '', false);
            }}
            className={`field ${NI}`}
          >
            <option value="">-- छान्नुहोस् --</option>
            {withValue(districts, item.SakshiDistrict).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">न.पा./गा.पा.</label>
          <select
            name={`sakshiItems[${idx}].SakshiVDCMUN`}
            value={item.SakshiVDCMUN ?? ''}
            disabled={!item.SakshiDistrict}
            onChange={handleChange}
            className={`field ${NI}`}
          >
            <option value="">-- छान्नुहोस् --</option>
            {withValue(municipalities, item.SakshiVDCMUN, (m) => m.name, (name) => ({ name, type: '' })).map((m) => (
              <option key={m.name} value={m.name}>
                {m.type ? `${m.name} (${m.type})` : m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ── Section 5: Sakshi ─────────────────────────────────────────────────────────
function SakshiSection({ values, handleChange, setFieldValue }) {
  return (
    <div className="panel p-6">
      <StepTitle>५. साक्षी विवरण</StepTitle>
      <div className="space-y-4">
        <Checkbox label="साक्षी छ?" name="HasSakshi" values={values} handleChange={handleChange} />
        {values.HasSakshi && (
          <FieldArray name="sakshiItems">
            {({ push, remove }) => (
              <div className="ml-7 space-y-4">
                {values.sakshiItems.map((item, idx) => (
                  <SakshiItemRow
                    key={idx}
                    item={item}
                    idx={idx}
                    handleChange={handleChange}
                    setFieldValue={setFieldValue}
                    remove={remove}
                  />
                ))}
                <button type="button" onClick={() => push(blankSakshi())} className="btn-secondary">
                  <Plus size={16} />साक्षी थप्नुहोस्
                </button>
              </div>
            )}
          </FieldArray>
        )}
      </div>
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────────────────────
export default function LoanForm() {
  const { loanNo } = useParams();
  const editing = !!loanNo;
  const navigate = useNavigate();
  const myBranch = useSelector((s) => s.auth.user?.branch);
  const allBranches = useSelector(selectCan('branch.access_all'));

  const [initial, setInitial] = useState(editing ? null : blankValues());
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');

  useEffect(() => {
    if (!editing) return;
    loansApi
      .get(loanNo)
      .then((loan) => {
        if (!loan.can_edit) return navigate(`/loan/detail/${loanNo}`, { replace: true });
        setInitial(toFormValues(loan));
      })
      .catch((e) => setError(errorMessage(e, 'Unable to load loan')));
  }, [editing, loanNo, navigate]);

  useEffect(() => {
    if (allBranches && !editing) {
      api.get('/auth/branches').then(({ data }) => {
        setBranches(data.branches);
        if (data.branches.length) setBranchId(String(data.branches[0].id));
      }).catch(() => { });
    }
  }, [allBranches, editing]);

  const submit = async (values, { setErrors }) => {
    setError('');
    try {
      const payload = {
        ...values,
        HasBusiness: values.HasBusiness ? 1 : 0,
        HasRateOfInterest: values.HasRateOfInterest ? 1 : 0,
        HasDepositJamani: values.HasDepositJamani ? 1 : 0,
        HasDhitoJamani: values.HasDhitoJamani ? 1 : 0,
        HasSakshi: values.HasSakshi ? 1 : 0,
      };
      if (allBranches && !editing && branchId) payload.branch_id = branchId;
      const saved = await loansApi.save(payload, editing ? loanNo : null);
      navigate('/loan/detail', {
        state: {
          message: editing
            ? `ऋण नं. ${saved.LoanNo} अपडेट भयो।`
            : `ऋण नं. ${saved.LoanNo} सफलतापूर्वक दर्ता भयो।`,
        },
      });
    } catch (e) {
      setErrors(e.response?.data?.errors || {});
      setError(errorMessage(e, 'Unable to save loan'));
    }
  };

  return (
    <>
      <PageHeader
        title={editing ? 'ऋण विवरण सच्याउनुहोस्' : 'नयाँ ऋण दर्ता'}
        subtitle={
          editing
            ? `ऋण नं. ${loanNo}`
            : 'ऋण नं. स्वचालित रूपमा सिर्जना हुनेछ। * भएका फिल्डहरू अनिवार्य छन्।'
        }
      >
        <Link to={editing ? `/loan/detail/${loanNo}` : '/loan/detail'} className="btn-secondary">
          <ArrowLeft size={16} />फर्कनुहोस्
        </Link>
      </PageHeader>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">
          {error}
        </p>
      )}

      {!initial ? (
        !error && <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <Formik initialValues={initial} validationSchema={schema} onSubmit={submit}>
          {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => {
            const shared = { values, errors, touched, handleChange, setFieldValue };
            return (
              <Form noValidate className="space-y-6">
                <ScrollToError />

                {/* Branch selector */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-slate-600">शाखा:</span>
                  {allBranches && !editing ? (
                    <select
                      className="field !w-auto"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      aria-label="Branch"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-medium">{myBranch?.name}</span>
                  )}
                </div>

                <BasicInfoSection {...shared} />
                <LoanTermsSection {...shared} />
                <DepositJamaniSection {...shared} />
                <DhitoJamaniSection {...shared} />
                <SakshiSection {...shared} />

                {/* Sticky footer */}
                <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-rule bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
                  <Link to={editing ? `/loan/detail/${loanNo}` : '/loan/detail'} className="btn-secondary">
                    रद्द गर्नुहोस्
                  </Link>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {editing ? 'अपडेट गर्नुहोस्' : 'सेभ गर्नुहोस्'}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      )}
    </>
  );
}
