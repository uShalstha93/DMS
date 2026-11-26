import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanNaapiSakhaApi } from '../../api/loanNaapiSakha';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber, formatNepaliCurrency } from '../../utils/NepaliConverter';
import { date as formatDate } from '../../utils/format';

export default function ViewLoanNaapiSakha() {
  const { id } = useParams();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loannaapi.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanNaapiSakhaApi.get(id)
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
      await loanNaapiSakhaApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'नापी शाखा निवेदन सफलतापूर्वक प्रमाणित/स्वीकृत भयो।' });
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

  const { naapiApplication: n, member: mem, loan: l, enterprise: ent, can_edit } = data;
  const isApproved = n.ApprovedStatus === 1;
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
        title={`नापी शाखा निवेदन: ${mem?.FullName || n.MemberNo} (ऋण नं: ${n.LoanNo})`}
        subtitle="जग्गा नक्सा उपलब्ध गराइदिनुहुन नापी कार्यालयलाई पठाउने निवेदन"
      >
        <Link to="/loan/naapi-saakha" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
        {can_edit && (
          <Link to={`/loan/naapi-saakha/edit/${id}`} className="btn-secondary">
            <Edit className="size-4" /> सम्पादन
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/naapi-saakha/${id}/print`} className="btn-primary">
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
                  {n.RegisterNo || ent?.RegisterNo ? convertToNepaliNumber(n.RegisterNo || ent?.RegisterNo) : '—'}
                </span>
              </div>
              <div>
                <span className="font-semibold">चलानी नं.:</span>{' '}
                <span className="font-bold text-slate-900">{n.ChalaaniNo || '—'}</span>
              </div>
            </div>
            <div>
              <span className="font-semibold">मिति:</span>{' '}
              <span className="font-bold text-slate-900">{convertToNepaliNumber(n.EntryDate) || '—'}</span>
            </div>
          </div>

          {/* Addressee */}
          <div className="mb-4 text-xs text-slate-800 space-y-0.5">
            <div className="font-medium">श्रीमान कार्यालय प्रमुख ज्यु,</div>
            <div className="font-medium">नापी कार्यालय,</div>
            <div className="font-bold">{n.NaapiAddress || '—'}</div>
          </div>

          {/* Subject */}
          <div className="text-center mb-4">
            <h2 className="font-bold underline text-sm text-slate-900 inline-block">
              बिषय: जग्गा नक्सा उपलब्ध गराइदिनुहुन |
            </h2>
          </div>

          {/* Body Paragraph */}
          <div className="space-y-3 text-xs text-justify leading-relaxed text-slate-800">
            <p>महोदय,</p>
            <p className="indent-8">
              उपर्युक्त सम्बन्धमा यस{' '}
              <span className="font-bold underline">{orgName}{orgAddr ? `, ${orgAddr}` : ''}</span>
              , लाई तपसिलमा उल्लेखित कित्ता जग्गाको{' '}
              <span className="font-bold underline">{n.Map1 || 'ट्रेस'}</span>{' '}
              नक्सा र{' '}
              <span className="font-bold underline">{n.Map2 || 'वडा'}</span>{' '}
              नक्सा उपलब्ध गराइदिनुहुन अनुरोध गर्दछौ |
            </p>
            <div className="text-center font-bold underline pt-1">तपसिल</div>
          </div>

          {/* 8-Column Land Table */}
          <div className="my-4 overflow-x-auto">
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
                  <td className="border border-slate-300 px-2 py-2 font-semibold whitespace-pre-line">{n.LandHolderPersonName1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{n.LandHolderFatherName1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{n.LandHolderGrandfatherName1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{n.LandAddress1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{n.LandWardNoBlockNo1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{n.LandKittaNo1 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{n.LandArea1 || '—'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-2 text-center font-semibold">ख.</td>
                  <td className="border border-slate-300 px-2 py-2 font-semibold whitespace-pre-line">{n.LandHolderPersonName2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{n.LandHolderFatherName2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{n.LandHolderGrandfatherName2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2">{n.LandAddress2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{n.LandWardNoBlockNo2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{n.LandKittaNo2 || '—'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{n.LandArea2 || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Block */}
          <div className="mt-10 flex justify-end">
            <div className="text-center text-xs space-y-1 min-w-[140px]">
              <div className="h-10 border-b border-slate-400 mb-1.5"></div>
              <div className="font-bold text-slate-900">{n.LoanBhibhagPramukh || 'ऋण बिभाग प्रमुख'}</div>
              <div className="font-semibold text-slate-700">(कर्मचारी)</div>
            </div>
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
                    तपाईंलाई यो नापी शाखा निवेदन प्रमाणित/स्वीकृत गर्ने अधिकार छ। कृपया विवरण रुजु गरेर स्वीकृत गर्नुहोस्।
                  </span>
                </div>

                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Check className="size-4" /> नापी शाखा निवेदन स्वीकृत गर्नुहोस्
                  </button>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-emerald-200">
                    <p className="text-xs font-medium text-emerald-900">
                      के तपाईं साँच्चै यो नापी शाखा निवेदन स्वीकृत गर्न चाहनुहुन्छ?
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
                    स्वीकृत गर्ने: {n.ApprovedBy || '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Audit Details */}
            <div className="space-y-2 text-xs text-slate-600 pt-2">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">फारम मिति:</span>
                <span className="font-mono text-slate-700">{n.EntryDate || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">चलानी नं.:</span>
                <span className="font-mono text-slate-700">{n.ChalaaniNo || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">दर्ता गर्ने प्रयोगकर्ता:</span>
                <span className="font-medium text-slate-800">{n.CreatedByName || n.CreatedBy || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रमाणित गर्ने:</span>
                <span className="font-medium text-slate-800">
                  {n.ApprovedBy || (isApproved ? '—' : 'प्रतीक्षारत')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रमाणित मिति:</span>
                <span className="font-mono text-slate-700">
                  {n.ApprovedAt ? formatDate(n.ApprovedAt) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">शाखा:</span>
                <span className="font-medium text-slate-800">{n.branch_name || n.BranchID || '—'}</span>
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
                <div className="font-semibold text-slate-800">{n.LoanNo}</div>
              </div>
              <div>
                <span className="text-slate-400">ऋण रकम:</span>
                <div className="font-semibold text-emerald-700">
                  {l?.LoanAmount ? `रु. ${formatNepaliCurrency(l.LoanAmount)}` : '—'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">नापी कार्यालय:</span>
                <div className="font-medium text-slate-700">{n.NaapiAddress || '—'}</div>
              </div>
              <div>
                <span className="text-slate-400">ऋण विभाग प्रमुख:</span>
                <div className="font-medium text-slate-700">{n.LoanBhibhagPramukh || 'ऋण बिभाग प्रमुख'}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
