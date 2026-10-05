import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice';
import Logo from '../components/Logo';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  if (token) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) navigate('/', { replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <span className="text-xl font-semibold">DMS</span>
        </div>
        <div>
          <h1 className="max-w-md font-serif text-4xl leading-tight">Every loan document, checked before it is printed.</h1>
          <p className="mt-4 max-w-md text-slate-300">
            Operators enter the details. Admins verify them. Only approved documents reach the printer.
          </p>
        </div>
        <p className="text-sm text-slate-400">Document Management System for loan processing</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-slate-600">Use the account your administrator created for you.</p>

          {error && (
            <p role="alert" className="mt-5 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>
          )}

          <div className="mt-6">
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" autoComplete="username" className="field" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="mt-4">
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" autoComplete="current-password" className="field" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>

          <div className="mt-8 rounded-md border border-rule bg-white p-3 text-xs text-slate-600">
            <p className="font-medium text-ink">Development logins (password: Password@123)</p>
            <p className="mt-1">operator@dms.local · admin@dms.local · administrator@dms.local</p>
          </div>
        </form>
      </div>
    </div>
  );
}
