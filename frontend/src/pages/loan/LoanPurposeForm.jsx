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
  CheckCircle2,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber, formatNepaliCurrency } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import modDate from '../../utils/modDate';
import { NepaliInput } from '@itzsa/nepali-input';
import { loanPurposeApi } from '../../api/loanPurpose';
import { errorMessage } from '../../api/axios';

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

export default function LoanPurposeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [enterprise, setEnterprise] = useState(null);

  const [initialData, setInitialData] = useState({
    MemberNo: '',
    LoanNo: '',
    EntryDate: modDate.getCurrentNepaliDate(),
    BorrowerName: '',
    BorrowerAddress: '',
    LoanPurpose: '',
    LoanAmount: '',
    LoanAmountWords: '',
    IncomeSource: 'नोकरी',
    LoanPurposeCategory: '',
    LoanPurposeDetail1: '',
    LoanPurposeDetail2: '',
    OtherDetail: '',
    Remarks: '',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const memRes = await loanPurposeApi.members();
        const memList = Array.isArray(memRes) ? memRes : memRes?.members || [];
        if (mounted) {
          setMembers(memList);
          if (memRes?.enterprise) setEnterprise(memRes.enterprise);
        }

        if (isEdit) {
          const res = await loanPurposeApi.get(id);
          const p = res.loanPurpose;
          if (mounted && p) {
            setEnterprise(res.enterprise || null);
            setSelectedMember(res.member || null);
            setSelectedLoan(res.loan || null);

            setInitialData({
              MemberNo: p.MemberNo || '',
              LoanNo: p.LoanNo || '',
              EntryDate: p.EntryDate || modDate.getCurrentNepaliDate(),
              BorrowerName: p.BorrowerName || res.member?.FullName || '',
              BorrowerAddress: p.BorrowerAddress || '',
              LoanPurpose: p.LoanPurpose || res.loan?.LoanPurpose || '',
              LoanAmount: p.LoanAmount || res.loan?.LoanAmount || '',
              LoanAmountWords: p.LoanAmountWords || (p.LoanAmount ? convertToNepaliWords(p.LoanAmount) : ''),
              IncomeSource: p.IncomeSource || 'नोकरी',
              LoanPurposeCategory: p.LoanPurposeCategory || res.loan?.LoanPurpose || res.loan?.LoanType || '',
              LoanPurposeDetail1: p.LoanPurposeDetail1 || '',
              LoanPurposeDetail2: p.LoanPurposeDetail2 || '',
              OtherDetail: p.OtherDetail || '',
              Remarks: p.Remarks || '',
            });

            if (p.MemberNo) {
              const lList = await loanPurposeApi.loansForMember(p.MemberNo);
              if (mounted) setLoans(lList.loans || []);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial form data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  const handleMemberChange = async (memberNo, setValues, currentValues) => {
    setValues({
      ...currentValues,
      MemberNo: memberNo,
      LoanNo: '',
      BorrowerName: '',
      BorrowerAddress: '',
      LoanPurpose: '',
      LoanPurposeCategory: '',
      LoanAmount: '',
      LoanAmountWords: '',
    });
    setLoans([]);
    setSelectedMember(null);
    setSelectedLoan(null);

    if (!memberNo) return;

    try {
      const res = await loanPurposeApi.loansForMember(memberNo);
      setLoans(res.loans || []);
    } catch (err) {
      console.error('Failed to load member loans:', err);
    }
  };

  const handleLoanChange = async (loanNo, memberNo, setValues, currentValues) => {
    setValues({
      ...currentValues,
      LoanNo: loanNo,
    });
    if (!loanNo || !memberNo) return;

    try {
      const ctx = await loanPurposeApi.context(memberNo, loanNo);
      setEnterprise(ctx.enterprise);
      setSelectedMember(ctx.member);
      setSelectedLoan(ctx.loan);

      const mem = ctx.member || {};
      const ln = ctx.loan || {};

      let addr = '';
      if (mem.TmpTole || mem.TmpMUNVDC) {
        addr = `${mem.TmpTole || ''}${mem.TmpTole && mem.TmpMUNVDC ? ', ' : ''}${mem.TmpMUNVDC || ''}${mem.TmpWardNo ? ` - ${mem.TmpWardNo}` : ''}`;
      } else if (mem.PermTole || mem.PermMUNVDC) {
        addr = `${mem.PermTole || ''}${mem.PermTole && mem.PermMUNVDC ? ', ' : ''}${mem.PermMUNVDC || ''}${mem.PermWardNo ? ` - ${mem.PermWardNo}` : ''}`;
      }

      const amt = ln.LoanAmount || '';
      const words = amt ? convertToNepaliWords(amt) : '';
      const purposeTitle = ln.LoanPurpose || ln.LoanType || '';

      setValues({
        ...currentValues,
        LoanNo: loanNo,
        BorrowerName: mem.FullName || currentValues.BorrowerName,
        BorrowerAddress: addr || currentValues.BorrowerAddress,
        LoanPurpose: purposeTitle || currentValues.LoanPurpose,
        LoanPurposeCategory: purposeTitle || currentValues.LoanPurposeCategory || '',
        LoanAmount: amt || currentValues.LoanAmount,
        LoanAmountWords: words || currentValues.LoanAmountWords,
      });
    } catch (err) {
      console.error('Failed to load loan context:', err);
    }
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
      };
      const res = await loanPurposeApi.save(payload, isEdit ? id : null);
      const targetId = isEdit ? id : res.id;
      navigate(`/loan/purpose/${targetId}`, {
        state: {
          message: isEdit
            ? 'ऋण सदुपयोग विवरण सफलतापूर्वक अद्यावधिक गरियो।'
            : 'नयाँ ऋण सदुपयोग विवरण दर्ता भयो र स्वीकृतिका लागि पठाइयो।',
        },
      });
    } catch (err) {
      alert(errorMessage(err, 'फारम सेभ गर्न असफल भयो।'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <PageHeader
        title={isEdit ? 'ऋण सदुपयोग विवरण सम्पादन' : 'नयाँ ऋण सदुपयोग विवरण'}
        subtitle="ऋणीले लिएको ऋण तोकिएको उद्देश्य तथा शिर्षकमा सदुपयोग गर्ने सम्बन्धी विवरण"
      >
        <Link
          to={isEdit ? `/loan/purpose/${id}` : '/loan/purpose'}
          className="btn-secondary"
        >
          <ArrowLeft className="size-4" /> पछाडि जानुहोस्
        </Link>
      </PageHeader>

      <Formik
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, setValues, setFieldValue }) => {
          return (
            <Form className="space-y-6">
              {/* Member & Loan Selector Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-semibold text-slate-800">
                  <User className="size-4 text-brand-600" />
                  ऋणी तथा ऋण छनौट
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Member Selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      सदस्य नं. / नाम <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="MemberNo"
                      value={values.MemberNo}
                      disabled={isEdit}
                      onChange={(e) => handleMemberChange(e.target.value, setValues, values)}
                      className="w-full rounded-md border border-slate-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                    >
                      <option value="">-- सदस्य छान्नुहोस् --</option>
                      {members.map((m) => (
                        <option key={m.MemberNo} value={m.MemberNo}>
                          {m.MemberNo} - {m.FullName}
                        </option>
                      ))}
                    </select>
                    {touched.MemberNo && errors.MemberNo && (
                      <p className="mt-1 text-xs text-red-500">{errors.MemberNo}</p>
                    )}
                  </div>

                  {/* Loan Selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ऋण नं. <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="LoanNo"
                      value={values.LoanNo}
                      disabled={isEdit || !values.MemberNo}
                      onChange={(e) => handleLoanChange(e.target.value, values.MemberNo, setValues, values)}
                      className="w-full rounded-md border border-slate-200 p-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-slate-50"
                    >
                      <option value="">-- ऋण नं. छान्नुहोस् --</option>
                      {loans.map((l) => (
                        <option key={l.LoanNo} value={l.LoanNo}>
                          {l.LoanNo} ({l.LoanPurpose || 'ऋण'}) - रु. {formatNepaliCurrency(l.LoanAmount) || l.LoanAmount}
                        </option>
                      ))}
                    </select>
                    {touched.LoanNo && errors.LoanNo && (
                      <p className="mt-1 text-xs text-red-500">{errors.LoanNo}</p>
                    )}
                  </div>

                  {/* Entry Date */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      फारम मिति (वि.सं.) <span className="text-red-500">*</span>
                    </label>
                    <NepaliCalendar
                      value={values.EntryDate}
                      onChange={(val) => setFieldValue('EntryDate', val)}
                      width={180}
                      className="w-full rounded-md border border-slate-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Auto-filled Member / Loan details */}
                <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 text-xs md:grid-cols-4">
                  <div>
                    <span className="text-slate-400">ऋणीको नाम:</span>
                    <div className="font-semibold text-slate-700">{values.BorrowerName || '—'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">ऋणीको ठेगाना:</span>
                    <div className="font-semibold text-slate-700">{values.BorrowerAddress || '—'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">ऋणको शिर्षक:</span>
                    <div className="font-semibold text-slate-700">{values.LoanPurpose || '—'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">ऋण रकम:</span>
                    <div className="font-semibold text-slate-700">
                      {values.LoanAmount ? `रु. ${formatNepaliCurrency(values.LoanAmount)}` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Purpose & Income Source Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-semibold text-slate-800">
                  <FileText className="size-4 text-brand-600" />
                  ऋण सदुपयोग तथा आम्दानी सम्बन्धी विवरण
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      आम्दानीको श्रोत (किस्ता र ब्याज तिर्ने आधार)
                    </label>
                    <NepaliInput
                      value={values.IncomeSource}
                      onChange={(e) => setFieldValue('IncomeSource', getVal(e))}
                      placeholder="उदा: नोकरी, व्यवसाय, कृषि"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ऋण लगानी सम्बन्धी शिर्षक / आधार
                    </label>
                    <NepaliInput
                      value={values.LoanPurposeCategory}
                      onChange={(e) => setFieldValue('LoanPurposeCategory', getVal(e))}
                      placeholder="उदा: (झ) घरायसी/सामाजिक कार्य ऋण"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      १. कुन कार्य गर्ने हो ?
                    </label>
                    <NepaliInput
                      value={values.LoanPurposeDetail1}
                      onChange={(e) => setFieldValue('LoanPurposeDetail1', getVal(e))}
                      placeholder="ऋण लिएर गर्ने कार्यको विवरण लेख्नुहोस्..."
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      २. कसको / कसका लागि गर्ने हो ?
                    </label>
                    <NepaliInput
                      value={values.LoanPurposeDetail2}
                      onChange={(e) => setFieldValue('LoanPurposeDetail2', getVal(e))}
                      placeholder="कसका लागि कार्य गर्न लागिएको हो..."
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ३. अन्य विवरण
                    </label>
                    <NepaliInput
                      value={values.OtherDetail}
                      onChange={(e) => setFieldValue('OtherDetail', getVal(e))}
                      placeholder="थप अन्य विवरण भए खुलाउनुहोस्..."
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      कैफियत (Remarks)
                    </label>
                    <input
                      type="text"
                      name="Remarks"
                      value={values.Remarks}
                      onChange={handleChange}
                      placeholder="आवश्यक भएमा आन्तरिक कैफियत लेख्नुहोस्"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Deed Preview Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="text-sm font-semibold text-slate-800">
                    कागजात पूर्वावलोकन (Document Live Preview)
                  </div>
                  <span className="text-xs text-slate-400">फारम भर्दा स्वतः अद्यावधिक हुन्छ</span>
                </div>

                <div className="rounded-lg border border-slate-300 bg-slate-50/50 p-8 shadow-inner">
                  {/* Organization Header */}
                  <div className="text-center pb-4 border-b border-slate-200 mb-6">
                    <h2 className="text-lg font-bold text-slate-900">
                      {enterprise?.CompanyName || enterprise?.companyname || 'सहकारी संस्था लि.'}
                    </h2>
                    <p className="text-xs text-slate-600">
                      {enterprise?.Address || enterprise?.address
                        ? `${enterprise.Address || enterprise.address}${enterprise.WardNo || enterprise.wardno ? ` - ${convertToNepaliNumber(enterprise.WardNo || enterprise.wardno)}` : ''}`
                        : ''}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="flex justify-end text-xs mb-4 text-slate-700">
                    <div>
                      <span className="font-semibold">मिति:</span> {convertToNepaliNumber(values.EntryDate) || '—'}
                    </div>
                  </div>

                  {/* Summary Table */}
                  <div className="mb-6 flex justify-center">
                    <table className="w-full max-w-2xl border-collapse border border-slate-300 bg-white text-xs">
                      <tbody>
                        <tr className="bg-slate-100">
                          <td colSpan={2} className="border border-slate-300 px-3 py-1.5 font-bold text-slate-800">
                            ऋण सदुपयोग गर्ने विवरण
                          </td>
                        </tr>
                        <tr>
                          <td className="w-1/3 border border-slate-300 px-3 py-1.5 font-medium text-slate-600">सदस्य नं.</td>
                          <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                            {values.MemberNo || '—'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-600">ऋणीको नाम</td>
                          <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                            {values.BorrowerName || '—'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-600">ऋणीको ठेगाना</td>
                          <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                            {values.BorrowerAddress || '—'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-600">ऋण लगानीको शिर्षक</td>
                          <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                            {values.LoanPurpose || '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Legal Commitment Paragraph */}
                  <div className="space-y-4 text-xs text-justify leading-relaxed text-slate-800">
                    <p className="indent-8">
                      म यस <span className="font-bold underline">{enterprise?.CompanyName || enterprise?.companyname || 'संस्था'}</span>को शेयर सदस्य भइ नियमित रुपमा बचत गरिरहेकोले हाल मलाई तपशिलमा उल्लेखित उद्देश्य बमोजिम रु.{' '}
                      <span className="font-bold underline">{values.LoanAmount ? formatNepaliCurrency(values.LoanAmount) : '.............'}</span>{' '}
                      (अक्षरेपी रु.{' '}
                      <span className="font-bold underline">
                        {values.LoanAmountWords || (values.LoanAmount ? convertToNepaliWords(values.LoanAmount) : '................................................')}
                      </span>{' '}
                      मात्र) ऋण आवश्यक भएकाले उक्त रकम उपलब्ध गरिदिनुहुन अनुरोध गर्दछु | उक्त ऋण रकमको किस्ता र ब्याज तिर्ने मेरो आम्दानीको श्रोत{' '}
                      <span className="font-bold underline">{values.IncomeSource || 'नोकरी'}</span> रहेको छ | मैले यस संस्थाबाट लिएको ऋण तल उल्लेखित शिर्षकमा सदुपयोग गरि नियमित बचत, ऋणको ब्याज र किस्ता समयमा भुक्तानी गर्ने प्रतिबद्धता व्यक्त गर्दछु|
                    </p>

                    {/* Bullet Points */}
                    <div className="rounded bg-white p-4 border border-slate-200">
                      <div className="font-bold text-slate-900 mb-1">ऋण लगानी सम्बन्धि आधारहरु:</div>
                      <div className="font-bold text-slate-800 mb-3">{values.LoanPurposeCategory || values.LoanPurpose || '(झ) घरायसी/सामाजिक कार्य ऋण'}</div>
                      <ul className="space-y-2 pl-4 text-slate-700">
                        <li className="flex gap-2">
                          <span className="font-semibold text-nowrap">१. कुन कार्य गर्ने हो ? :-</span>
                          <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1">
                            {values.LoanPurposeDetail1 || '—'}
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-semibold text-nowrap">२. कसको/कसका लागि गर्ने हो? :-</span>
                          <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1">
                            {values.LoanPurposeDetail2 || '—'}
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-semibold text-nowrap">३. अन्य विवरण :-</span>
                          <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1">
                            {values.OtherDetail || '—'}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <p className="indent-8">
                      माथि उल्लेखित परियोजना/ शिर्षक बाहेक अन्य क्षेत्रमा ऋणको प्रयोग गरेको पाइएमा संस्थाले गर्ने कारबाहीमा कुनै उजुर-वाजुर गर्ने छैन |
                    </p>
                  </div>

                  {/* Signature Section */}
                  <div className="mt-8 flex justify-end">
                    <div className="text-right text-xs space-y-2">
                      <div className="h-12"></div>
                      <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                        हस्ताक्षर: .......................................
                      </div>
                      <div className="font-bold text-slate-900">
                        ऋणीको नाम: {values.BorrowerName || '.......................................'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Link
                  to={isEdit ? `/loan/purpose/${id}` : '/loan/purpose'}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  रद्द गर्नुहोस्
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-slate-300"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> सुरक्षित गर्दै...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> {isEdit ? 'परिवर्तन सुरक्षित गर्नुहोस्' : 'दर्ता गर्नुहोस्'}
                    </>
                  )}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
