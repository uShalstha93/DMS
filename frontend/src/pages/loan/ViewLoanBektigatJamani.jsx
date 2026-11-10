import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanBektigatJamaniApi } from '../../api/loanBektigatJamani';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';
import { date as formatDate } from '../../utils/format';

export default function ViewLoanBektigatJamani() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loanbektigatjamani.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanBektigatJamaniApi.get(id)
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
      await loanBektigatJamaniApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'व्यक्तिगत जमानी तमसुक सफलतापूर्वक प्रमाणित/स्वीकृत भयो।' });
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

  const { bektigatJamani: j, member: mem, loan: l, enterprise: ent, can_edit } = data;
  const isApproved = j.ApprovedStatus === 1;
  const loanWords = j.LoanAmountWords || (j.LoanAmount ? convertToNepaliWords(j.LoanAmount) : '');

  return (
    <>
      <PageHeader
        title={`व्यक्तिगत जमानी: ${j.JamaniName || '—'} (ऋणी: ${j.BorrowerName || mem?.FullName || j.MemberNo})`}
        subtitle="ऋण असुलीको लागि ऋणी सदस्यको व्यक्तिगत जमानी तमसुक"
      >
        <Link to="/loan/bektigat-jamani" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
        {can_edit && (
          <Link to={`/loan/bektigat-jamani/edit/${id}`} className="btn-secondary">
            <Edit className="size-4" /> सम्पादन
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/bektigat-jamani/${id}/print`} className="btn-primary">
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
            <h2 className="text-xl font-bold text-slate-900">{ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}</h2>
            <p className="text-sm text-slate-600">
              {ent?.District || ent?.district || ''} {ent?.VDCMUN || ent?.munvdc ? `- ${ent.VDCMUN || ent.munvdc}` : ''} {ent?.WardNo || ent?.wardno ? `-${convertToNepaliNumber(ent.WardNo || ent.wardno)}` : ''}
            </p>
          </div>

          {/* Title */}
          <div className="text-center font-bold text-base text-slate-900 border-b border-dashed pb-2 mb-6">
            व्यक्तिगत जमानी तमसुक
          </div>

          {/* Deed Body with Witnesses */}
          <div className="flex flex-col md:flex-row gap-4 border border-slate-300 rounded-lg p-4 bg-slate-50/50">
            {/* Witnesses Column */}
            <div className="md:w-[22%] border-b md:border-b-0 md:border-r border-slate-300 pr-3 pb-3 md:pb-0 text-xs text-slate-700 space-y-4">
              <div className="font-semibold text-slate-900 border-b pb-1">साक्षीहरू:</div>
              <div className="space-y-1">
                <p className="font-medium">१. साक्षी</p>
                <p>नाम: <strong className="text-slate-900">{j.SakshiName1 || '—'}</strong></p>
                <p>जिल्ला: {j.SakshiDistrict1 || '—'}</p>
                <p>गा.वि.स/न.पा.: {j.SakshiPalika1 || '—'}</p>
                <p>वडा नं.: {convertToNepaliNumber(j.SakshiWardNo1) || '—'}</p>
                <p>उमेर: {convertToNepaliNumber(j.SakshiAge1) || '—'} वर्ष</p>
                <p>को: {j.SakshiRelation1 || '—'}</p>
              </div>
              <div className="space-y-1 pt-3 border-t border-slate-200">
                <p className="font-medium">२. साक्षी</p>
                <p>नाम: <strong className="text-slate-900">{j.SakshiName2 || '—'}</strong></p>
                <p>जिल्ला: {j.SakshiDistrict2 || '—'}</p>
                <p>गा.वि.स/न.पा.: {j.SakshiPalika2 || '—'}</p>
                <p>वडा नं.: {convertToNepaliNumber(j.SakshiWardNo2) || '—'}</p>
                <p>उमेर: {convertToNepaliNumber(j.SakshiAge2) || '—'} वर्ष</p>
                <p>को: {j.SakshiRelation2 || '—'}</p>
              </div>
            </div>

            {/* Main Deed Text */}
            <div className="md:w-[78%] pl-1 text-sm text-slate-800 leading-relaxed text-justify space-y-4">
              <p className="indent-8">
                लिखितम <strong>{j.BorrowerProvince || '—'}</strong> प्रदेश <strong>{j.BorrowerDistrict || '—'}</strong> जिल्ला <strong>{j.BorrowerPalika || '—'}</strong> महा-नगर/ उप-महानगर/ नगरपालिका/ गाउपालिका वडा न. <strong>{convertToNepaliNumber(j.BorrowerWard) || '—'}</strong> बस्ने वर्ष <strong>{convertToNepaliNumber(j.BorrowerAge) || '—'}</strong> को सदस्य न. <strong>{j.MemberNo}</strong> को म <strong>{j.BorrowerGrandfatherName || '—'}</strong> को नाती/नातिनी <strong>{j.BorrowerFatherName || '—'}</strong> को छोरा/छोरी <strong>{j.BorrowerSpouseName || '—'}</strong> श्रीमान/ श्रीमती नागरिकता बमोजिम <strong>{j.BorrowerCitizenshipDistrict || '—'}</strong> जिल्ला <strong>{j.BorrowerCitizenshipPalika || '—'}</strong> गा. वि. स. / नगरपालिका/ गाउपालिका वडा न. <strong>{convertToNepaliNumber(j.BorrowerCitizenshipWard) || '—'}</strong> जारी मिति <strong>{j.BorrowerCitizenshipDate || '—'}</strong> जारी जिल्ला <strong>{j.BorrowerCitizenshipDistrict || '—'}</strong> आगे यस <strong>{ent?.CompanyName || 'सहकारी संस्था'}</strong> बाट <strong>{j.LoanPurpose || 'ऋण'}</strong> परियोजनाको निमित्त रु. <strong>{convertToNepaliNumber(j.LoanAmount) || '—'}</strong> (अक्षरेपी <strong>{loanWords || '—'}</strong>) मात्र ऋण लिई मिति <strong>{j.LoanDate || '—'}</strong> मा तमसुक गरि लिएको कर्जा निजको <strong>{ent?.CompanyName || 'सहकारी संस्था'}</strong> {ent?.VDCMUN || ''} न पा/गा.पा वडा न. {ent?.WardNo || ''} संगको सर्त सम्झौता उल्लघन गरि कर्जा नतिरेमा लिलाम बिक्रि वा अन्य ब्यबस्थावाट <strong>{ent?.CompanyName || 'सहकारी संस्था'}</strong> सहकारी संस्था लि. ले लिने रकम असुल गरेमा मन्जुरी छ भनि त्यस सहकारी संस्था लि. बाट सोधनी गर्दा मेरो चित्त बुझ्यो । उपयुक्त <strong>{j.BorrowerName || mem?.FullName || '—'}</strong> ले कर्जा लिदा लेखिदिएको धितो, बचत, शेयर तथा घरघरानाबाट <strong>{ent?.CompanyName || 'सहकारी संस्था'}</strong> सहकारी संस्था लि. को लिने रकम असुल हुन नसकेमा निजले कर्जा लिदा गरिदिएको तमसुकलाई यसै लिखतको अभिन्न अंग मानी म <strong>{j.JamaniGrandfatherName || '—'}</strong> को नाती/नातिनी <strong>{j.JamaniFatherName || '—'}</strong> को छोरा/छोरी <strong>{j.JamaniSpouseName || '—'}</strong> श्रीमान/ श्रीमती म <strong>{j.JamaniName}</strong> स्वयमको नाममा रहेको जुनसुकै चलअचल सम्पति <strong>{ent?.CompanyName || 'सहकारी संस्था'}</strong> सहकारी संस्था लि. ले लिने रकम असुलउपर गरेमा र असुलीको सिलसिलामा मेरो नाम कालो सुचिमा समावेश गरेमा मेरो पूर्ण मन्जुरी छ । पछी निजको नामको बाकी कर्जा मेरो नामको सम्पतिबाट असुलउपर गर्न पाउने होइन र मलाई कालो सुचिमा राख्न पाउने छैन भनि कहिँ कतै कुनै किसिमको उजुर वाजुर गर्ने छैन, गरे यसै कागजबाट बदर गरिदिनु हुन भनि मेरो मनोमानी, राजीखुसीले <strong>{ent?.CompanyName || 'सहकारी संस्था'}</strong> सहकारी संस्था लि. मा बसी किनारामा साक्षीको रोहबरमा यो व्यक्तिगत जमानिको कागज गरिदियाँ ।
              </p>

              {/* Thumbprints & Signature */}
              <div className="pt-6 flex justify-end">
                <div className="text-center space-y-2">
                  <div className="flex gap-2 justify-center">
                    <div className="w-20 h-20 border border-slate-400 flex items-center justify-center text-xs text-slate-400 bg-white">
                      दायाँ
                    </div>
                    <div className="w-20 h-20 border border-slate-400 flex items-center justify-center text-xs text-slate-400 bg-white">
                      बायाँ
                    </div>
                  </div>
                  <div className="border-b border-slate-400 pt-6"></div>
                  <p className="font-semibold text-xs text-slate-800">जमानी दिनेको सहि</p>
                  <p className="text-xs text-slate-700">नाम: {j.JamaniName}</p>
                </div>
              </div>

              {/* Legal Date */}
              <div className="pt-6 text-center text-sm font-medium text-slate-800 border-t border-dashed">
                ईति सम्वत् <strong>{convertToNepaliNumber(j.LegalYear)}</strong> साल{' '}
                <strong>{j.LegalMonth}</strong> महिना{' '}
                <strong>{convertToNepaliNumber(j.LegalDay)}</strong> गते रोज{' '}
                <strong>{convertToNepaliNumber(j.LegalDayOfWeek)}</strong> शुभम्
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-center text-xs font-semibold text-slate-800">
                <div className="text-center space-y-1">
                  <div className="border-b border-slate-400 w-36 pb-4 mb-1"></div>
                  <p>तयार गर्नेको दस्तखत</p>
                  <p className="font-normal">नाम: {j.LoanBhibhagPramukh || '—'}</p>
                  <p className="text-slate-500 font-normal">पद: ऋण विभाग प्रमुख</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="border-b border-slate-400 w-36 pb-4 mb-1"></div>
                  <p>रुजु गर्नेको दस्तखत</p>
                  <p className="font-normal">नाम: {j.Bhyabasthapak || '—'}</p>
                  <p className="text-slate-500 font-normal">पद: व्यवस्थापक</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Approval Status & History ──────────────── */}
        <aside className="space-y-4">
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
                    तपाईंसँग यो व्यक्तिगत जमानी तमसुक स्वीकृत गर्ने अधिकार छ। रुजु पश्चात प्रमाणित गर्नुहोस्।
                  </span>
                </div>
                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs py-2 inline-flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} /> यो तमसुक स्वीकृत गर्नुहोस्
                  </button>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-900">
                      के तपाईं निश्चित हुनुहुन्छ?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={approve}
                        className="btn-primary bg-emerald-700 hover:bg-emerald-800 text-xs py-1.5 flex-1 inline-flex items-center justify-center gap-1"
                      >
                        {busy ? 'हुँदैछ...' : 'हो, स्वीकृत गर्नुहोस्'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirming(false)}
                        className="btn-secondary text-xs py-1.5"
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
                <span>यो तमसुक हाल प्रमाणीकरणको प्रतीक्षामा छ।</span>
              </div>
            )}

            {/* History Details */}
            <div className="text-xs space-y-2.5 pt-2 text-slate-600">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">फारम दर्ता मिति:</span>
                <span className="font-mono font-medium text-slate-800">{j.EntryDate || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रविष्ट गर्ने:</span>
                <span className="font-medium text-slate-800">{j.CreatedByName || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रविष्ट समय:</span>
                <span className="font-mono text-slate-700">{j.Created_at ? formatDate(j.Created_at) : '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रमाणित गर्ने:</span>
                <span className="font-medium text-slate-800">
                  {j.ApprovedBy || (isApproved ? '—' : 'प्रतीक्षारत')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रमाणित मिति:</span>
                <span className="font-mono text-slate-700">
                  {j.ApprovedAt ? formatDate(j.ApprovedAt) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">शाखा:</span>
                <span className="font-medium text-slate-800">{j.branch_name || j.BranchID || '—'}</span>
              </div>
            </div>
          </div>

          {/* Quick Print Banner */}
          {isApproved ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-900 space-y-2">
              <div className="font-semibold flex items-center gap-1.5">
                <Printer className="size-4 text-indigo-600" />
                <span>A4 आधिकारिक छापा (Print)</span>
              </div>
              <p className="text-indigo-700">
                कानूनी प्रयोजनका लागि आधिकारिक व्यक्तिगत जमानी तमसुकलाई A4 portrait ढाँचामा प्रिन्ट गर्नुहोस्।
              </p>
              <Link
                to={`/loan/bektigat-jamani/${id}/print`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700"
              >
                <Printer size={13} /> तमसुक प्रिन्ट गर्नुहोस्
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Printer className="size-4 text-amber-500" />
                <span>प्रिन्ट (Print)</span>
              </div>
              <p>यो तमसुक अझै प्रमाणित भएको छैन। प्रमाणीकरण पश्चात मात्र प्रिन्ट गर्न सकिन्छ।</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
