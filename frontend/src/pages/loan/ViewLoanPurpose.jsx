import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanPurposeApi } from '../../api/loanPurpose';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber, formatNepaliCurrency } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { date as formatDate } from '../../utils/format';

export default function ViewLoanPurpose() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loanpurpose.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanPurposeApi.get(id)
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
      await loanPurposeApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'ऋण सदुपयोग विवरण सफलतापूर्वक प्रमाणित/स्वीकृत भयो।' });
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

  const { loanPurpose: p, member: mem, loan: l, enterprise: ent, can_edit } = data;
  const isApproved = p.ApprovedStatus === 1;
  const loanWords = p.LoanAmountWords || (p.LoanAmount ? convertToNepaliWords(p.LoanAmount) : '');

  return (
    <>
      <PageHeader
        title={`ऋण सदुपयोग विवरण: ${p.BorrowerName || mem?.FullName || p.MemberNo} (ऋण नं: ${p.LoanNo})`}
        subtitle="ऋणीले लिएको ऋण तोकिएको उद्देश्य तथा शिर्षकमा सदुपयोग गर्ने सम्बन्धी विवरण"
      >
        <Link to="/loan/purpose" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
        {can_edit && (
          <Link to={`/loan/purpose/edit/${id}`} className="btn-secondary">
            <Edit className="size-4" /> सम्पादन
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/purpose/${id}/print`} className="btn-primary">
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
          <div className="text-center pb-4 border-b border-slate-200 mb-6">
            <h1 className="text-xl font-bold text-slate-900">
              {ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}
            </h1>
            <p className="text-xs text-slate-600">
              {ent?.Address || ent?.address
                ? `${ent.Address || ent.address}${ent.WardNo || ent.wardno ? ` - ${convertToNepaliNumber(ent.WardNo || ent.wardno)}` : ''}`
                : ''}
            </p>
          </div>

          {/* Date */}
          <div className="flex justify-end text-xs mb-4 text-slate-700">
            <div>
              <span className="font-semibold">मिति:</span> {convertToNepaliNumber(p.EntryDate) || '—'}
            </div>
          </div>

          {/* Summary Table */}
          <div className="mb-6 flex justify-center">
            <table className="w-full max-w-2xl border-collapse border border-slate-300 bg-white text-xs">
              <tbody>
                <tr className="bg-slate-100">
                  <td colSpan={2} className="border border-slate-300 px-3 py-1.5 font-bold text-slate-800">
                    ऋण सदुपयोग गर्ने विवरण
                  </td>
                </tr>
                <tr>
                  <td className="w-1/3 border border-slate-300 px-3 py-1.5 font-medium text-slate-600">सदस्य नं.</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                    {p.MemberNo || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-600">ऋणीको नाम</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                    {p.BorrowerName || mem?.FullName || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-600">ऋणीको ठेगाना</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                    {p.BorrowerAddress || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-600">ऋण लगानीको शिर्षक</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                    {p.LoanPurpose || l?.LoanPurpose || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legal Commitment Paragraph */}
          <div className="space-y-4 text-xs text-justify leading-relaxed text-slate-800">
            <p className="indent-8">
              म यस <span className="font-bold underline">{ent?.CompanyName || ent?.companyname || 'संस्था'}</span>को शेयर सदस्य भइ नियमित रुपमा बचत गरिरहेकोले हाल मलाई तपशिलमा उल्लेखित उद्देश्य बमोजिम रु.{' '}
              <span className="font-bold underline">{p.LoanAmount ? formatNepaliCurrency(p.LoanAmount) : '.............'}</span>{' '}
              (अक्षरेपी रु.{' '}
              <span className="font-bold underline">
                {loanWords || '................................................'}
              </span>{' '}
              मात्र) ऋण आवश्यक भएकाले उक्त रकम उपलब्ध गरिदिनुहुन अनुरोध गर्दछु | उक्त ऋण रकमको किस्ता र ब्याज तिर्ने मेरो आम्दानीको श्रोत{' '}
              <span className="font-bold underline">{p.IncomeSource || 'नोकरी'}</span> रहेको छ | मैले यस संस्थाबाट लिएको ऋण तल उल्लेखित शिर्षकमा सदुपयोग गरि नियमित बचत, ऋणको ब्याज र किस्ता समयमा भुक्तानी गर्ने प्रतिबद्धता व्यक्त गर्दछु|
            </p>

            {/* Bullet Points */}
            <div className="rounded bg-slate-50 p-4 border border-slate-200">
              <div className="font-bold text-slate-900 mb-1">ऋण लगानी सम्बन्धि आधारहरु:</div>
              <div className="font-bold text-slate-800 mb-3">{p.LoanPurposeCategory || p.LoanPurpose || '(झ) घरायसी/सामाजिक कार्य ऋण'}</div>
              <ul className="space-y-2 pl-4 text-slate-700">
                <li className="flex gap-2">
                  <span className="font-semibold text-nowrap">१. कुन कार्य गर्ने हो ? :-</span>
                  <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1">
                    {p.LoanPurposeDetail1 || '—'}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-nowrap">२. कसको/कसका लागि गर्ने हो? :-</span>
                  <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1">
                    {p.LoanPurposeDetail2 || '—'}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-nowrap">३. अन्य विवरण :-</span>
                  <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1">
                    {p.OtherDetail || '—'}
                  </span>
                </li>
              </ul>
            </div>

            <p className="indent-8">
              माथि उल्लेखित परियोजना/ शिर्षक बाहेक अन्य क्षेत्रमा ऋणको प्रयोग गरेको पाइएमा संस्थाले गर्ने कारबाहीमा कुनै उजुर-वाजुर गर्ने छैन |
            </p>
          </div>

          {/* Signature Section */}
          <div className="mt-12 flex justify-end">
            <div className="text-right text-xs space-y-2">
              <div className="h-12"></div>
              <div className="pt-1 font-semibold text-slate-800">
                हस्ताक्षर: _______________
              </div>
              <div className="font-bold text-slate-900">
                ऋणीको नाम: {p.BorrowerName || mem?.FullName || '.......................................'}
              </div>
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
                    तपाईंलाई यो ऋण सदुपयोग विवरण प्रमाणित/स्वीकृत गर्ने अधिकार छ। कृपया विवरण रुजु गरेर स्वीकृत गर्नुहोस्।
                  </span>
                </div>

                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Check className="size-4" /> ऋण सदुपयोग विवरण स्वीकृत गर्नुहोस्
                  </button>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-emerald-200">
                    <p className="text-xs font-medium text-emerald-900">
                      के तपाईं साँच्चै यो ऋण सदुपयोग विवरण स्वीकृत गर्न चाहनुहुन्छ?
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
                    स्वीकृत गर्ने: {p.ApprovedBy || '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Audit Details */}
            <div className="space-y-2 text-xs text-slate-600 pt-2">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">फारम मिति:</span>
                <span className="font-mono text-slate-700">{p.EntryDate || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">दर्ता गर्ने प्रयोगकर्ता:</span>
                <span className="font-medium text-slate-800">{p.CreatedByName || p.CreatedBy || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रमाणित गर्ने:</span>
                <span className="font-medium text-slate-800">
                  {p.ApprovedBy || (isApproved ? '—' : 'प्रतीक्षारत')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रमाणित मिति:</span>
                <span className="font-mono text-slate-700">
                  {p.ApprovedAt ? formatDate(p.ApprovedAt) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">शाखा:</span>
                <span className="font-medium text-slate-800">{p.branch_name || p.BranchID || '—'}</span>
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
                <div className="font-semibold text-slate-800">{p.LoanNo}</div>
              </div>
              <div>
                <span className="text-slate-400">ऋण रकम:</span>
                <div className="font-semibold text-emerald-700">
                  {p.LoanAmount ? `रु. ${formatNepaliCurrency(p.LoanAmount)}` : '—'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">ऋण शिर्षक:</span>
                <div className="font-medium text-slate-700">{p.LoanPurpose || l?.LoanPurpose || '—'}</div>
              </div>
              <div>
                <span className="text-slate-400">आम्दानीको श्रोत:</span>
                <div className="font-medium text-slate-700">{p.IncomeSource || 'नोकरी'}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
