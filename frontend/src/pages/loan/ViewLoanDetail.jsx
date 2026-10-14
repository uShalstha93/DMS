import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Pencil } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { errorMessage } from '../../api/axios';
import { loansApi } from '../../api/loans';

function Section({ title, children }) {
  return (
    <section className="panel px-6 py-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
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

function YesNo({ value }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${value ? 'bg-ledger-tint text-ledger-dark' : 'bg-paper text-slate-500'}`}>
      {value ? 'छ' : 'छैन'}
    </span>
  );
}

export default function ViewLoanDetail() {
  const { loanNo } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loan.approve');

  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = useCallback(() => {
    loansApi
      .get(loanNo)
      .then(setLoan)
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e, 'Unable to load loan detail') }))
      .finally(() => setLoading(false));
  }, [loanNo]);

  useEffect(() => { load(); }, [load]);

  const approve = async () => {
    setBusy(true);
    try {
      await loansApi.approve(loan.LoanNo);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'ऋण सफलतापूर्वक स्वीकृत भयो।' });
      load();
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'Unable to approve loan') });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading loan…</p>;

  const approved = loan?.ApprovedStatus === 1;
  const l = loan;

  return (
    <>
      <PageHeader title="ऋण विवरण" subtitle={`Loan Information · ऋण नं. ${loanNo}`}>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />Back
        </button>
        {l?.can_edit && (
          <Link to={`/loan/detail/edit/${l.LoanNo}`} className="btn-secondary">
            <Pencil size={16} />विवरण परिवर्तन गर्नुहोस्
          </Link>
        )}
      </PageHeader>

      {message.text && (
        <p
          role="alert"
          className={`mb-4 rounded-md px-3 py-2 text-sm ${
            message.type === 'ok' ? 'bg-ledger-tint text-ledger-dark' : 'bg-stamp-tint text-stamp'
          }`}
        >
          {message.text}
        </p>
      )}

      {l && (
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          {/* ── Left column ────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Basic Info */}
            <Section title="१. आधारभूत जानकारी">
              <dl>
                <Item label="ऋण नं.">{l.LoanNo}</Item>
                <Item label="सदस्य नं.">{l.MemberNo}</Item>
                <Item label="सदस्यको नाम">{l.MemberName}</Item>
                <Item label="ऋणको प्रकार">{l.LoanType}</Item>
                <Item label="ऋण रकम">रू {l.LoanAmount}</Item>
                <Item label="ऋणको उद्देश्य">{l.LoanPurpose}</Item>
                <Item label="दर्ता मिति">{l.EntryDate}</Item>
                <Item label="व्यवसाय"><YesNo value={l.HasBusiness} /></Item>
                {l.HasBusiness ? (
                  <>
                    <Item label="व्यापार PAN">{l.BusinessPAN}</Item>
                    <Item label="व्यवसायको नाम">{l.BusinessName}</Item>
                    <Item label="आयको स्रोत">{l.IncomeSource}</Item>
                    <Item label="आय (रू)">{l.IncomeSourceRs}</Item>
                  </>
                ) : null}
              </dl>
            </Section>

            {/* Loan Terms */}
            <Section title="२. ऋणको शर्तहरू">
              <dl>
                <Item label="ब्याजदर"><YesNo value={l.HasRateOfInterest} /></Item>
                {l.HasRateOfInterest ? <Item label="ब्याजदर (%)">{l.RateOfInterest}</Item> : null}
                <Item label="ऋण अवधि (वर्ष)">{l.LoanPeriodYear}</Item>
                <Item label="ऋण अवधि (महिना)">{l.LoanPeriodMonth}</Item>
                <Item label="किस्ता">{l.LoanKista}</Item>
              </dl>
            </Section>

            {/* Deposit Jamani */}
            <Section title="३. निक्षेप जमानी विवरण">
              <dl>
                <Item label="निक्षेप जमानी"><YesNo value={l.HasDepositJamani} /></Item>
                {l.HasDepositJamani ? (
                  <>
                    <Item label="जमानकर्ता सदस्य नं.">{l.JamaniMemberNo}</Item>
                    <Item label="जमानकर्ताको नाम">{l.JamaniName}</Item>
                    <Item label="बाजेको नाम">{l.JamaniGrandFatherName}</Item>
                    <Item label="बुबाको नाम">{l.JamaniFatherName}</Item>
                    <Item label="पति/पत्नीको नाम">{l.JamaniSpouseName}</Item>
                    <Item label="जन्म मिति">{l.JamaniDOB}</Item>
                    <Item label="प्रदेश">{l.JamaniProvince}</Item>
                    <Item label="जिल्ला">{l.JamaniDistrict}</Item>
                    <Item label="न.पा./गा.पा.">{l.JamaniVDCMUN}</Item>
                    <Item label="वडा नं.">{l.JamaniWardNo}</Item>
                    <Item label="जमानीको प्रकार">{l.JamaniType}</Item>
                    <Item label="जमानी रकम (रू)">{l.JamaniTypeRs}</Item>
                  </>
                ) : null}
              </dl>
            </Section>

            {/* Dhito Jamani */}
            <Section title="४. धितो जमानी विवरण">
              <dl>
                <Item label="धितो जमानी"><YesNo value={l.HasDhitoJamani} /></Item>
              </dl>
              {l.HasDhitoJamani && l.dhitoItems?.length > 0 && (
                <div className="mt-3 space-y-3">
                  {l.dhitoItems.map((d, i) => (
                    <div key={d.id ?? i} className="rounded-lg border border-rule bg-paper px-4 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">धितो #{i + 1}</p>
                      <dl>
                        <Item label="धितोको व्यक्ति">{d.DhitoPerson}</Item>
                        <Item label="बुबाको नाम">{d.DhitoFather}</Item>
                        <Item label="पति/पत्नीको नाम">{d.DhitoSpouse}</Item>
                        <Item label="धितोको प्रकार">{d.DhitoType}</Item>
                        <Item label="प्रदेश">{d.DhitoProvince}</Item>
                        <Item label="जिल्ला">{d.DhitoDistrict}</Item>
                        <Item label="न.पा./गा.पा.">{d.DhitoVDCMUN}</Item>
                        <Item label="वडा नं.">{d.DhitoWardNo}</Item>
                        <Item label="ब्लक नं.">{d.DhitoBlockNo}</Item>
                        <Item label="किट्टा नं.">{d.DhitoKittaNo}</Item>
                        <Item label="क्षेत्रफल">{d.DhitoArea}</Item>
                        <Item label="कैफियत">{d.Remarks}</Item>
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Sakshi */}
            <Section title="५. साक्षी विवरण">
              <dl>
                <Item label="साक्षी"><YesNo value={l.HasSakshi} /></Item>
              </dl>
              {l.HasSakshi && l.sakshiItems?.length > 0 && (
                <div className="mt-3 space-y-3">
                  {l.sakshiItems.map((s, i) => (
                    <div key={s.id ?? i} className="rounded-lg border border-rule bg-paper px-4 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">साक्षी #{i + 1}</p>
                      <dl>
                        <Item label="साक्षीको नाम">{s.SakshiPerson}</Item>
                        <Item label="उमेर">{s.SakshiAge}</Item>
                        <Item label="प्रदेश">{s.SakshiProvince}</Item>
                        <Item label="जिल्ला">{s.SakshiDistrict}</Item>
                        <Item label="न.पा./गा.पा.">{s.SakshiVDCMUN}</Item>
                        <Item label="वडा नं.">{s.SakshiWardNo}</Item>
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* ── Right sidebar ───────────────────────────────────── */}
          <aside className="space-y-4">
            <Section title="अन्य विवरण">
              <dl>
                <Item label="Status">
                  <StatusBadge status={approved ? 'APPROVED' : 'PENDING'} />
                </Item>
                <Item label="शाखा">{l.branch_name || l.BranchID}</Item>
                <Item label="दर्ता मिति">{l.EntryDate}</Item>
                {approved && <Item label="Approved by">{l.ApprovedBy}</Item>}
              </dl>

              {canApprove && !approved && !confirming && (
                <button className="btn-primary mt-4 w-full" onClick={() => setConfirming(true)}>
                  <Check size={16} />Click To Approve
                </button>
              )}
              {confirming && (
                <div className="mt-4 rounded-md bg-amber-tint p-3">
                  <p className="text-sm font-medium">यो ऋण स्वीकृत गर्ने?</p>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-primary" disabled={busy} onClick={approve}>
                      Yes, approve
                    </button>
                    <button className="btn-secondary" disabled={busy} onClick={() => setConfirming(false)}>
                      Cancel
                    </button>
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

