import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api, { errorMessage } from '../api/axios';
import PageHeader from '../components/PageHeader';
import { date } from '../utils/format';

export default function Users() {
  const me = useSelector((s) => s.auth.user);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '', branch_id: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = useCallback(() => {
    api.get('/users').then(({ data }) => { setUsers(data.users); setRoles(data.roles); setBranches(data.branches); })
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e) }));
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = async (id, patch) => {
    try { await api.patch(`/users/${id}`, patch); setMessage({ type: '', text: '' }); load(); }
    catch (e) { setMessage({ type: 'error', text: errorMessage(e) }); }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role_id: '', branch_id: '' });
      setMessage({ type: 'ok', text: 'User created. They can sign in to their branch now.' });
      load();
    } catch (err) { setMessage({ type: 'error', text: errorMessage(err) }); }
  };

  return (
    <>
      <PageHeader title="Users and roles" subtitle="The role decides what a person can do. The branch decides where they can sign in." />

      {message.text && (
        <p role="alert" className={`mb-4 rounded-md px-3 py-2 text-sm ${message.type === 'ok' ? 'bg-ledger-tint text-ledger-dark' : 'bg-stamp-tint text-stamp'}`}>
          {message.text}
        </p>
      )}

      <div className="panel mb-6 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-rule bg-paper text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Branch</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 font-medium">Access</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-rule last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <select className="field !w-auto" value={u.role_id} disabled={u.id === me.id}
                    onChange={(e) => update(u.id, { role_id: Number(e.target.value) })} aria-label={`Role for ${u.name}`}>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select className="field !w-auto" value={u.branch_id} disabled={u.id === me.id}
                    onChange={(e) => update(u.id, { branch_id: Number(e.target.value) })} aria-label={`Branch for ${u.name}`}>
                    {branches.filter((b) => b.is_active || b.id === u.branch_id).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">{date(u.created_at)}</td>
                <td className="px-4 py-3">
                  <button className={u.is_active ? 'btn-secondary' : 'btn-primary'} disabled={u.id === me.id}
                    onClick={() => update(u.id, { is_active: !u.is_active })}>
                    {u.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={create} className="panel max-w-3xl p-6">
        <h2 className="font-semibold">Add a user</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="n" className="label">Full name</label>
            <input id="n" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label htmlFor="e" className="label">Email</label>
            <input id="e" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label htmlFor="p" className="label">Temporary password</label>
            <input id="p" type="password" autoComplete="new-password" className="field" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div><label htmlFor="r" className="label">Role</label>
            <select id="r" className="field" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
              <option value="">Choose a role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select></div>
          <div><label htmlFor="b" className="label">Branch</label>
            <select id="b" className="field" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
              <option value="">Choose a branch</option>
              {branches.filter((b) => b.is_active).map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select></div>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {roles.find((r) => String(r.id) === String(form.role_id))?.description}
        </p>
        <button className="btn-primary mt-5">Add user</button>
      </form>
    </>
  );
}
