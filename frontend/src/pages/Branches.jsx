import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/axios';
import PageHeader from '../components/PageHeader';

const EMPTY = { code: '', name: '', address: '', phone: '' };

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = useCallback(() => {
    api.get('/branches').then(({ data }) => setBranches(data.branches))
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e) }));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (b) => {
    try {
      await api.patch(`/branches/${b.id}`, { is_active: !b.is_active });
      setMessage({ type: '', text: '' });
      load();
    } catch (e) { setMessage({ type: 'error', text: errorMessage(e) }); }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/branches', form);
      setForm(EMPTY);
      setMessage({ type: 'ok', text: 'Branch added. It now appears on the login page.' });
      load();
    } catch (err) { setMessage({ type: 'error', text: errorMessage(err) }); }
  };

  return (
    <>
      <PageHeader title="Branches" subtitle="Staff sign in to a branch, and documents belong to the branch they were entered in." />

      {message.text && (
        <p role="alert" className={`mb-4 rounded-md px-3 py-2 text-sm ${message.type === 'ok' ? 'bg-ledger-tint text-ledger-dark' : 'bg-stamp-tint text-stamp'}`}>
          {message.text}
        </p>
      )}

      <div className="panel mb-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-rule bg-paper text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 text-right font-medium">Users</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-b border-rule last:border-0">
                <td className="px-4 py-3 font-medium tabular-nums">{b.code}</td>
                <td className="px-4 py-3">{b.name}</td>
                <td className="px-4 py-3">{b.address || '—'}</td>
                <td className="px-4 py-3">{b.phone || '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums">{b.user_count}</td>
                <td className="px-4 py-3">
                  <button className={b.is_active ? 'btn-secondary' : 'btn-primary'} onClick={() => toggle(b)}>
                    {b.is_active ? 'Switch off' : 'Switch on'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={create} className="panel max-w-3xl p-6">
        <h2 className="font-semibold">Add a branch</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="code" className="label">Branch code</label>
            <input id="code" className="field" value={form.code} maxLength={10} placeholder="e.g. 004"
              onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <p className="mt-1 text-xs text-slate-500">Used at the start of member numbers. It cannot be changed later.</p>
          </div>
          <div>
            <label htmlFor="bname" className="label">Branch name</label>
            <input id="bname" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="address" className="label">Address</label>
            <input id="address" className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone</label>
            <input id="phone" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <button className="btn-primary mt-5">Add branch</button>
      </form>
    </>
  );
}
