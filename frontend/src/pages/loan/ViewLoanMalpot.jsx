import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanMalpotApi } from '../../api/loanMalpot';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber, formatNepaliCurrency } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { date as formatDate } from '../../utils/format';

export default function ViewLoanMalpot() {
  const { id } = useParams();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loanmalpot.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanMalpotApi.get(id)
      .then(setData)
      .catch((e) => setMessage({ type: 'error', text: errorMessage(e, 'विवरण प्राप्त गर्न सकिएन') }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const approve = async () => {
    setBusy(true);
    try {
      await loanMalpotApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'मालपोत निवेदन सफलतापूर्वक प्रमाणित/स्वीकृत भयो।' });
      load();
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'स्वीकृत गर्न सकिएन') });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (message.type === 'error' && !data) return <p className="p-4 text-sm text-stamp">{message.text}</p>;
  if (!data) return null;

  const { malpotApplication: m, member: mem, loan: l, enterprise: ent, can_edit } = data;
  const isApproved = m.ApprovedStatus === 1;
  const loanWords = m.LoanAmountWords || (m.LoanAmount ? convertToNepaliWords(m.LoanAmount) : '');
  const orgName = ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.';
  const orgAddr = [
    ent?.munvdc || ent?.VDCMUN,
    ent?.wardno ? `- ${convertToNepaliNumber(ent.wardno)}` : '',
    ent?.district ? `, ${ent.district}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <PageHeader
        title={`मालपोत निवेदन: ${m.BorrowerName || mem?.FullName || m.MemberNo} (ऋण नं: ${m.LoanNo})`}
        subtitle="दृष्टिबन्धक पास सम्बन्धमा मालपोत कार्यालयलाई पठाउने निवेदन"
      >
        <Link to="/loan/malpot-application" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
        {can_edit && (
          <Link to={`/loan/malpot-application/edit/${id}`} className="btn-secondary">
            <Edit className="size-4" /> सम्पादन
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/malpot-application/${id}/print`} className="btn-primary">
            <Printer className="size-4" /> A4 प्रिन्ट गर्नुहोस्
          </Link>
        )}
      </PageHeader>

      {message.text && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-4 flex items-center justify-between rounded-md p-3 text-sm ${message.type === 'ok'
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border border-red-200 bg-red-50 text-red-800'
            }`}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage({ type: '', text: '' })}
            className="text-xs font-semibold underline ml-3"
          >
            बन्द गर्नुहोस्
          </button>
        </div>
      )}

      {/* Main 2-column Grid: Left is Document Sample, Right is History / Approval Status */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6 items-start">
        {/* ── Left Column: Document Sample ─────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-200 mb-5">
            <h1 className="text-xl font-bold text-slate-900">
              {orgName}
            </h1>
            <p className="text-sm text-slate-600">
              {orgAddr}
            </p>
            <div className="text-xs text-slate-500">
              सम्पर्क: {ent?.contactno || '—'} | प्यान नं: {ent?.panno || '—'}
            </div>
          </div>

          {/* Register No, Chalaani No & Date */}
          <div className="flex justify-between items-start text-xs mb-4 text-slate-700">
            <div className="space-y-1">
              <div>
                <span className="font-semibold">दर्ता नं.:</span>{' '}
                <span className="font-bold text-slate-900">
                  {m.RegisterNo || ent?.RegisterNo ? convertToNepaliNumber(m.RegisterNo || ent?.RegisterNo) : '—'}
                </span>
              </div>
              <div>
                <span className="font-semibold">चलानी नं.:</span>{' '}
                <span className="font-bold text-slate-900">{m.ChalaaniNo || '—'}</span>
              </div>
            </div>
            <div>
              <span className="font-semibold">मिति:</span>{' '}
              <span className="font-bold text-slate-900">{convertToNepaliNumber(m.EntryDate) || '—'}</span>
            </div>
          </div>

          {/* Addressee */}
          <div className="mb-4 text-xs text-slate-800">
            <div className="font-medium">श्री मालपोत कार्यालय,</div>
            <div className="font-bold">{m.MalpotAddress || '—'}</div>
          </div>

          {/* Subject */}
          <div className="text-center mb-4">
            <h2 className="font-bold underline text-sm text-slate-900 inline-block">
              बिषय: दृष्टिबन्धक पास सम्बन्धमा |
            </h2>
          </div>

          {/* Body Paragraph */}
          <div className="space-y-3 text-xs text-justify leading-relaxed text-slate-800">
            <p>महोदय,</p>
            <p className="indent-8">
              उपर्युक्त सम्बन्धमा यस{' '}
              <span className="font-bold underline">{orgName}{orgAddr ? `, ${orgAddr}` : ''}</span>{' '}
              का शेयर सदस्य नं.{' '}
              <span className="font-bold underline">{m.MemberNo || '—'}</span>{' '}
              भएका शेयर सदस्य श्री{' '}
              <span className="font-bold underline">{m.BorrowerName || mem?.FullName || '—'}</span>{' '}
              ले यस संस्थाबाट रु.{' '}
              <span className="font-bold underline">
                {m.LoanAmount ? formatNepaliCurrency(m.LoanAmount) : '.............'}
              </span>{' '}
              (अक्षरेपी रु.{' '}
              <span className="font-bold underline">
                {loanWords || '................................'}
              </span>{' '}
              मात्र) ऋण माग गर्नु भएको हुदा उक्त ऋणका लागि निजको र निजको श्रीमान/श्रीमती{' '}
              <span className="font-bold underline">{m.SpouseName || mem?.SpouseName || '—'}</span>{' '}
              को नाममा रहेको तपसिलको जग्गा दृष्टिबन्धक पास गरि सो को जानकारी समेत पठाइ दिनुहुन अनुरोध गर्दछौ | यस संस्थाबाट निम्न विवरण भएका प्रतिनिधि श्री{' '}
              <span className="font-bold underline">{m.StaffName || '—'}</span>{' '}
              लाई संस्थाको छाप सहित पठाइएको व्यहोरा अनुरोध छ |
            </p>
          </div>

          {/* 8-Column Land Table */}
          <div className="my-5 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 bg-white text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 px-2 py-1.5 text-center">क्र. स</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">जग्गा धनीको नामथर र ठेगाना</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">बाबुको नामथर</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">पति/बाजेको नामथर</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">जग्गाको ठेगाना</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center">वडा नं./ब्लक नं.</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center">कित्ता नं.</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center">क्षेत्रफल</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-2 py-2 text-center font-semibold">क.</td>
                  <td className="border border-slate-300 px-2 py-2 font-semibold whitespace-pre-line">{m.LandHolderPersonNameAndAddress1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{m.LandHolderFatherName1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{m.LandHolderGrandfatherName1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{m.LandAddress1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{m.LandWardNoBlockNo1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{m.LandKittaNo1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{m.LandArea1 || '—'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-2 text-center font-semibold">ख.</td>
                  <td className="border border-slate-300 px-2 py-2 font-semibold whitespace-pre-line">{m.LandHolderPersonNameAndAddress2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{m.LandHolderFatherName2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{m.LandHolderGrandfatherName2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{m.LandAddress2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{m.LandWardNoBlockNo2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{m.LandKittaNo2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{m.LandArea2 || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pratinidhi Details */}
          <div className="mt-6 rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs space-y-1.5">
            <h3 className="font-bold text-slate-900 mb-2">प्रतिनिधिको विवरण</h3>
            <div><span className="text-slate-500">नाम :</span> <span className="font-bold text-slate-900">{m.PratinidhiName || '—'}</span></div>
            <div><span className="text-slate-500">ठेगाना :</span> <span className="font-bold text-slate-900">{m.PratinidhiAddress || '—'}</span></div>
            <div><span className="text-slate-500">ना प्र. नं. :</span> <span className="font-bold text-slate-900">{m.PratinidhiCitNo || '—'}</span></div>
            <div><span className="text-slate-500">जारी मिति र जिल्ला :</span> <span className="font-bold text-slate-900">{m.PratinidhiCitIssuedDateAndPlace || '—'}</span></div>
          </div>
        </div>

        {/* ── Right Column: Approval & Status Panel ─────────────────── */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b pb-2 flex items-center justify-between">
              <span>प्रमाणीकरण स्थिति (Status)</span>
              <StatusBadge status={isApproved ? 'APPROVED' : 'PENDING'} />
            </h3>

            {/* Approval Action */}
            {!isApproved && canApprove && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                <div className="flex items-start gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <span>
                    तपाईंलाई यो मालपोत निवेदन प्रमाणित/स्वीकृत गर्ने अधिकार छ। कृपया विवरण रुजु गरेर स्वीकृत गर्नुहोस्।
                  </span>
                </div>

                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Check className="size-4" /> मालपोत निवेदन स्वीकृत गर्नुहोस्
                  </button>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-emerald-200">
                    <p className="text-xs font-medium text-emerald-900">
                      के तपाईं साँच्चै यो मालपोत निवेदन स्वीकृत गर्न चाहनुहुन्छ?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={approve}
                        className="flex-1 inline-flex items-center justify-center rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busy ? 'हुँदैछ...' : 'हो, स्वीकृत गर्नुहोस्'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirming(false)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        रद्द
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isApproved && !canApprove && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                <span>यो विवरण हाल प्रमाणीकरणको प्रतीक्षामा छ। अधिकारप्राप्त अधिकारीबाट स्वीकृत भएपछि मात्र प्रिन्ट गर्न सकिनेछ।</span>
              </div>
            )}

            {isApproved && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-semibold">यो विवरण स्वीकृत भइसकेको छ।</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    स्वीकृत गर्ने: {m.ApprovedBy || '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Audit Details */}
            <div className="space-y-2 text-xs text-slate-600 pt-2">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">फारम मिति:</span>
                <span className="font-mono text-slate-700">{m.EntryDate || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">चलानी नं.:</span>
                <span className="font-mono text-slate-700">{m.ChalaaniNo || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">दर्ता गर्ने प्रयोगकर्ता:</span>
                <span className="font-medium text-slate-800">{m.CreatedByName || m.CreatedBy || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रमाणित गर्ने:</span>
                <span className="font-medium text-slate-800">
                  {m.ApprovedBy || (isApproved ? '—' : 'प्रतीक्षारत')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रमाणित मिति:</span>
                <span className="font-mono text-slate-700">
                  {m.ApprovedAt ? formatDate(m.ApprovedAt) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">शाखा:</span>
                <span className="font-medium text-slate-800">{m.branch_name || m.BranchID || '—'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              ऋण सम्बन्धी जानकारी
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">ऋण नं:</span>
                <div className="font-semibold text-slate-800">{m.LoanNo}</div>
              </div>
              <div>
                <span className="text-slate-400">ऋण रकम:</span>
                <div className="font-semibold text-emerald-700">
                  {m.LoanAmount ? `रु. ${formatNepaliCurrency(m.LoanAmount)}` : '—'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">मालपोत कार्यालय:</span>
                <div className="font-medium text-slate-700">{m.MalpotAddress || '—'}</div>
              </div>
              <div>
                <span className="text-slate-400">संस्था प्रतिनिधि:</span>
                <div className="font-medium text-slate-700">{m.StaffName || '—'}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
