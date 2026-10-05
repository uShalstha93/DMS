import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api, { errorMessage } from '../api/axios';
import PageHeader from '../components/PageHeader';
import { fetchStats } from '../store/documentsSlice';
import { LOAN_TYPES } from '../utils/format';

const EMPTY = {
  loan_account_no: '', customer_name: '', loan_type: '', loan_amount: '', interest_rate: '',
  tenure_months: '', branch: '', purpose: '', remarks: '',
};

function Field({ label, name, form, setForm, errors, type = 'text', children, ...rest }) {
  const err = errors[name];
  const props = {
    id: name, value: form[name] ?? '', 'aria-invalid': !!err, 'aria-describedby': err ? `${name}-err` : undefined,
    className: `field ${err ? 'field-error' : ''}`,
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
    ...rest,
  };
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      {type === 'select' ? <select {...props}>{children}</select>
        : type === 'textarea' ? <textarea rows={3} {...props} />
        : <input type={type} {...props} />}
      {err && <p id={`${name}-err`} className="mt-1 text-sm text-stamp">{err}</p>}
    </div>
  );
}

export default function DocumentForm() {
  const { id } = useParams(); // present when correcting a rejected document
  const editing = !!id;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/documents/${id}`)
      .then(({ data }) => {
        if (data.document.status !== 'REJECTED') return navigate(`/documents/${id}`, { replace: true });
        setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(data.document).map(([k, v]) => [k, v ?? ''])) });
      })
      .catch((e) => setMessage(errorMessage(e)));
  }, [editing, id, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErrors({}); setMessage('');
    try {
      const { data } = editing ? await api.put(`/documents/${id}`, form) : await api.post('/documents', form);
      dispatch(fetchStats());
      navigate(`/documents/${data.document.id}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setMessage(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const shared = { form, setForm, errors };

  return (
    <>
      <PageHeader
        title={editing ? 'Correct and resubmit' : 'New loan document'}
        subtitle={editing ? 'Fix the issues from the review, then send it back for approval.' : 'An admin will verify this before it can be printed.'}
      />
      <form onSubmit={submit} noValidate className="panel max-w-3xl p-6">
        {message && <p role="alert" className="mb-5 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{message}</p>}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Customer name" name="customer_name" {...shared} />
          <Field label="Loan account number" name="loan_account_no" {...shared} />
          <Field label="Loan type" name="loan_type" type="select" {...shared}>
            <option value="">Choose a type</option>
            {LOAN_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Field>
          <Field label="Branch" name="branch" {...shared} />
          <Field label="Loan amount" name="loan_amount" type="number" min="0" step="0.01" {...shared} />
          <Field label="Interest rate (% per year)" name="interest_rate" type="number" min="0" step="0.01" {...shared} />
          <Field label="Tenure (months)" name="tenure_months" type="number" min="1" step="1" {...shared} />
          <Field label="Purpose" name="purpose" {...shared} />
        </div>
        <div className="mt-5">
          <Field label="Remarks" name="remarks" type="textarea" {...shared} />
        </div>

        <div className="mt-6 flex gap-3">
          <button className="btn-primary" disabled={saving}>
            {saving ? 'Sending…' : editing ? 'Resubmit for approval' : 'Submit for approval'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </>
  );
}
