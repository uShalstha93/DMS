import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanPratigyaApi } from '../../api/loanPratigya';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';

export default function ViewLoanPratigya() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loanpratigya.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanPratigyaApi.get(id)
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
      await loanPratigyaApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'ऋणको प्रतिज्ञा पत्र सफलतापूर्वक प्रमाणित/स्वीकृत भयो।' });
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

  const { pratigya: p, member: m, loan: l, enterprise: ent, can_edit } = data;
  const isApproved = p.ApprovedStatus === 1;

  return (
    <>
      <PageHeader
        title={`ऋणको प्रतिज्ञा पत्र: ${m?.FullName || p.MemberNo} (ऋण नं. ${p.LoanNo})`}
        subtitle="ऋणी सदस्यले गरेको ऋण कबोल तथा प्रतिज्ञा विवरण"
      >
        <Link to="/loan/pratigya" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
        {can_edit && (
          <Link to={`/loan/pratigya/edit/${id}`} className="btn-secondary">
            <Edit className="size-4" /> सम्पादन
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/pratigya/${id}/print`} className="btn-primary">
            <Printer className="size-4" /> A4 प्रिन्ट गर्नुहोस्
          </Link>
        )}
      </PageHeader>

      {message.text && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-4 flex items-center justify-between rounded-md p-3 text-sm ${
            message.type === 'ok'
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
          <div className="text-center border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900">{ent?.companyname || 'हाम्रो सहकारी संस्था लि.'}</h2>
            <p className="text-sm text-slate-600">
              {ent?.district || ''} {ent?.munvdc ? `- ${ent.munvdc}` : ''} {ent?.wardno ? `-${convertToNepaliNumber(ent.wardno)}` : ''}, {ent?.tole || ''}
            </p>
            <div className="mt-2 text-xs text-slate-500">
              सम्पर्क: {ent?.contactno || '—'} | प्यान नं: {ent?.panno || '—'}
            </div>
          </div>

          {/* Date and Member info */}
          <div className="flex justify-between items-center mb-6 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">ऋणी सदस्य:</span>
              <span className="font-semibold text-slate-900">{m?.FullName || p.MemberNo} (सदस्य नं. {p.MemberNo})</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900">मिति: {convertToNepaliNumber(p.EntryDate) || p.EntryDate}</span>
            </div>
          </div>

          <div className="text-center font-bold text-base text-slate-900 border-b border-dashed pb-2 mb-6">
            प्रतिज्ञा पत्र फारम:
          </div>

          {/* 8 Clauses list */}
          <div className="text-sm text-slate-800 leading-relaxed text-justify space-y-3 mb-8">
            <p>
              १. संस्थाको ऋण रकम कबोल गरेको मितिमा नियमित रुपमा किस्ता, सावा र ब्याज रकम संस्थाको नियम अनुसार बुझाउने छु, यदि समयमा नबुझाएमा नियमानुसार बिलम्ब, हर्जाना शुल्क तिर्न मन्जुर छु |
            </p>
            <p>
              २. मैले सहकारीको ऐन, कानुन, नीतिनियम, मापदण्ड, संस्थाको विनियम तथा ऋण सम्बन्धि नीतिहरुको बारेमा पूर्ण जानकार छु साथै सम्पूर्ण निति नियमहरुको परिपालन गर्न गराउनको लागि तत्पर छु |
            </p>
            <p>
              ३. यदि छ महिना भित्र सावा, ब्याज, हर्जाना, जरिवाना, आदि बुझाइन भने मेरो बचत, शेयर, सामुहिक जमानत तथा धितो लिलामबाट समेत कट्टा हुने गरि असुल उपर गर्न मेरो मन्जुर छ |
            </p>
            <p>
              ४. ऋण रकम चुक्ता नभए सम्म धितो जमानत तथा घर घरानाबाट सावा ब्याज चुक्ता गर्नेछु |
            </p>
            <p>
              ५. संस्थाको ऋण नीति अनुसार मैले (ऋणीले) लिने ऋणको ब्याजदर{' '}
              <strong>{convertToNepaliNumber(p.RateOfInterest) || p.RateOfInterest || '……'}%</strong> रहेको छ |
            </p>
            <p>
              ६. मैले लिएको ऋणको ब्याज नियमित तिरेमा परियोजना अनुसार जति ब्याजदर निर्धारण गरिएको अनुसार लाग्ने छ र{' '}
              <strong>{convertToNepaliNumber(p.Day1) || p.Day1 || '…'}</strong> देखि{' '}
              <strong>{convertToNepaliNumber(p.Day2) || p.Day2 || '…'}</strong> दिन भित्र आएमा{' '}
              <strong>{convertToNepaliNumber(p.AddInterest1) || p.AddInterest1 || '…'}%</strong> ब्याज लाग्ने छ,{' '}
              <strong>{convertToNepaliNumber(p.Day3) || p.Day3 || '…'}</strong> देखि{' '}
              <strong>{convertToNepaliNumber(p.Day4) || p.Day4 || '…'}</strong> दिन भित्र आएमा{' '}
              <strong>{convertToNepaliNumber(p.AddInterest2) || p.AddInterest2 || '…'}%</strong> ब्याज लाग्ने छ | त्यसै गरि{' '}
              <strong>{convertToNepaliNumber(p.Day5) || p.Day5 || '…'}</strong> देखि{' '}
              <strong>{convertToNepaliNumber(p.Day6) || p.Day6 || '…'}</strong> दिन भित्र आएमा{' '}
              <strong>{convertToNepaliNumber(p.AddInterest3) || p.AddInterest3 || '…'}%</strong> ब्याज लाग्दै जाने छ |
            </p>
            <p>
              ७. मैले लिएको ऋणको किस्ताको भाका नाघेमा भाखा नागेको दिन देखि{' '}
              <strong>{convertToNepaliNumber(p.KistaDay1) || p.KistaDay1 || '…'}</strong> दिन सम्म किस्ता नआएमा भाका नाघेको किस्ताको{' '}
              <strong>{convertToNepaliNumber(p.Fine1) || p.Fine1 || '…'}%</strong> ले हर्जना,{' '}
              <strong>{convertToNepaliNumber(p.KistaDay2) || p.KistaDay2 || '…'}</strong> दिन सम्म किस्ता नआएमा{' '}
              <strong>{convertToNepaliNumber(p.Fine2) || p.Fine2 || '…'}%</strong> हर्जाना र{' '}
              <strong>{convertToNepaliNumber(p.KistaDay3) || p.KistaDay3 || '…'}</strong> दिन सम्म किस्ता नआएमा{' '}
              <strong>{convertToNepaliNumber(p.Fine3) || p.Fine3 || '…'}%</strong> हर्जाना तिर्न मन्जुर छु |
            </p>
            <p>
              ८. बजार दर अनुसार संचालक समितिले ब्याजदर{' '}
              <strong>{convertToNepaliNumber(p.ChangeableInterest) || p.ChangeableInterest || '…'}%</strong> सम्म हेरफेर गरेको दरमा म ऋण र ब्याज तिर्न मंजुर रहेको छु |
            </p>
          </div>

          {/* Signatures */}
          <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-6">हस्ताक्षर: ________________________</p>
              <p>ऋण लिनेको नाम: <strong>{m?.FullName || '—'}</strong></p>
              <p className="text-xs text-slate-600 mt-1">
                ठेगाना: {m?.TmpMUNVDC ? `${m.TmpMUNVDC} - ${m.TmpWardNo || ''}, ${m.TmpTole || ''}` : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-6">दस्तखत: ________________________</p>
              <p className="font-semibold text-slate-900">{p.StaffName || 'कर्मचारीको नाम'}</p>
              <p className="text-xs text-slate-600 font-medium">{p.StaffPost || 'पद'}</p>
            </div>
          </div>
        </div>

        {/* ── Right Column: History & Approval Status Sidebar ────────── */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
              <Clock className="size-4 text-slate-500" /> स्थिति तथा इतिहास (Status & History)
            </h3>

            {/* Status Details */}
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">स्वीकृति स्थिति:</span>
                <StatusBadge status={isApproved ? 'APPROVED' : 'PENDING'} />
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">शाखा:</span>
                <span className="font-medium text-slate-900">{p.branch_name || p.BranchID || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">फारम मिति:</span>
                <span className="font-mono text-slate-800">{p.EntryDate || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">ऋण प्रकार:</span>
                <span className="font-medium text-slate-900">{l?.LoanType || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">ऋण रकम:</span>
                <span className="font-semibold text-slate-900">{l?.LoanAmount ? `रु. ${l.LoanAmount}` : '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">दर्ता गर्ने:</span>
                <span className="font-medium text-slate-900">{p.CreatedByName || '—'}</span>
              </div>

              {isApproved ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mt-4">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">प्रमाणित / स्वीकृत</p>
                      <p className="text-sm font-medium text-emerald-800 mt-0.5">{p.ApprovedBy || '—'}</p>
                      <p className="text-xs text-emerald-700 mt-1">
                        मिति: {p.ApprovedAt ? new Date(p.ApprovedAt).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mt-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">प्रमाणीकरण पर्खाइमा</p>
                      <p className="text-xs text-amber-700 mt-1">
                        स्वीकृति अधिकार प्राप्त प्रयोगकर्ताले तलको बटन थिचेर प्रमाणित गर्न सक्नुहुन्छ।
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Approval Action Button */}
            {canApprove && !isApproved && (
              <div className="mt-5 border-t pt-4">
                {confirming ? (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-center">
                    <p className="text-xs font-semibold text-slate-800 mb-3">यो प्रतिज्ञा पत्र प्रमाणित/स्वीकृत गर्ने?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={approve}
                        className="btn-primary w-full text-xs py-1.5"
                      >
                        हो, स्वीकृत गर्नुहोस्
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirming(false)}
                        className="btn-secondary w-full text-xs py-1.5"
                      >
                        रद्द
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="btn-primary w-full flex items-center justify-center gap-1.5"
                  >
                    <Check className="size-4" /> प्रतिज्ञा पत्र प्रमाणित गर्नुहोस्
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

