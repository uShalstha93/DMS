import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { errorMessage } from '../../api/axios';
import { membersApi } from '../../api/members';
import { convertTextToNepaliNumbers as toNepali } from '../../utils/NepaliConverter';

const IMG_URL = import.meta.env.VITE_IMG_URL;

function Section({ title, children }) {
  return (
    <section className="panel px-6 py-5">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Item({ label, children }) {
  return (
    <div className="border-b border-rule py-2.5 last:border-0 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="text-sm font-medium">{children || '—'}</dd>
    </div>
  );
}

function Picture({ src, alt, empty }) {
  return (
    <div className="text-center">
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-md border border-rule bg-paper">
        {src ? (
          <img src={src} alt={alt} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <span className="text-sm text-slate-500">{empty}</span>
        )}
      </div>
      <p className="mt-1.5 text-xs font-medium">{alt}</p>
    </div>
  );
}

const ADDRESS_ROWS = [
  ['प्रदेश', 'Province', 'TmpProvince'],
  ['जिल्ला', 'District', 'TmpDistrict'],
  ['न.पा./गा.पा.', 'MUNVDC', 'TmpMUNVDC'],
  ['वडा नं.', 'WardNo', 'TmpWardNo'],
  ['टोल', 'Tole', 'TmpTole'],
];

export default function ViewMemberDetail() {
  const { memberNo } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('membership.approve');

  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = useCallback(() => {
    membersApi
      .get(memberNo)
      .then(setM)
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e, 'Unable to get data from server!') }))
      .finally(() => setLoading(false));
  }, [memberNo]);

  useEffect(() => { load(); }, [load]);

  const approve = async () => {
    setBusy(true);
    try {
      await membersApi.approve(m.MemberNo);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'Member approved successfully.' });
      load();
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'Unable to save detail!') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await membersApi.remove(m.MemberNo);
      navigate('/membership', { state: { message: `${m.FullNameEng || m.MemberNo} was deleted.` } });
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'Unable to delete') });
      setDeleting(false);
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading member…</p>;

  const approved = m?.ApprovedStatus === 1;

  return (
    <>
      <PageHeader title="सदस्यको विवरण" subtitle={`Member Information · सदस्य नं. ${memberNo}`}>
        <button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} />Back</button>
        {m?.can_edit && <Link to={`/membership/edit/${m.MemberNo}`} className="btn-secondary"><Pencil size={16} />विवरण परिवर्तन गर्नुहोस</Link>}
        {/* {m?.can_delete && !deleting && (
          <button className="btn-secondary text-stamp" onClick={() => setDeleting(true)}><Trash2 size={16} />Delete</button>
        )}
        {deleting && (
          <span className="inline-flex items-center gap-2 rounded-md bg-stamp-tint px-3 py-1.5 text-sm">
            Delete this member?
            <button className="btn-danger !px-2 !py-1" disabled={busy} onClick={remove}>Yes, delete</button>
            <button className="btn-secondary !px-2 !py-1" disabled={busy} onClick={() => setDeleting(false)}>Cancel</button>
          </span>
        )} */}
      </PageHeader>

      {message.text && (
        <p role="alert" className={`mb-4 rounded-md px-3 py-2 text-sm ${message.type === 'ok' ? 'bg-ledger-tint text-ledger-dark' : 'bg-stamp-tint text-stamp'}`}>
          {message.text}
        </p>
      )}

      {m && (
        <div className="grid gap-4 lg:grid-cols-[1fr_23rem]">
          <div className="space-y-6">
            <Section title="व्यक्तिगत विवरण">
              <dl>
                <Item label="सदस्य नं.">{m.MemberNo}</Item>
                <Item label="पुरा नाम">{m.FullName}</Item>
                <Item label="पुरा नाम (अंग्रेजीमा)">{m.FullNameEng}</Item>
                <Item label="लिङ्ग">{m.Gender}</Item>
                <Item label="जन्म मिति">{toNepali(m.DOB)}</Item>
                <Item label="मोबाइल नम्बर">{m.MobileNo}</Item>
                <Item label="इमेल">{m.Email}</Item>
                <Item label="वैवाहिक स्थिति">{m.MaritalStatus}</Item>
                <Item label="नागरिकता नं.">{m.CitizenshipNo}</Item>
                <Item label="नागरिकता जारी जिल्ला">{m.CitIssuedDistrict}</Item>
                <Item label="नागरिकता जारी मिति">{toNepali(m.CitIssuedDate)}</Item>
                <Item label="पसस्पोर्ट नं.">{m.PassportNo}</Item>
                <Item label="पान नं.">{m.PanNo}</Item>
              </dl>
            </Section>

            <Section title="ठेगाना विवरण">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="border-b border-rule text-slate-600">
                    <tr>
                      <th className="py-2 font-medium"><span className="sr-only">Field</span></th>
                      <th className="py-2 font-medium">स्थायी ठेगाना</th>
                      <th className="py-2 font-medium">हालको ठेगाना</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ADDRESS_ROWS.map(([label, perm, temp]) => (
                      <tr key={perm} className="border-b border-rule last:border-0">
                        <td className="py-2.5 text-slate-600">{label}</td>
                        <td className="py-2.5 font-medium">{m[perm] || '—'}</td>
                        <td className="py-2.5 font-medium">{m[temp] || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="पारिवारिक विवरण">
              <dl>
                <Item label="बुबाको नाम">{m.FatherName}</Item>
                <Item label="आमाको नाम">{m.MotherName}</Item>
                <Item label="बाजेको नाम">{m.GrandfatherName}</Item>
                <Item label="पति/पत्नीको नाम">{m.SpouseName}</Item>
                <Item label="ससुराको नाम">{m.FatherInLaw}</Item>
              </dl>
            </Section>
          </div>

          <aside className="space-y-6">
            <section className="panel grid grid-cols-2 gap-4 p-5 lg:grid-cols-1">
              <Picture src={m.PhotoIm && `${IMG_URL}/membership/photo/${m.PhotoIm}`} alt="फोटो" empty="Profile Photo" />
              <Picture src={m.SignIm && `${IMG_URL}/membership/signature/${m.SignIm}`} alt="हस्ताक्षर" empty="Signature" />
            </section>

            <Section title="अन्य विवरण">
              <dl>
                <Item label="Status"><StatusBadge status={approved ? 'APPROVED' : 'PENDING'} /></Item>
                <Item label="शाखा">{m.branch_name || m.BranchID}</Item>
                {approved && <Item label="Approved by">{m.ApprovedBy}</Item>}
                <Item label="Entry date">{m.EntryDate?.split('T')[0]}</Item>
                <Item label="Last modified">{m.ModifiedDate?.split('T')[0]}</Item>
              </dl>

              {canApprove && !approved && !confirming && (
                <button className="btn-primary mt-4 w-full" onClick={() => setConfirming(true)}>
                  <Check size={16} />Click To Approve
                </button>
              )}
              {confirming && (
                <div className="mt-4 rounded-md bg-amber-tint p-3">
                  <p className="text-sm font-medium">Approve this member?</p>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-primary" disabled={busy} onClick={approve}>Yes, approve</button>
                    <button className="btn-secondary" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </Section>
          </aside>
        </div>
      )}
    </>
  );
}
