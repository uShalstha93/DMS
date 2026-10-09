import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import { NepaliInput } from '@itzsa/nepali-input';
import FormField, { bindField } from '../../components/FormField';
import { selectCan } from '../../store/authSlice';

const schema = Yup.object().shape({
  name: Yup.string().trim().required('नाम आवश्यक छ'),
  name_eng: Yup.string().trim().required('अंग्रेजीमा नाम आवश्यक छ'),
  post: Yup.string().trim().required('पद आवश्यक छ'),
  mobileno: Yup.string().trim()
    .matches(/^[0-9०-९+\-\s]{7,20}$/, 'मान्य मोबाइल नं. राख्नुहोस्')
    .required('मोबाइल नं. आवश्यक छ'),
  email: Yup.string().trim().email('Invalid Email!'),
  address: Yup.string(),
});

export default function StaffForm() {
  const { staffNo } = useParams(); // present when editing
  const editing = !!staffNo;
  const navigate = useNavigate();
  const myBranch = useSelector((s) => s.auth.user?.branch);
  const allBranches = useSelector(selectCan('branch.access_all'));

  const [initial, setInitial] = useState(
    editing ? null : { name: '', name_eng: '', post: '', mobileno: '', email: '', address: '', branch_id: myBranch?.id ?? '' }
  );
  const [staff, setStaff] = useState(null); // the record being edited
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    api.get(`/staff/${staffNo}`)
      .then(({ data }) => {
        const s = data.staff;
        setStaff(s);
        setInitial({ name: s.name || '', name_eng: s.name_eng || '', post: s.post || '', mobileno: s.mobileno || '', email: s.email || '', address: s.address || '', branch_id: s.branch_id });
      })
      .catch((e) => setError(errorMessage(e, 'Unable to load staff')));
  }, [editing, staffNo]);

  // People who work in every branch can choose the branch of a new staff member
  useEffect(() => {
    if (allBranches && !editing) api.get('/auth/branches').then(({ data }) => setBranches(data.branches)).catch(() => { });
  }, [allBranches, editing]);

  const submit = async (values, { setErrors }) => {
    setError('');
    try {
      const { data } = editing ? await api.put(`/staff/${staffNo}`, values) : await api.post('/staff', values);
      navigate('/staff', {
        state: { message: editing ? `${data.staff.name_eng} was updated.` : `${data.staff.name_eng} was added with staff number ${data.staff.staffno}.` },
      });
    } catch (e) {
      setErrors(e.response?.data?.errors || {});
      setError(errorMessage(e, 'Unable to save'));
    }
  };

  const branchName = editing ? staff?.branch_name : myBranch?.name;

  return (
    <>
      <PageHeader title={editing ? 'कर्मचारी विवरण सच्याउनुहोस्' : 'नयाँ कर्मचारी दर्ता'}
        subtitle={editing ? `Staff number ${staffNo}` : 'The staff number is created automatically when you save.'}>
        <Link to="/staff" className="btn-secondary"><ArrowLeft size={16} />कर्मचारी सूची</Link>
      </PageHeader>

      <div className="panel p-6">
        {error && <p role="alert" className="mb-5 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>}

        {!initial ? (
          !error && <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : (
          <Formik initialValues={initial} validationSchema={schema} onSubmit={submit}>
            {({ values, errors, touched, handleChange, isSubmitting }) => {
              const f = { touched, errors };
              const bind = bindField(touched, errors);
              return (
                <Form noValidate>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <FormField label="नाम" name="name" {...f}>
                      <NepaliInput {...bind('name')} type="text" placeholder="नाम" value={values.name}
                        onChange={handleChange} className={`${bind('name').className} !text-[14px] h-10`}
                      />
                    </FormField>
                    <FormField label="नाम (अंग्रेजीमा)" name="name_eng" {...f}>
                      <input {...bind('name_eng')} type="text" placeholder="Name in English" value={values.name_eng}
                        onChange={handleChange} className={`${bind('name_eng').className} !text-[14px] h-10`} />
                    </FormField>
                    <FormField label="पद" name="post" {...f}>
                      <select {...bind('post')} value={values.post} onChange={handleChange}>
                        <option>-- छान्नुहोस् --</option>
                        <option value="ऋण बिभाग प्रमुख">ऋण बिभाग प्रमुख</option>
                        <option value="व्यवस्थापक">व्यवस्थापक</option>
                        <option value="ऋण उपसमिति संयोजक">ऋण उपसमिति संयोजक</option>
                        <option value="अध्यक्ष">अध्यक्ष</option>
                        <option value="कार्यलय प्रमुख">कार्यलय प्रमुख</option>
                        <option value="कर्मचारी">कर्मचारी</option>
                      </select>
                      {/* <NepaliInput {...bind('post')} type="text" placeholder="पद" value={values.post}
                        onChange={handleChange} className={`${bind('post').className} !text-[14px] h-10`} /> */}
                    </FormField>
                    <FormField label="मोबाइल नं." name="mobileno" {...f}>
                      <NepaliInput {...bind('mobileno')} type="text" placeholder="मोबाइल नं." value={values.mobileno}
                        onChange={handleChange} className={`${bind('mobileno').className} !text-[14px] h-10`} />
                    </FormField>
                    <FormField label="इमेल" name="email" {...f}>
                      <input {...bind('email')} type="text" placeholder="इमेल" value={values.email}
                        onChange={handleChange} className={`${bind('email').className} !text-[14px] h-10`} />
                    </FormField>
                    <FormField label="ठेगाना" name="address" {...f}>
                      <NepaliInput {...bind('address')} type="text" placeholder="ठेगाना" value={values.address}
                        onChange={handleChange} className={`${bind('address').className} !text-[14px] h-10`} />
                    </FormField>

                    {allBranches && !editing ? (
                      <FormField label="शाखा" name="branch_id" {...f}>
                        <select {...bind('branch_id')} value={values.branch_id} onChange={handleChange}>
                          {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                        </select>
                      </FormField>
                    ) : (
                      <div>
                        <p className="label">शाखा</p>
                        <div className="field bg-paper text-slate-700">{branchName || '—'}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex justify-end gap-3 border-t border-rule pt-5">
                    <Link to="/staff" className="btn-secondary hover:bg-red-500 hover:text-white">रद्द गर्नुहोस्</Link>
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
      </div>
    </>
  );
}
