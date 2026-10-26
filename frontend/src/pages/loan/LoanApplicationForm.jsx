import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { loanApplicationsApi } from '../../api/loanApplications';
import { errorMessage } from '../../api/axios';

const validationSchema = Yup.object().shape({
  MemberNo: Yup.string().required('सदस्यता नं. अनिवार्य छ'),
  LoanNo: Yup.string().required('ऋण नं. अनिवार्य छ'),
  EntryDate: Yup.string().required('मिति अनिवार्य छ'),
  LoanAmount: Yup.string().required('ऋण रकम अनिवार्य छ'),
  RateOfInterest: Yup.string().required('ब्याजदर अनिवार्य छ'),
});

export default function LoanApplicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [memberDetail, setMemberDetail] = useState(null);
  const [loanDetail, setLoanDetail] = useState(null);
  const [loanRequestDetail, setLoanRequestDetail] = useState(null);
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
          const res = await loanApplicationsApi.get(id);
          const app = res.application;
          setInitialData({
            MemberNo: app.MemberNo || '',
            LoanNo: app.LoanNo || '',
            EntryDate: app.EntryDate || '',
            RateOfInterest: app.RateOfInterest || '',
            MeetingNo: app.MeetingNo || '',
            LoanAmount: app.LoanAmount || '',
            StaffPost: app.StaffPost || '',
            StaffName: app.StaffName || '',
            Remarks: app.Remarks || '',
          });
          setMemberDetail(res.member || null);
          setLoanDetail(res.loan || null);
          setLoanRequestDetail(res.loanRequest || null);
          setEnterprise(res.enterprise || null);
          setStaffs(res.staffs || []);
          setStaffPosts(res.posts || []);

          // Load loans for this member
          const lRes = await loanApplicationsApi.loansForMember(app.MemberNo);
          setLoans(lRes || []);
        } else {
          const mRes = await loanApplicationsApi.members();
          setMembers(mRes || []);
          setInitialData({
            MemberNo: '',
            LoanNo: '',
            EntryDate: '',
            RateOfInterest: '',
            MeetingNo: '',
            LoanAmount: '',
            StaffPost: '',
            StaffName: '',
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
    setLoanRequestDetail(null);
    setLoans([]);

    if (!memberNo) return;

    try {
      const lRes = await loanApplicationsApi.loansForMember(memberNo);
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
      const ctx = await loanApplicationsApi.context(memberNo, loanNo);
      setMemberDetail(ctx.member || null);
      setLoanDetail(ctx.loan || null);
      setLoanRequestDetail(ctx.loanRequest || null);
      setEnterprise(ctx.enterprise || null);
      setStaffs(ctx.staffs || []);
      setStaffPosts(ctx.posts || []);

      // Auto populate fields
      const rate = ctx.loan?.RateOfInterest || '';
      const amount = ctx.loan?.LoanAmount || '';
      const meetingNo = ctx.loanRequest?.UpasamitiMeetingNo || '';
      const reqDate = ctx.loanRequest?.EntryDate || ctx.loan?.EntryDate || '';

      setFieldValue('RateOfInterest', rate);
      setFieldValue('LoanAmount', amount);
      if (meetingNo) setFieldValue('MeetingNo', meetingNo);
      if (!isEdit && reqDate) {
        // Default application EntryDate to today or loan request date
        setFieldValue('EntryDate', reqDate);
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
      return;
    }
    const matchedStaff = staffs.find((s) => s.post === post);
    if (matchedStaff) {
      setFieldValue('StaffName', matchedStaff.name || matchedStaff.name_eng || '');
    }
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await loanApplicationsApi.save(values, id);
      navigate(`/loan/application/${id || res.id}`, {
        state: { message: isEdit ? 'कर्जा प्रस्ताव अद्यावधिक भयो।' : 'कर्जा प्रस्ताव सफलतापूर्वक दर्ता भयो।' },
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
        title={isEdit ? 'कर्जा प्रस्ताव सम्पादन' : 'नयाँ कर्जा प्रस्ताव (Loan Proposal)'}
        subtitle="सदस्य नं. र ऋण नं. छान्नुहोस्, अन्य विवरणहरू स्वतः आउनेछन्।">
        <Link to={isEdit ? `/loan/application/${id}` : `/loan/application`} className="btn-secondary">
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
                          placeholder="सदस्यता नं. छान्नुहोस् वा टाइप गर्नुहोस्"
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

                  {/* Proposal Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      प्रस्ताव पत्र मिति <span className="text-red-500">*</span>
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
                        <span className="text-xs text-slate-400 block">स्थायी ठेगाना:</span>
                        <span>
                          {memberDetail.Province ? `${memberDetail.Province}, ` : ''}
                          {memberDetail.District ? `${memberDetail.District}, ` : ''}
                          {memberDetail.MUNVDC ? `${memberDetail.MUNVDC}-${memberDetail.WardNo}` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">हालको ठेगाना:</span>
                        <span>
                          {memberDetail.TmpMUNVDC ? `${memberDetail.TmpMUNVDC} - ${memberDetail.TmpWardNo}, ${memberDetail.TmpTole || ''}` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Proposal Specific Fields */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-slate-900 border-b pb-2">
                  कर्जा प्रस्ताव सम्बन्धी विवरण
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Loan Amount */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      स्वीकृत ऋण रकम (रु.) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="LoanAmount"
                      value={values.LoanAmount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="उदा: 1050000"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    {nepaliWords && (
                      <p className="mt-1 text-xs text-brand-700 font-medium">
                        अक्षरेपी: रु. {nepaliWords} मात्र
                      </p>
                    )}
                    <ErrorMessage name="LoanAmount" component="div" className="mt-1 text-xs text-red-500" />
                  </div>

                  {/* Rate of Interest */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ब्याजदर (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="RateOfInterest"
                      value={values.RateOfInterest}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="उदा: 10.5"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <ErrorMessage name="RateOfInterest" component="div" className="mt-1 text-xs text-red-500" />
                  </div>

                  {/* Upasamiti Meeting No */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ऋण उपसमिति बैठक नं.
                    </label>
                    <input
                      type="text"
                      name="MeetingNo"
                      value={values.MeetingNo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="उदा: १"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

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
                      placeholder="केही विशेष भए..."
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Realtime Letter Preview */}
                <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50/50 p-6">
                  <div className="text-center font-bold text-slate-800 border-b border-amber-200 pb-2 mb-4">
                    विषय: कर्जा प्रस्ताव सम्बन्धमा | (पत्रको प्रत्यक्ष नमुना)
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed text-justify">
                    श्री <strong className="text-slate-900">{memberDetail?.FullName || '………………………'}</strong> ज्यु,{' '}
                    <br />
                    <span>{memberDetail?.TmpMUNVDC ? `${memberDetail.TmpMUNVDC} - ${memberDetail.TmpWardNo}, ${memberDetail.TmpTole || ''}` : '………………………'}</span>
                    <br /><br />
                    महोदय,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;उपर्युक्त सम्बन्धमा तपाइले मिति{' '}
                    <strong>{convertToNepaliNumber(loanRequestDetail?.EntryDate) || convertToNepaliNumber(loanDetail?.EntryDate) || values.EntryDate || '……………'}</strong> मा पेश गर्नु भएको ऋण माग फारममा संस्थाको ऋण उपसमितिको{' '}
                    <strong>{values.MeetingNo || '…'}</strong> औ बैठकले ऋण नं.{' '}
                    <strong>{values.LoanNo || '…………'}</strong> रु.{' '}
                    <strong>{values.LoanAmount || '…………'}</strong> (अक्षरेपी रु.{' '}
                    <strong>{nepaliWords || '…………………………………'}</strong> मात्र) हाल{' '}
                    <strong>{values.RateOfInterest || '…'}</strong>% ले ब्याजदरका दरले ब्याज लाग्ने गरि तथा संस्थाको नियमानुसार समय समयमा परिवर्तित ब्याजदर अनुसार रहने गरि कर्जा स्वीकृत भएको जानकारी गराउदछौ |
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3">
                <Link to="/loan/application" className="btn-secondary">
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

