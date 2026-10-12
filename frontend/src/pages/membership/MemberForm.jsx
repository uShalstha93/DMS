import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import PersonalDetails from './PersonalDetails';
import AddressDetails from './AddressDetails';
import FamilyDetails from './FamilyDetails';
import MemberDocs from './MemberDocs';
import { membersApi } from '../../api/members';
import { blankValues, toFormValues } from '../../utils/memberFields';
import { selectCan } from '../../store/authSlice';

const MemLocation = lazy(() => import('./MemLocation')); // the map loads only when opened
const IMG_URL = import.meta.env.VITE_IMG_URL;

const required = (message) => Yup.string().trim().required(message);
const schema = Yup.object().shape({
  fullName: required('पुरा नाम आवश्यक छ'),
  fullNameEng: required('अंग्रेजीमा नाम आवश्यक छ'),
  gender: required('लिङ्ग चयन गर्नुहोस्'),
  dob: required('जन्म मिति आवश्यक छ'),
  mobileNo: Yup.string().trim()
    .matches(/^[0-9०-९+\-\s]{7,20}$/, 'मान्य मोबाइल नं. राख्नुहोस्')
    .required('मोबाइल नं. आवश्यक छ'),
  email: Yup.string().trim().email('Invalid Email!'),
  citizenshipNo: required('नागरिकता नं. आवश्यक छ'),
  province: required('प्रदेश आवश्यक छ'),
  district: required('जिल्ला आवश्यक छ'),
  munVDC: required('न.पा./गा.पा. आवश्यक छ'),
  wardNo: required('वडा नं. आवश्यक छ'),
});

// After pressing Save with mistakes, jump to the first field that needs fixing
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

export default function MemberForm() {
  const { memberNo } = useParams(); // present when editing
  const editing = !!memberNo;
  const navigate = useNavigate();
  const myBranch = useSelector((s) => s.auth.user?.branch);
  const allBranches = useSelector(selectCan('branch.access_all'));

  const [initial, setInitial] = useState(editing ? null : { ...blankValues(), branch_id: myBranch?.id ?? '' });
  const [member, setMember] = useState(null); // the saved member when editing
  const [branches, setBranches] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    membersApi.get(memberNo)
      .then((m) => {
        if (!m.can_edit) return navigate(`/membership/${memberNo}`, { replace: true });
        setMember(m);
        setInitial(toFormValues(m));
        setShowMap(!!(m.Latitude && m.Longitude));
      })
      .catch((e) => setError(errorMessage(e, 'Unable to load the member')));
  }, [editing, memberNo, navigate]);

  // People who work in every branch can choose the branch of a new member
  useEffect(() => {
    if (allBranches && !editing) api.get('/auth/branches').then(({ data }) => setBranches(data.branches)).catch(() => {});
  }, [allBranches, editing]);

  const submit = async (values, { setErrors }) => {
    setError('');
    try {
      const saved = await membersApi.save(values, editing ? memberNo : null);
      navigate('/membership', {
        state: { message: editing ? `${saved.FullNameEng} was updated.` : `${saved.FullNameEng} was registered with member number ${saved.MemberNo}.` },
      });
    } catch (e) {
      setErrors(e.response?.data?.errors || {});
      setError(errorMessage(e, 'Unable to save the member'));
    }
  };

  const existing = member && {
    photo: member.PhotoIm ? `${IMG_URL}/membership/photo/${member.PhotoIm}` : null,
    sign: member.SignIm ? `${IMG_URL}/membership/signature/${member.SignIm}` : null,
  };

  return (
    <>
      <PageHeader
        title={editing ? 'सदस्य विवरण सच्याउनुहोस्' : 'नयाँ सदस्य दर्ता'}
        subtitle={editing ? `सदस्य नं. ${memberNo}` : 'The member number is created automatically when you save. Fields marked * are required.'}
      >
        <Link to={editing ? `/membership/${memberNo}` : '/membership'} className="btn-secondary"><ArrowLeft size={16} />फर्कनुहोस्</Link>
      </PageHeader>

      {error && <p role="alert" className="mb-4 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>}

      {!initial ? (
        !error && <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <Formik initialValues={initial} validationSchema={schema} onSubmit={submit}>
          {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => {
            const shared = { values, errors, touched, handleChange, setFieldValue };
            return (
              <Form noValidate className="space-y-6">
                <ScrollToError />

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-slate-600">शाखा:</span>
                  {allBranches && !editing ? (
                    <select className="field !w-auto" value={values.branch_id} onChange={handleChange} name="branch_id" aria-label="Branch">
                      {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                    </select>
                  ) : (
                    <span className="font-medium">{editing ? member?.branch_name : myBranch?.name}</span>
                  )}
                </div>

                <div className="panel p-6"><PersonalDetails {...shared} /></div>
                <div className="panel p-6"><AddressDetails {...shared} /></div>
                <div className="panel p-6"><FamilyDetails {...shared} /></div>
                <div className="panel p-6"><MemberDocs {...shared} existing={existing || {}} /></div>

                <div className="panel p-6">
                  <h2 className="mb-1 text-lg font-semibold">५. नक्सामा स्थान (वैकल्पिक)</h2>
                  <p className="mb-4 text-sm text-slate-600">You can skip this. Open the map only if you want to mark the house location.</p>
                  {showMap ? (
                    <Suspense fallback={<p className="text-sm text-slate-500">Loading map…</p>}>
                      <MemLocation {...shared} />
                    </Suspense>
                  ) : (
                    <button type="button" className="btn-secondary" onClick={() => setShowMap(true)}><MapPin size={16} />नक्सा खोल्नुहोस्</button>
                  )}
                </div>

                {/* Always visible while you scroll */}
                <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-rule bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
                  <Link to={editing ? `/membership/${memberNo}` : '/membership'} className="btn-secondary">रद्द गर्नुहोस्</Link>
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
