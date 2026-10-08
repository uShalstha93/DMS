import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, ChevronLeft, Loader2 } from 'lucide-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import PageHeader from '../../components/PageHeader';
import PersonalDetails from './PersonalDetails';
import AddressDetails from './AddressDetails';
import FamilyDetails from './FamilyDetails';
import MemberDocs from './MemberDocs';
import MemLocation from './MemLocation';
import CompletionStep from './CompletionStep';
import { errorMessage } from '../../api/axios';
import { branchIdOf, membersApi } from '../../api/members';

const STEPS = ['व्यक्तिगत विवरण', 'ठेगाना विवरण', 'पारिवारिक विवरण', 'फोटो विवरण', 'नक्सा स्थान', 'कार्य पुरा भयो'];
const SAVE_STEP = 5; // the last step with a form; saving happens here

const blankValues = (memberNo) => ({
  // Personal
  memberNo, fullName: '', fullNameEng: '', gender: '', dob: '', mobileNo: '', email: '', citizenshipNo: '',
  citIssuedDistrict: '', citIssuedDate: '', passportNo: '', panNo: '',
  // Address
  province: '', district: '', munVDC: '', wardNo: '', tole: '',
  tmpProvince: '', tmpDistrict: '', tmpMunVDC: '', tmpWardNo: '', tmpTole: '',
  // Family
  fatherName: '', motherName: '', grandFatherName: '', fatherInLawName: '', maritalStatus: '', spouseName: '',
  // Photos and map
  photoIm: null, signIm: null, lat: 0, lng: 0,
});

// One validation schema per step (steps 4 and 5 have none)
const SCHEMAS = {
  1: Yup.object().shape({
    memberNo: Yup.string().required('सदस्य नं. आवश्यक छ'),
    fullName: Yup.string().required('पुरा नाम आवश्यक छ'),
    fullNameEng: Yup.string().required('अंग्रेजीमा नाम आवश्यक छ'),
    gender: Yup.string().required('लिङ्ग चयन गर्नुहोस्'),
    dob: Yup.string().required('जन्म मिति आवश्यक छ'),
    mobileNo: Yup.string().required('मोबाइल नं. आवश्यक छ'),
    email: Yup.string().email('Invalid Email!').required('इमेल आवश्यक छ'),
    citizenshipNo: Yup.string().required('नागरिकता नं. आवश्यक छ'),
    citIssuedDistrict: Yup.string().required('जिल्ला आवश्यक छ'),
    citIssuedDate: Yup.string().required('जारी मिति आवश्यक छ'),
    panNo: Yup.string().required('प्यान नं. आवश्यक छ'),
  }),
  2: Yup.object().shape({
    province: Yup.string().required('प्रदेश आवश्यक छ'),
    district: Yup.string().required('जिल्ला आवश्यक छ'),
    munVDC: Yup.string().required('न.पा./गा.पा. आवश्यक छ'),
    wardNo: Yup.string().required('वडा नं. आवश्यक छ'),
    tole: Yup.string().required('टोल आवश्यक छ'),
    tmpProvince: Yup.string().required('प्रदेश आवश्यक छ'),
    tmpDistrict: Yup.string().required('जिल्ला आवश्यक छ'),
    tmpMunVDC: Yup.string().required('न.पा./गा.पा. आवश्यक छ'),
    tmpWardNo: Yup.string().required('वडा नं. आवश्यक छ'),
    tmpTole: Yup.string().required('टोल आवश्यक छ'),
  }),
  3: Yup.object().shape({
    fatherName: Yup.string().required('बुबाको नाम आवश्यक छ'),
    motherName: Yup.string().required('आमाको नाम आवश्यक छ'),
    grandFatherName: Yup.string().required('हजुरबुबाको नाम आवश्यक छ'),
    maritalStatus: Yup.string().required('वैवाहिक स्थिति चयन गर्नुहोस्'),
  }),
};

function Stepper({ step }) {
  return (
    <ol className="mb-8 flex" aria-label="Registration steps">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const current = step === n;
        return (
          <li key={n} className="relative flex flex-1 flex-col items-center" aria-current={current ? 'step' : undefined}>
            {i > 0 && <span className={`absolute -left-1/2 top-4 h-0.5 w-full ${step >= n ? 'bg-ledger' : 'bg-rule'}`} />}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                done || current ? 'bg-ledger text-white' : 'border border-rule bg-white text-slate-500'
              } ${current ? 'ring-2 ring-ledger ring-offset-2' : ''}`}
            >
              {done ? <Check size={16} /> : n}
            </span>
            <span className={`mt-2 hidden px-1 text-center text-xs sm:block ${current ? 'font-medium text-ink' : 'text-slate-500'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function MemberRegistration() {
  const user = useSelector((s) => s.auth.user);
  const branchId = branchIdOf(user);

  const [step, setStep] = useState(1);
  const [memberNo, setMemberNo] = useState(null); // null while the next number loads
  const [formKey, setFormKey] = useState(0); // changing it gives the next registration a fresh form
  const [error, setError] = useState('');

  const loadMemberNo = useCallback(() => {
    setMemberNo(null);
    membersApi.nextMemberNo(branchId).then(setMemberNo).catch(() => setMemberNo('')); // the field stays editable
  }, [branchId]);

  useEffect(() => { loadMemberNo(); }, [loadMemberNo]);

  const submit = async (values, { resetForm, setTouched, setErrors }) => {
    if (step < SAVE_STEP) {
      // Formik marks every field as touched on submit; clear that so the next step starts without red errors
      setTouched({}, false);
      setErrors({});
      setStep(step + 1);
      return;
    }
    setError('');
    try {
      await membersApi.create(values, branchId);
      resetForm();
      setStep(6);
    } catch (e) {
      setError(errorMessage(e, 'Unable to save detail!'));
    }
  };

  const registerAnother = () => {
    setError('');
    setStep(1);
    setFormKey((k) => k + 1);
    loadMemberNo();
  };

  return (
    <>
      <PageHeader title="सदस्य दर्ता फारम" subtitle="Fill in each step. The member will wait for approval after saving.">
        <Link to="/membership" className="btn-secondary"><ArrowLeft size={16} />सदस्य सूची</Link>
      </PageHeader>

      <div className="panel p-6">
        <Stepper step={step} />

        {error && <p role="alert" className="mb-5 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>}

        {memberNo === null ? (
          <p className="py-10 text-center text-sm text-slate-500">Preparing the form…</p>
        ) : (
          <Formik key={formKey} initialValues={blankValues(memberNo)} validationSchema={SCHEMAS[step]} onSubmit={submit}>
            {({ isSubmitting, values, errors, touched, handleChange, setFieldValue }) => {
              const shared = { values, errors, touched, handleChange, setFieldValue };
              return (
                <Form noValidate>
                  {step === 1 && <PersonalDetails {...shared} />}
                  {step === 2 && <AddressDetails {...shared} />}
                  {step === 3 && <FamilyDetails {...shared} />}
                  {step === 4 && <MemberDocs {...shared} />}
                  {step === 5 && <MemLocation {...shared} />}
                  {step === 6 && <CompletionStep resetRegistrationForm={registerAnother} />}

                  {step < 6 && (
                    <div className="mt-8 flex justify-end gap-3 border-t border-rule pt-5">
                      {step > 1 && (
                        <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
                          <ChevronLeft size={16} />पछाडि
                        </button>
                      )}
                      <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        {step === SAVE_STEP ? 'सेभ गर्नुहोस्' : 'अर्को'}
                      </button>
                    </div>
                  )}
                </Form>
              );
            }}
          </Formik>
        )}
      </div>
    </>
  );
}
