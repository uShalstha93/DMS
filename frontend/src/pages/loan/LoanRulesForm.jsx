import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { loanRulesApi } from '../../api/loanRules';
import { errorMessage } from '../../api/axios';
import { NepaliInput } from '@itzsa/nepali-input';

const validationSchema = Yup.object().shape({
  MemberNo: Yup.string().required('सदस्यता नं. अनिवार्य छ'),
  LoanNo: Yup.string().required('ऋण नं. अनिवार्य छ'),
  EntryDate: Yup.string().required('मिति अनिवार्य छ'),
  VisitDate: Yup.string().required('परामर्श उपस्थित मिति अनिवार्य छ'),
});

export default function LoanRulesForm() {
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
          const res = await loanRulesApi.get(id);
          const r = res.rule;
          setInitialData({
            MemberNo: r.MemberNo || '',
            LoanNo: r.LoanNo || '',
            LoanAmount: r.LoanAmount || '',
            EntryDate: r.EntryDate || '',
            VisitDate: r.VisitDate || '',
            AdditionalIntRate: r.AdditionalIntRate || '',
            ChangeIntRate: r.ChangeIntRate || '',
            Person2: r.Person2 || '',
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
          const lRes = await loanRulesApi.loansForMember(r.MemberNo);
          setLoans(lRes || []);
        } else {
          const mRes = await loanRulesApi.members();
          setMembers(mRes || []);
          setInitialData({
            MemberNo: '',
            LoanNo: '',
            LoanAmount: '',
            EntryDate: '',
            VisitDate: '',
            AdditionalIntRate: '',
            ChangeIntRate: '',
            Person2: '',
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
      const lRes = await loanRulesApi.loansForMember(memberNo);
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
      const ctx = await loanRulesApi.context(memberNo, loanNo);
      setMemberDetail(ctx.member || null);
      setLoanDetail(ctx.loan || null);
      setEnterprise(ctx.enterprise || null);
      setStaffs(ctx.staffs || []);
      setStaffPosts(ctx.posts || []);

      // Auto populate fields
      const amount = ctx.loan?.LoanAmount || '';
      const entryDate = ctx.loan?.EntryDate || '';

      setFieldValue('LoanAmount', amount);
      if (!isEdit) {
        if (entryDate) {
          setFieldValue('EntryDate', entryDate);
          setFieldValue('VisitDate', entryDate);
        }
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
      const res = await loanRulesApi.save(values, id);
      navigate(`/loan/rules/${id || res.id}`, {
        state: { message: isEdit ? 'ऋणका शर्तहरु अद्यावधिक भयो।' : 'ऋणका शर्तहरु सफलतापूर्वक दर्ता भयो।' },
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
        title={isEdit ? 'ऋणका शर्तहरु सम्पादन' : 'नयाँ ऋणका शर्तहरु (Loan Rules)'}
        subtitle="ऋणी सदस्यले पालना गर्नुपर्ने सर्तहरु तथा परामर्श सहमति फारम तयार गर्नुहोस्">
        <Link to={isEdit ? `/loan/rules/${id}` : `/loan/rules`} className="btn-secondary">
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
          const loanAmtNum = values.LoanAmount || loanDetail?.LoanAmount || '';
          const nepaliWords = loanAmtNum ? convertToNepaliWords(loanAmtNum) : '';

          return (
            <Form className="space-y-6">
              {/* Member & Loan Selector Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                  <Info className="size-5 text-brand-600" /> आधारभूत छनौट (सदस्य र ऋण विवरण)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                  {/* Visit Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      परामर्श उपस्थित मिति <span className="text-red-500">*</span>
                    </label>
                    <NepaliCalendar
                      value={values.VisitDate}
                      onChange={(date) => setFieldValue('VisitDate', date)}
                      width={180}
                    />
                    <ErrorMessage name="VisitDate" component="div" className="mt-1 text-xs text-red-500" />
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

              {/* Conditions & Rates Specific Fields */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                  शर्त तथा ब्याज हेरफेर विवरण
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Additional Interest Rate */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      शिर्षक फरक परेमा थप अतिरिक्त ब्याज (%)
                    </label>
                    <NepaliInput
                      type="text"
                      name="AdditionalIntRate"
                      value={values.AdditionalIntRate}
                      placeholder="उदा: २"
                      onChange={handleChange}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 !text-[14px] h-10"
                    />
                    <span className="text-xs text-slate-400 mt-1 block">बुँदा नं. ८ अनुसार लाग्ने अतिरिक्त ब्याजदर</span>
                  </div>

                  {/* Change Interest Rate */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      बजार दर अनुसार हेरफेर हुन सक्ने ब्याजदर (%)
                    </label>
                    <NepaliInput
                      type="text"
                      name="ChangeIntRate"
                      value={values.ChangeIntRate}
                      placeholder="उदा: १"
                      onChange={handleChange}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 !text-[14px] h-10"
                    />
                    <span className="text-xs text-slate-400 mt-1 block">बुँदा नं. १३ अनुसार हेरफेर गर्न सकिने ब्याजदर</span>
                  </div>

                  {/* Person 2 (Counseling attendee) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      परामर्शमा उपस्थित २. व्यक्ति (नाम थर)
                    </label>
                    <NepaliInput
                      type="text"
                      name="Person2"
                      value={values.Person2}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="परामर्शमा उपस्थित व्यक्तिको नाम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 !text-[14px] h-10"
                    />
                    <span className="text-xs text-slate-400 mt-1 block">ऋणी बाहेक उपस्थित हुने अर्को व्यक्तिको नाम</span>
                  </div>

                  {/* Staff Post */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      परामर्श दिने कर्मचारीको पद
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

                {/* Realtime Rules Preview */}
                <div className="mt-8 rounded-lg border border-purple-200 bg-purple-50/50 p-6">
                  <div className="text-center font-bold text-slate-800 border-b border-purple-200 pb-2 mb-4 text-base">
                    ऋण लिने सदस्यले पालना गर्नुपर्ने सर्तहरु: (प्रत्यक्ष नमुना)
                  </div>
                  <ul className="text-xs text-slate-800 space-y-2 leading-relaxed text-justify">
                    <li>
                      १. ऋणी सदस्यले ऋण लिदा तमसुकमा लेखिएको बमोजिम मासिक ब्याज र किस्ता वापत रु. <strong>{values.LoanAmount || '………'}</strong> | (अक्षरेपी <strong>{nepaliWords || '…………………………………………'}</strong> मात्र) तोकिएको समयमा भुक्तानी गर्नु पर्ने छ |
                    </li>
                    <li>२. तपाईले लिनु भएको ऋणको किस्ता र ब्याज हरेक किस्ताको समय अवधि भित्र बुजाउनु पर्छ |</li>
                    <li>३. ऋणको ब्याजदर संस्थाको संचालक समितले परिबर्तित वित्तिय बजार अनुसार ब्याजदर परिवर्तन गरे, परिबर्तित ब्याजदर अनुसार ऋणीले ऋणको ब्याज भुक्तानी गर्नु पर्ने छ |</li>
                    <li>८. एउटा शिर्षकमा ऋण लिएर अर्को शिर्षकमा लगानी गरेमा थप <strong>{values.AdditionalIntRate || '…'}%</strong> ले अतिरिक्त ब्याज शुल्क लाग्ने छ |</li>
                    <li>१२. आज मिति <strong>{convertToNepaliNumber(values.VisitDate) || values.VisitDate || '…………'}</strong> मा म स्वयम् ऋणी आफै संस्थामा उपस्थित भइ ऋणको सम्पूर्ण परामर्श लिई उल्लेखित सर्तहरु पालना गर्दछु भनि एक प्रति बुझी लिई सहिछाप गरिदिए |</li>
                    <li>१३. बजार दर अनुसार संचालक समितिले ब्याजदर <strong>{values.ChangeIntRate || '…'}%</strong> सम्म हेरफेर गर्न सक्छ |</li>
                  </ul>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3">
                <Link to="/loan/rules" className="btn-secondary">
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

