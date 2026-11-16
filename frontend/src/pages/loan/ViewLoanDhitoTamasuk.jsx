import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanDhitoTamasukApi } from '../../api/loanDhitoTamasuk';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { date as formatDate } from '../../utils/format';

export default function ViewLoanDhitoTamasuk() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loandhitotamasuk.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanDhitoTamasukApi
      .get(id)
      .then(setData)
      .catch((e) =>
        setMessage({ type: 'error', text: errorMessage(e, 'विवरण प्राप्त गर्न सकिएन') })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const approve = async () => {
    setBusy(true);
    try {
      await loanDhitoTamasukApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'धितो तमसुक सफलतापूर्वक प्रमाणित/स्वीकृत भयो।' });
      load();
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'स्वीकृत गर्न सकिएन') });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (message.type === 'error' && !data)
    return <p className="p-4 text-sm text-stamp">{message.text}</p>;
  if (!data) return null;

  const { dhitoTamasuk: t, member: mem, loan: l, enterprise: ent, dhitos = [], can_edit } = data;
  const isApproved = t.ApprovedStatus === 1;
  const loanWords = t.LoanAmountWords || (t.LoanAmount ? convertToNepaliWords(t.LoanAmount) : '');

  // Determine dhito list to display: items stored in record, or from dhitojamanidetail
  const displayDhitos =
    Array.isArray(t.DhitoItems) && t.DhitoItems.length > 0
      ? t.DhitoItems
      : dhitos.length > 0
      ? dhitos
      : [
          {
            DhitoPerson: t.DhitoPerson,
            DhitoDistrict: t.DhitoDistrict,
            DhitoVDCMUN: t.DhitoVDCMUN,
            DhitoWardNo: t.DhitoWardNo,
            DhitoKittaNo: t.DhitoKittaNo,
            DhitoArea: t.DhitoArea,
            Remarks: t.DhitoRemarks,
          },
        ];

  return (
    <>
      <PageHeader
        title={`धितो तमसुक: ऋणी ${t.BorrowerName || mem?.FullName || t.MemberNo} (ऋण नं: ${t.LoanNo})`}
        subtitle="जग्गा धितो राखी ऋण लगानी गर्दा तयार गरिएको आधिकारिक कानूनी तमसुक"
      >
        <Link to="/loan/dhito-tamasuk" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
        {can_edit && (
          <Link to={`/loan/dhito-tamasuk/edit/${id}`} className="btn-secondary">
            <Edit className="size-4" /> सम्पादन
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/dhito-tamasuk/${id}/print`} className="btn-primary">
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
          {/* Enterprise Header */}
          <div className="text-center border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}
            </h2>
            <p className="text-sm text-slate-600">
              {ent?.District || ent?.district || ''}{' '}
              {ent?.VDCMUN || ent?.munvdc ? `- ${ent.VDCMUN || ent.munvdc}` : ''}{' '}
              {ent?.WardNo || ent?.wardno ? `-${convertToNepaliNumber(ent.WardNo || ent.wardno)}` : ''}
            </p>
            <div className="mt-2 flex justify-between text-xs text-slate-500 font-mono">
              <span>
                दर्ता नं:{' '}
                <strong>
                  {convertToNepaliNumber(ent?.RegisterNo || ent?.registerno || ent?.panno || '')}
                </strong>
              </span>
              <span>
                तमसुक मिति: <strong>{convertToNepaliNumber(t.EntryDate || '')}</strong>
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center font-bold text-lg text-slate-900 border-b border-dashed pb-2 mb-6">
            धितो तमसुक
          </div>

          {/* Deed Body with Witnesses */}
          <div className="flex flex-col md:flex-row gap-4 border border-slate-300 rounded-lg p-4 bg-slate-50/50">
            {/* Witnesses Column */}
            <div className="md:w-[24%] border-b md:border-b-0 md:border-r border-slate-300 pr-3 pb-3 md:pb-0 text-xs text-slate-700 space-y-4">
              <div className="font-semibold text-slate-900 border-b pb-1">साक्षीहरू (Witnesses):</div>
              <div className="space-y-1">
                <p className="font-medium text-slate-800">१. पहिलो साक्षी</p>
                <p>
                  नाम: <strong className="text-slate-900">{t.SakshiName1 || '—'}</strong>
                </p>
                <p>जिल्ला: {t.SakshiDistrict1 || '—'}</p>
                <p>गा.वि.स/न.पा.: {t.SakshiPalika1 || '—'}</p>
                <p>वडा नं.: {convertToNepaliNumber(t.SakshiWardNo1) || '—'}</p>
                {t.SakshiMemberNo1 && (
                  <p>सदस्य नं.: {convertToNepaliNumber(t.SakshiMemberNo1)}</p>
                )}
                <div className="pt-2 text-slate-400">दस्तखत: ........................</div>
              </div>
              <div className="space-y-1 pt-3 border-t border-slate-200">
                <p className="font-medium text-slate-800">२. दोस्रो साक्षी</p>
                <p>
                  नाम: <strong className="text-slate-900">{t.SakshiName2 || '—'}</strong>
                </p>
                <p>जिल्ला: {t.SakshiDistrict2 || '—'}</p>
                <p>गा.वि.स/न.पा.: {t.SakshiPalika2 || '—'}</p>
                <p>वडा नं.: {convertToNepaliNumber(t.SakshiWardNo2) || '—'}</p>
                {t.SakshiMemberNo2 && (
                  <p>सदस्य नं.: {convertToNepaliNumber(t.SakshiMemberNo2)}</p>
                )}
                <div className="pt-2 text-slate-400">दस्तखत: ........................</div>
              </div>
            </div>

            {/* Main Deed Text */}
            <div className="md:w-[76%] pl-1 text-sm text-slate-800 leading-relaxed text-justify space-y-4">
              <p className="indent-8">
                लिखितम धनीका नाम सहकारी ऐन <strong>{t.SahakariAin || '२०४८'}</strong> बमोजिम
                जिल्ला सहकारी कार्यालय, <strong>{t.JillaSahakariAddress || 'काठमाडौं'}</strong>{' '}
                जिल्लामा दर्ता भइ{' '}
                <strong>{ent?.Province || ent?.province || 'बागमती'}</strong> प्रदेश{' '}
                <strong>{ent?.District || ent?.district || 'काठमाडौं'}</strong> जिल्ला{' '}
                <strong>{ent?.VDCMUN || ent?.munvdc || 'काठमाण्डौ'}</strong> म.न.पा./उ.म.न.पा./न.पा./ग.पा.
                वडा नं.{' '}
                <strong>
                  {convertToNepaliNumber(ent?.WardNo || ent?.wardno || '१०')}
                </strong>{' '}
                स्थित श्री{' '}
                <strong>
                  {ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}
                </strong>{' '}
                सो धन व्यहोर्ने ऋणीका नाम{' '}
                <strong>{t.BorrowerGrandfatherName || '—'}</strong> को नाति/नातिनी/बुहारी{' '}
                <strong>{t.BorrowerFatherName || '—'}</strong> को छोरा/छोरी/श्रीमती{' '}
                <strong>{t.BorrowerProvince || '—'}</strong> प्रदेश{' '}
                <strong>{t.BorrowerDistrict || '—'}</strong> जिल्ला{' '}
                <strong>{t.BorrowerPalika || '—'}</strong> न.पा/गा.पा वडा नं.{' '}
                <strong>{convertToNepaliNumber(t.BorrowerWard) || '—'}</strong> को हाल{' '}
                <strong>{t.BorrowerTmpProvince || '—'}</strong> प्रदेश{' '}
                <strong>{t.BorrowerTmpDistrict || '—'}</strong> जिल्ला{' '}
                <strong>{t.BorrowerTmpPalika || '—'}</strong> न.पा/गा.पा वडा नं.{' '}
                <strong>{convertToNepaliNumber(t.BorrowerTmpWard) || '—'}</strong> बस्ने
                नागरिकता प्रमाणपत्र नं.{' '}
                <strong>{t.BorrowerCitizenshipNo || '—'}</strong> (जारी मिति{' '}
                <strong>{convertToNepaliNumber(t.BorrowerCitizenshipDate) || '—'}</strong> जारी
                जिल्ला <strong>{t.BorrowerCitizenshipDistrict || '—'}</strong>) वर्ष{' '}
                <strong>{convertToNepaliNumber(t.BorrowerAge) || '—'}</strong> का धनी संस्थाको
                सदस्य नं. <strong>{convertToNepaliNumber(t.MemberNo) || '—'}</strong> का सदस्य
                श्री/श्रीमती/सुश्री <strong>{t.BorrowerName || mem?.FullName || '—'}</strong> ले
                जग्गा धितो जमानत अन्तर्गत <strong>{t.LoanPurpose || 'ऋण'}</strong> कार्य गर्नका
                लागि मिति <strong>{convertToNepaliNumber(t.LoanApplicationDate) || '—'}</strong> मा
                पेश गरेको ऋण निवेदनमा उल्लेखित शर्तहरु र तपसिल बमोजिमका धनजमानी राखी संस्थाको
                स्वीकृत ऋण व्यवस्थापन कार्यविधि तथा निर्देशन समेतलाई पालना गर्ने गरी आजका मितिमा रु.{' '}
                <strong>{convertToNepaliNumber(t.LoanAmount) || '—'}</strong> (अक्षरेपी रु.{' '}
                <strong>{loanWords || '—'}</strong> मात्र |) ऋण लिएको ठिक साँचो हो |
              </p>

              <p className="indent-8">
                उक्त ऋण रकम र सो मा बार्षिक{' '}
                <strong>{convertToNepaliNumber(t.RateOfInterest) || '—'}</strong> प्रतिशतका दरले
                ब्याज समेत राखी{' '}
                <strong>{convertToNepaliNumber(t.LoanPeriodYear) || '०'}</strong> वर्ष{' '}
                <strong>{convertToNepaliNumber(t.LoanPeriodMonth) || '०'}</strong> महिना भित्र{' '}
                <strong>{convertToNepaliNumber(t.LoanKista) || '—'}</strong> किस्तामा सम्पूर्ण
                साँवा तथा मासिक रुपमा ब्याज धनि संस्थामा तिर्ने बुझाउने छु| जुन कार्यका लागि ऋण
                लिएको हो, सो कार्यमा नलगाएमा एवम् भाखा भित्र साँवा तथा ब्याज बुझाउन नल्याएमा धनी
                संस्थाको नियमानुसार लाग्ने हर्जाना/बिलम्ब शुल्क समेत बुझाउन मंजुर छु/छौं |
              </p>

              <p className="indent-8">
                कथकदाचित मैले बुझाउन पर्ने साँवा तथा ब्याज र हर्जाना समेत नबुझाएमा मेरो यस सहकारी
                संस्थामा जम्मा भएको बचत रकमबाट र तपसिल बमोजिम व्यक्तिहरुको जमानी राखेको रकमबाट
                अशुल उपर गरिलिनु र उक्त रकमबाट पनि पुरा असुल हुन नसकेमा मेरा एकाघरका सगोलको
                परिवारको नाममा रहेको चलअचल श्रीसम्पतिबाट प्रचलित कानुन बमोजिम असुलउपर गरिलिनु
                भएमा कुनै प्रकारको उजुरबाजुर गर्ने छैन भनि राजीखुसि तथा मंजुरीले किनाराका
                साक्षीहरुको रोहबरमा धनी संस्थामा बसी यो तमसुकमा सहीछाप गरी धनी संस्थालाई दिएँ|
              </p>

              {/* Tapasil Mortgage Table */}
              <div className="pt-4 space-y-2">
                <div className="text-center font-bold text-xs uppercase border-b pb-1 text-slate-900">
                  तपसिल: जग्गा धितोको विवरण
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-slate-300 text-center">
                    <thead className="bg-slate-100 font-semibold border-b">
                      <tr>
                        <th className="border-r p-1.5">जग्गाधनीको नामथर</th>
                        <th className="border-r p-1.5">जिल्ला</th>
                        <th className="border-r p-1.5">न.पा/गा.पा</th>
                        <th className="border-r p-1.5">वडा नं.</th>
                        <th className="border-r p-1.5">कित्ता नं.</th>
                        <th className="border-r p-1.5">क्षेत्रफल</th>
                        <th className="p-1.5">कैफियत</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayDhitos.map((d, i) => (
                        <tr key={i} className="border-b">
                          <td className="border-r p-1.5 font-semibold text-slate-900">
                            {d.DhitoPerson || '—'}
                          </td>
                          <td className="border-r p-1.5">{d.DhitoDistrict || '—'}</td>
                          <td className="border-r p-1.5">{d.DhitoVDCMUN || '—'}</td>
                          <td className="border-r p-1.5">
                            {convertToNepaliNumber(d.DhitoWardNo) || '—'}
                          </td>
                          <td className="border-r p-1.5 font-semibold text-slate-900">
                            {convertToNepaliNumber(d.DhitoKittaNo) || '—'}
                          </td>
                          <td className="border-r p-1.5">{d.DhitoArea || '—'}</td>
                          <td className="p-1.5">{d.Remarks || d.DhitoRemarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Thumbprints */}
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
                  <div className="border-b border-slate-400 pt-4"></div>
                  <p className="font-semibold text-xs text-slate-800">ऋणीको सहीछाप</p>
                  <p className="text-xs text-slate-700">नाम: {t.BorrowerName || mem?.FullName}</p>
                </div>
              </div>

              {/* Legal Date */}
              <div className="pt-6 text-center text-sm font-medium text-slate-800 border-t border-dashed">
                ईति सम्वत् <strong>{convertToNepaliNumber(t.LegalYear)}</strong> साल{' '}
                <strong>{t.LegalMonth}</strong> महिना{' '}
                <strong>{convertToNepaliNumber(t.LegalDay)}</strong> गते रोज{' '}
                <strong>{convertToNepaliNumber(t.LegalDayOfWeek)}</strong> शुभम्
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-center text-xs font-semibold text-slate-800">
                <div className="text-center space-y-1">
                  <div className="border-b border-slate-400 w-36 pb-4 mb-1"></div>
                  <p>तमसुक तयार गर्ने</p>
                  <p className="font-normal">नाम: {t.LoanBhibhagPramukh || '—'}</p>
                  <p className="text-slate-500 font-normal">पद: ऋण विभाग प्रमुख</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="border-b border-slate-400 w-36 pb-4 mb-1"></div>
                  <p>तमसुक प्रमाणित गर्ने</p>
                  <p className="font-normal">नाम: {t.Byabasthapak || '—'}</p>
                  <p className="text-slate-500 font-normal">पद: व्यवस्थापक</p>
                </div>
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
                    तपाईंलाई यो धितो तमसुक प्रमाणित/स्वीकृत गर्ने अधिकार छ। कृपया विवरण रुजु गरेर
                    स्वीकृत गर्नुहोस्।
                  </span>
                </div>

                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Check className="size-4" /> धितो तमसुक प्रमाणित गर्नुहोस्
                  </button>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-emerald-200">
                    <p className="text-xs font-medium text-emerald-900">
                      के तपाईं साँच्चै यो धितो तमसुक प्रमाणित गर्न चाहनुहुन्छ?
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
                <span>यो तमसुक हाल प्रमाणीकरणको प्रतीक्षामा छ।</span>
              </div>
            )}

            {/* Audit Details */}
            <div className="space-y-2 text-xs text-slate-600 pt-2">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">फारम मिति:</span>
                <span className="font-mono text-slate-700">{t.EntryDate || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">दर्ता गर्ने प्रयोगकर्ता:</span>
                <span className="font-medium text-slate-800">{t.CreatedByName || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रमाणित गर्ने:</span>
                <span className="font-medium text-slate-800">
                  {t.ApprovedBy || (isApproved ? '—' : 'प्रतीक्षारत')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">प्रमाणित मिति:</span>
                <span className="font-mono text-slate-700">
                  {t.ApprovedAt ? formatDate(t.ApprovedAt) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">शाखा:</span>
                <span className="font-medium text-slate-800">{t.branch_name || t.BranchID || '—'}</span>
              </div>
            </div>
          </div>

          {/* Quick Print Banner: PRINT ONLY AFTER APPROVAL */}
          {isApproved ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-900 space-y-2">
              <div className="font-semibold flex items-center gap-1.5">
                <Printer className="size-4 text-indigo-600" />
                <span>A4 आधिकारिक छापा (Print)</span>
              </div>
              <p className="text-indigo-700">
                कानूनी प्रयोजनका लागि आधिकारिक धितो तमसुकलाई A4 portrait ढाँचामा प्रिन्ट गर्नुहोस्।
              </p>
              <Link
                to={`/loan/dhito-tamasuk/${id}/print`}
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
