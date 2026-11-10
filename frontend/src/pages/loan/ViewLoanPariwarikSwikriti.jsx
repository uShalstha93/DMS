import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanPariwarikSwikritiApi } from '../../api/loanPariwarikSwikriti';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';

export default function ViewLoanPariwarikSwikriti() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loanpariwarikswikriti.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanPariwarikSwikritiApi.get(id)
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
      await loanPariwarikSwikritiApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'पारिवारिक स्वीकृति फारम सफलतापूर्वक प्रमाणित/स्वीकृत भयो।' });
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

  const { pariwarikSwikriti: p, member: mem, loan: l, enterprise: ent, can_edit } = data;
  const isApproved = p.ApprovedStatus === 1;
  const memberAge = mem?.DOB ? calculateAgeFromNepaliDate(mem.DOB) : '';
  const loanWords = p.LoanAmount ? convertToNepaliWords(p.LoanAmount) : '';

  return (
    <>
      <PageHeader
        title={`पारिवारिक स्वीकृति: ${p.RelativeName || '—'} (ऋणी: ${mem?.FullName || p.MemberNo})`}
        subtitle="ऋणी सदस्यको परिवारद्वारा प्रदान गरिएको आधिकारिक ऋण स्वीकृति तथा जमानी विवरण"
      >
        <Link to="/loan/pariwarik-swikriti" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
        {can_edit && (
          <Link to={`/loan/pariwarik-swikriti/edit/${id}`} className="btn-secondary">
            <Edit className="size-4" /> सम्पादन
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/pariwarik-swikriti/${id}/print`} className="btn-primary">
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

          {/* Title */}
          <div className="text-center font-bold text-base text-slate-900 border-b border-dashed pb-2 mb-6">
            पारिवारिक स्वीकृत फारम
          </div>

          {/* Main Statement */}
          <div className="text-sm text-slate-800 leading-relaxed text-justify space-y-3 mb-6">
            <p>
              लिखितम् <strong>{mem?.TmpProvince || mem?.Province || '……'}</strong> प्रदेश{' '}
              <strong>{mem?.TmpDistrict || mem?.District || '……'}</strong> जिल्ला{' '}
              <strong>{mem?.TmpMUNVDC || mem?.MUNVDC || '……'}</strong> वडा नं.{' '}
              <strong>{convertToNepaliNumber(mem?.TmpWardNo || mem?.WardNo) || '…'}</strong> बस्ने{' '}
              <strong>{mem?.GrandfatherName || '…………'}</strong> को नाती/नातिनी{' '}
              <strong>{mem?.FatherName || '…………'}</strong> को छोरा/छोरी{' '}
              <strong>{mem?.SpouseName || '…………'}</strong> को श्रीमान/श्रीमती{' '}
              <strong>{convertToNepaliNumber(memberAge) || memberAge || '…'}</strong> वर्षको{' '}
              <strong>{mem?.FullName || '………………'}</strong> ले यस{' '}
              <strong>{ent?.companyname || 'हाम्रो सहकारी संस्था लि.'}</strong> बाट मासिक{' '}
              <strong>{convertToNepaliNumber(p.RateOfInterest) || p.RateOfInterest || '…'}%</strong> ब्याजदरमा{' '}
              <strong>{p.LoanPurpose || '……'}</strong> परियोजनाको निमित्त{' '}
              <strong>{convertToNepaliNumber(p.LoanPeriodYear) || p.LoanPeriodYear || '०'}</strong> वर्ष{' '}
              <strong>{convertToNepaliNumber(p.LoanPeriodMonth) || p.LoanPeriodMonth || '०'}</strong> महिनाको रु.{' '}
              <strong>{convertToNepaliNumber(p.LoanAmount) || p.LoanAmount || '………'}</strong> (अक्षरेपी रु.{' '}
              <strong>{loanWords || '……………'}</strong> मात्र) ऋण लिन लागेको भन्ने बारे घर सल्लाह भई पारिवारिक स्वीकृतिको लागि ऋणीको नाता{' '}
              <strong>{p.RelativeGrandfatherName || '…………'}</strong> को नाती/नातिनी{' '}
              <strong>{p.RelativeFatherName || '…………'}</strong> को छोरा/छोरी{' '}
              <strong>{p.RelativeSpouseName || '…………'}</strong> को श्रीमान/श्रीमती म{' '}
              <strong className="underline">{p.RelativeName || '………………'}</strong> ले पारिवारिक स्वीकृति पत्रमा सहिछाप गरिदिए | ऋण लिनको निम्ति मलाई धन जमानी बस्न मन्जुर छ छैन भनि निज ऋणी तथा संस्थाको रोहबरमा तपाई साहु संस्थाले म संग सोधनी गर्नु भएकोमा मेरो चीत्त बुझ्यो र सो ऋणको जमानी म भए |
            </p>
          </div>

          {/* पारिवारिक स्वीकृति Section */}
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 mb-6">
            <h4 className="font-bold text-sm text-slate-900 border-b pb-2 mb-3">पारिवारिक स्वीकृति दिने</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-sm">हस्ताक्षर: ________________________</p>
                <p className="text-sm font-semibold text-slate-900 mt-3">नाम: {p.RelativeName || '—'}</p>
                <p className="text-xs text-slate-600 mt-1">नाता: <strong>{p.Relationship || '—'}</strong></p>
              </div>
              <div className="flex justify-end gap-3">
                <div className="w-16 h-20 border border-dashed border-slate-400 bg-white rounded flex items-center justify-center text-[11px] text-slate-400">
                  दायाँ
                </div>
                <div className="w-16 h-20 border border-dashed border-slate-400 bg-white rounded flex items-center justify-center text-[11px] text-slate-400">
                  बायाँ
                </div>
              </div>
            </div>
          </div>

          {/* ईति सम्वत् Line */}
          <div className="text-center font-bold text-sm text-slate-900 border-t pt-4 mb-6">
            ईति सम्वत् {convertToNepaliNumber(p.LegalYear) || p.LegalYear || '…………'} साल{' '}
            {p.LegalMonth || '…………'} महिना{' '}
            {convertToNepaliNumber(p.LegalDay) || p.LegalDay || '……'} गते{' '}
            {convertToNepaliNumber(p.LegalDayOfWeek) || p.LegalDayOfWeek || '……'} रोज शुभम् |
          </div>

          {/* Bottom Officers */}
          <div className="border-t pt-4 grid grid-cols-2 gap-6 text-center text-xs text-slate-800">
            <div>
              <p className="mb-4">दस्तखत: ________________________</p>
              <p className="font-bold text-sm text-slate-900">ऋण विभाग प्रमुख</p>
              <p className="text-slate-600 mt-1">नाम थर: {p.LoanBhibhagPramukh || '—'}</p>
            </div>
            <div>
              <p className="mb-4">दस्तखत: ________________________</p>
              <p className="font-bold text-sm text-slate-900">कार्यालय प्रमुख</p>
              <p className="text-slate-600 mt-1">नाम थर: {p.KaryalayaPramukh || '—'}</p>
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
                <span className="font-semibold text-slate-900">{p.LoanAmount ? `रु. ${p.LoanAmount}` : '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">स्वीकृति दिने नातेदार:</span>
                <span className="font-medium text-slate-900">{p.RelativeName || '—'} ({p.Relationship || '—'})</span>
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
                    <p className="text-xs font-semibold text-slate-800 mb-3">यो पारिवारिक स्वीकृति प्रमाणित/स्वीकृत गर्ने?</p>
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
                    <Check className="size-4" /> पारिवारिक स्वीकृति प्रमाणित गर्नुहोस्
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

