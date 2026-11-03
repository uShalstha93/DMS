import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { loanPratigyaApi } from '../../api/loanPratigya';
import { errorMessage } from '../../api/axios';
import { NepaliInput } from '@itzsa/nepali-input';

const validationSchema = Yup.object().shape({
  MemberNo: Yup.string().required('सदस्यता नं. अनिवार्य छ'),
  LoanNo: Yup.string().required('ऋण नं. अनिवार्य छ'),
  EntryDate: Yup.string().required('मिति अनिवार्य छ'),
});

export default function LoanPratigyaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [memberDetail, setMemberDetail] = useState(null);
  const [loanDetail, setLoanDetail] = useState(null);
  const [staffs, setStaffs] = useState([]);
  const [staffPosts, setStaffPosts] = useState([]);
  const [enterprise, setEnterprise] = useState(null);

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        if (isEdit) {
          const res = await loanPratigyaApi.get(id);
          const r = res.pratigya;
          setInitialData({
            MemberNo: r.MemberNo || '',
            LoanNo: r.LoanNo || '',
            EntryDate: r.EntryDate || '',
            RateOfInterest: r.RateOfInterest || '',
            Day1: r.Day1 || '',
            Day2: r.Day2 || '',
            AddInterest1: r.AddInterest1 || '',
            Day3: r.Day3 || '',
            Day4: r.Day4 || '',
            AddInterest2: r.AddInterest2 || '',
            Day5: r.Day5 || '',
            Day6: r.Day6 || '',
            AddInterest3: r.AddInterest3 || '',
            KistaDay1: r.KistaDay1 || '',
            Fine1: r.Fine1 || '',
            KistaDay2: r.KistaDay2 || '',
            Fine2: r.Fine2 || '',
            KistaDay3: r.KistaDay3 || '',
            Fine3: r.Fine3 || '',
            ChangeableInterest: r.ChangeableInterest || '',
            StaffID: r.StaffID || '',
            StaffName: r.StaffName || '',
            StaffPost: r.StaffPost || '',
            Remarks: r.Remarks || '',
          });
          setMemberDetail(res.member || null);
          setLoanDetail(res.loan || null);
          setEnterprise(res.enterprise || null);
          setStaffs(res.staffs || []);
          setStaffPosts(res.posts || []);

          // Load loans for this member
          const lRes = await loanPratigyaApi.loansForMember(r.MemberNo);
          setLoans(lRes || []);
        } else {
          const mRes = await loanPratigyaApi.members();
          setMembers(mRes || []);
          setInitialData({
            MemberNo: '',
            LoanNo: '',
            EntryDate: '',
            RateOfInterest: '',
            Day1: '',
            Day2: '',
            AddInterest1: '',
            Day3: '',
            Day4: '',
            AddInterest2: '',
            Day5: '',
            Day6: '',
            AddInterest3: '',
            KistaDay1: '',
            Fine1: '',
            KistaDay2: '',
            Fine2: '',
            KistaDay3: '',
            Fine3: '',
            ChangeableInterest: '',
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
      const lRes = await loanPratigyaApi.loansForMember(memberNo);
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
      const ctx = await loanPratigyaApi.context(memberNo, loanNo);
      setMemberDetail(ctx.member || null);
      setLoanDetail(ctx.loan || null);
      setEnterprise(ctx.enterprise || null);
      setStaffs(ctx.staffs || []);
      setStaffPosts(ctx.posts || []);

      // Auto populate fields
      const entryDate = ctx.loan?.EntryDate || '';
      const rate = ctx.loan?.RateOfInterest || '';

      if (rate) setFieldValue('RateOfInterest', rate);
      if (!isEdit && entryDate) {
        setFieldValue('EntryDate', entryDate);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Staff Post selection
  const handlePostChange = (post, setFieldValue) => {
    setFieldValue('StaffPost', post);
    if (!post) {
      setFieldValue('StaffName', '');
      setFieldValue('StaffID', '');
      return;
    }
    const matchedStaff = staffs.find((s) => s.post === post);
    if (matchedStaff) {
      setFieldValue('StaffName', matchedStaff.name || matchedStaff.name_eng || '');
      setFieldValue('StaffID', matchedStaff.staffno || '');
    }
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await loanPratigyaApi.save(values, id);
      navigate(`/loan/pratigya/${id || res.id}`, {
        state: { message: isEdit ? 'प्रतिज्ञा पत्र अद्यावधिक भयो।' : 'प्रतिज्ञा पत्र सफलतापूर्वक दर्ता भयो।' },
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

  return (
    <>
      <PageHeader
        title={isEdit ? 'ऋणको प्रतिज्ञा पत्र सम्पादन' : 'नयाँ ऋणको प्रतिज्ञा पत्र (Loan Pratigya)'}
        subtitle="ऋणी सदस्यले गर्ने ऋण सम्झौता तथा प्रतिज्ञा पत्र फारम तयार गर्नुहोस्"
      >
        <Link to={isEdit ? `/loan/pratigya/${id}` : `/loan/pratigya`} className="btn-secondary">
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
                      <span className="text-xs text-slate-400 block">सदस्यको नाम:</span>
                      <span className="font-semibold text-slate-900">{memberDetail.FullName}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">ऋण प्रकार / शीर्षक:</span>
                      <span className="font-medium text-slate-900">{loanDetail?.LoanType || '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">ऋण रकम:</span>
                      <span className="font-semibold text-brand-700">
                        {loanDetail?.LoanAmount ? `रु. ${loanDetail.LoanAmount}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pratigya Clauses Specific Fields */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                प्रतिज्ञा पत्रका शर्त, दिन तथा ब्याजदर विवरण
              </h3>

              {/* Clause 5 & 8 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    बुँदा नं. ५: ऋणको नियमित ब्याजदर (%)
                  </label>
                  <NepaliInput
                    type="text"
                    name="RateOfInterest"
                    value={values.RateOfInterest}
                    placeholder="उदा: १२"
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 !text-[14px] h-10"
                  />
                  <span className="text-xs text-slate-400 mt-1 block">ऋणीले लिने ऋणको तोकिएको ब्याजदर</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    बुँदा नं. ८: हेरफेर हुन सक्ने ब्याजदर (%)
                  </label>
                  <NepaliInput
                    type="text"
                    name="ChangeableInterest"
                    value={values.ChangeableInterest}
                    placeholder="उदा: १"
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 !text-[14px] h-10"
                  />
                  <span className="text-xs text-slate-400 mt-1 block">बजार दर अनुसार संचालक समितिले हेरफेर गर्न सक्ने दर</span>
                </div>
              </div>

              {/* Clause 6: Interest steps */}
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">
                  बुँदा नं. ६: दिन अनुसार लाग्ने अतिरिक्त ब्याजदर तालिका
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Step 1 */}
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-2">चरण १</span>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <NepaliInput
                          type="text"
                          name="Day1"
                          value={values.Day1}
                          placeholder="दिन १"
                          onChange={handleChange}
                          className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm h-8"
                        />
                        <span className="text-xs text-slate-500">देखि</span>
                        <NepaliInput
                          type="text"
                          name="Day2"
                          value={values.Day2}
                          placeholder="दिन २"
                          onChange={handleChange}
                          className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm h-8"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600">ब्याज (%):</span>
                        <NepaliInput
                          type="text"
                          name="AddInterest1"
                          value={values.AddInterest1}
                          placeholder="उदा: २"
                          onChange={handleChange}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm h-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-2">चरण २</span>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <NepaliInput
                          type="text"
                          name="Day3"
                          value={values.Day3}
                          placeholder="दिन ३"
                          onChange={handleChange}
                          className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm h-8"
                        />
                        <span className="text-xs text-slate-500">देखि</span>
                        <NepaliInput
                          type="text"
                          name="Day4"
                          value={values.Day4}
                          placeholder="दिन ४"
                          onChange={handleChange}
                          className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm h-8"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600">ब्याज (%):</span>
                        <NepaliInput
                          type="text"
                          name="AddInterest2"
                          value={values.AddInterest2}
                          placeholder="उदा: ४"
                          onChange={handleChange}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm h-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-2">चरण ३</span>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <NepaliInput
                          type="text"
                          name="Day5"
                          value={values.Day5}
                          placeholder="दिन ५"
                          onChange={handleChange}
                          className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm h-8"
                        />
                        <span className="text-xs text-slate-500">देखि</span>
                        <NepaliInput
                          type="text"
                          name="Day6"
                          value={values.Day6}
                          placeholder="दिन ६"
                          onChange={handleChange}
                          className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm h-8"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600">ब्याज (%):</span>
                        <NepaliInput
                          type="text"
                          name="AddInterest3"
                          value={values.AddInterest3}
                          placeholder="उदा: ६"
                          onChange={handleChange}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clause 7: Kista Fine steps */}
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">
                  बुँदा नं. ७: भाका नाघेको किस्ता अनुसार लाग्ने हर्जाना तालिका
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Fine 1 */}
                  <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">हर्जाना चरण १</span>
                    <div className="flex items-center gap-2">
                      <NepaliInput
                        type="text"
                        name="KistaDay1"
                        value={values.KistaDay1}
                        placeholder="दिन सम्म"
                        onChange={handleChange}
                        className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm h-8"
                      />
                      <span className="text-xs text-slate-500">दिन सम्म</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600">हर्जाना (%):</span>
                      <NepaliInput
                        type="text"
                        name="Fine1"
                        value={values.Fine1}
                        placeholder="उदा: २"
                        onChange={handleChange}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm h-8"
                      />
                    </div>
                  </div>

                  {/* Fine 2 */}
                  <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">हर्जाना चरण २</span>
                    <div className="flex items-center gap-2">
                      <NepaliInput
                        type="text"
                        name="KistaDay2"
                        value={values.KistaDay2}
                        placeholder="दिन सम्म"
                        onChange={handleChange}
                        className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm h-8"
                      />
                      <span className="text-xs text-slate-500">दिन सम्म</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600">हर्जाना (%):</span>
                      <NepaliInput
                        type="text"
                        name="Fine2"
                        value={values.Fine2}
                        placeholder="उदा: ३"
                        onChange={handleChange}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm h-8"
                      />
                    </div>
                  </div>

                  {/* Fine 3 */}
                  <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">हर्जाना चरण ३</span>
                    <div className="flex items-center gap-2">
                      <NepaliInput
                        type="text"
                        name="KistaDay3"
                        value={values.KistaDay3}
                        placeholder="दिन सम्म"
                        onChange={handleChange}
                        className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm h-8"
                      />
                      <span className="text-xs text-slate-500">दिन सम्म</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600">हर्जाना (%):</span>
                      <NepaliInput
                        type="text"
                        name="Fine3"
                        value={values.Fine3}
                        placeholder="उदा: ५"
                        onChange={handleChange}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff and Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Staff Post */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    कर्मचारीको पद
                  </label>
                  <select
                    name="StaffPost"
                    value={values.StaffPost}
                    onChange={(e) => handlePostChange(e.target.value, setFieldValue)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">-- पद छान्नुहोस् --</option>
                    {staffPosts.map((post, idx) => (
                      <option key={idx} value={post}>{post}</option>
                    ))}
                  </select>
                </div>

                {/* Staff Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    कर्मचारीको नाम
                  </label>
                  <input
                    type="text"
                    name="StaffName"
                    value={values.StaffName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="कर्मचारीको नाम"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    कैफियत (Remarks)
                  </label>
                  <input
                    type="text"
                    name="Remarks"
                    value={values.Remarks}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="कैफियत..."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Live Pratigya Preview */}
              <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50/50 p-6">
                <div className="text-center font-bold text-slate-800 border-b border-emerald-200 pb-2 mb-4 text-base">
                  ऋणको प्रतिज्ञा पत्र (प्रत्यक्ष नमुना)
                </div>
                <ul className="text-xs text-slate-800 space-y-2.5 leading-relaxed text-justify">
                  <li>१. संस्थाको ऋण रकम कबोल गरेको मितिमा नियमित रुपमा किस्ता, सावा र ब्याज रकम संस्थाको नियम अनुसार बुझाउने छु, यदि समयमा नबुझाएमा नियमानुसार बिलम्ब, हर्जाना शुल्क तिर्न मन्जुर छु |</li>
                  <li>२. मैले सहकारीको ऐन, कानुन, नीतिनियम, मापदण्ड, संस्थाको विनियम तथा ऋण सम्बन्धि नीतिहरुको बारेमा पूर्ण जानकार छु साथै सम्पूर्ण निति नियमहरुको परिपालन गर्न गराउनको लागि तत्पर छु |</li>
                  <li>३. यदि छ महिना भित्र सावा, ब्याज, हर्जाना, जरिवाना, आदि बुझाइन भने मेरो बचत, शेयर, सामुहिक जमानत तथा धितो लिलामबाट समेत कट्टा हुने गरि असुल उपर गर्न मेरो मन्जुर छ |</li>
                  <li>४. ऋण रकम चुक्ता नभए सम्म धितो जमानत तथा घर घरानाबाट सावा ब्याज चुक्ता गर्नेछु |</li>
                  <li>
                    ५. संस्थाको ऋण नीति अनुसार मैले (ऋणीले) लिने ऋणको ब्याजदर{' '}
                    <strong>{values.RateOfInterest || '……'}%</strong> रहेको छ |
                  </li>
                  <li>
                    ६. मैले लिएको ऋणको ब्याज नियमित तिरेमा परियोजना अनुसार जति ब्याजदर निर्धारण गरिएको अनुसार लाग्ने छ र{' '}
                    <strong>{values.Day1 || '…'}</strong> देखि <strong>{values.Day2 || '…'}</strong> दिन भित्र आएमा{' '}
                    <strong>{values.AddInterest1 || '…'}%</strong> ब्याज लाग्ने छ,{' '}
                    <strong>{values.Day3 || '…'}</strong> देखि <strong>{values.Day4 || '…'}</strong> दिन भित्र आएमा{' '}
                    <strong>{values.AddInterest2 || '…'}%</strong> ब्याज लाग्ने छ | त्यसै गरि{' '}
                    <strong>{values.Day5 || '…'}</strong> देखि <strong>{values.Day6 || '…'}</strong> दिन भित्र आएमा{' '}
                    <strong>{values.AddInterest3 || '…'}%</strong> ब्याज लाग्दै जाने छ |
                  </li>
                  <li>
                    ७. मैले लिएको ऋणको किस्ताको भाका नाघेमा भाखा नागेको दिन देखि{' '}
                    <strong>{values.KistaDay1 || '…'}</strong> दिन सम्म किस्ता नआएमा भाका नाघेको किस्ताको{' '}
                    <strong>{values.Fine1 || '…'}%</strong> ले हर्जना,{' '}
                    <strong>{values.KistaDay2 || '…'}</strong> दिन सम्म किस्ता नआएमा{' '}
                    <strong>{values.Fine2 || '…'}%</strong> हर्जाना र{' '}
                    <strong>{values.KistaDay3 || '…'}</strong> दिन सम्म किस्ता नआएमा{' '}
                    <strong>{values.Fine3 || '…'}%</strong> हर्जाना तिर्न मन्जुर छु |
                  </li>
                  <li>
                    ८. बजार दर अनुसार संचालक समितिले ब्याजदर{' '}
                    <strong>{values.ChangeableInterest || '…'}%</strong> सम्म हेरफेर गरेको दरमा म ऋण र ब्याज तिर्न मंजुर रहेको छु |
                  </li>
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3">
              <Link to="/loan/pratigya" className="btn-secondary">
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

