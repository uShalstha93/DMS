import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanManjurinaamaApi } from '../../api/loanManjurinaama';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';

export default function ViewLoanManjurinaama() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loanmanjurinaama.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanManjurinaamaApi.get(id)
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
      await loanManjurinaamaApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'मञ्जुरीनामा सफलतापूर्वक प्रमाणित/स्वीकृत भयो।' });
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

  const { manjurinaama: m, member: mem, loan: l, enterprise: ent, can_edit } = data;
  const isApproved = m.ApprovedStatus === 1;
  const memberAge = mem?.DOB ? calculateAgeFromNepaliDate(mem.DOB) : '';
  const loanWords = m.LoanAmount ? convertToNepaliWords(m.LoanAmount) : '';

  return (
    <>
      <PageHeader
        title={`मञ्जुरीनामा: ${m.LandDhitoPersonName || '—'} (ऋणी: ${mem?.FullName || m.MemberNo})`}
        subtitle="धितो जग्गाधनीद्वारा संस्थालाई प्रदान गरिएको आधिकारिक मञ्जुरीनामा"
      >
        <Link to="/loan/manjurinaama" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
        {can_edit && (
          <Link to={`/loan/manjurinaama/edit/${id}`} className="btn-secondary">
            <Edit className="size-4" /> सम्पादन
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/manjurinaama/${id}/print`} className="btn-primary">
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
            मञ्जुरीनामा
          </div>

          {/* Document Content */}
          <div className="text-sm text-slate-800 leading-relaxed text-justify space-y-3 mb-6">
            <p>
              लिखितम् <strong>{m.LandDhitoPersonProvince || '……'}</strong> प्रदेश{' '}
              <strong>{m.LandDhitoPersonDistrict || '……'}</strong> जिल्ला{' '}
              <strong>{m.LandDhitoPersonMUNVDC || '……'}</strong> वडा नं.{' '}
              <strong>{convertToNepaliNumber(m.LandDhitoPersonWardNo) || m.LandDhitoPersonWardNo || '…'}</strong> बस्ने{' '}
              <strong>{m.LandDhitoPersonGrandfather || '…………'}</strong> को नाती/नातिनी{' '}
              <strong>{m.LandDhitoPersonFather || '…………'}</strong> को छोरा/छोरी{' '}
              <strong>{m.LandDhitoPersonSpouse || '…………'}</strong> को श्रीमान/श्रीमती बर्ष{' '}
              <strong>{convertToNepaliNumber(m.LandDhitoPersonAge) || m.LandDhitoPersonAge || '…'}</strong> को{' '}
              <strong className="underline">{m.LandDhitoPersonName || '………………'}</strong> आगे{' '}
              <strong>{ent?.province || '……'}</strong> प्रदेश <strong>{ent?.district || '……'}</strong> जिल्ला{' '}
              <strong>{ent?.munvdc || '……'}</strong> स्थित <strong>{ent?.companyname || 'हाम्रो सहकारी संस्था लि.'}</strong> बाट{' '}
              <strong>{m.LoanPurpose || '……'}</strong> उद्देश्यमा मासिक{' '}
              <strong>{convertToNepaliNumber(m.RateOfInterest) || m.RateOfInterest || '…'}%</strong> का दरले ब्याज बुझाउने गरि आजका मिति देखि{' '}
              <strong>{convertToNepaliNumber(m.LoanPeriodYear) || m.LoanPeriodYear || '०'}</strong> वर्ष{' '}
              <strong>{convertToNepaliNumber(m.LoanPeriodMonth) || m.LoanPeriodMonth || '०'}</strong> महिना भित्रमा सावा ब्याज किस्ताबन्दीमा बुझाउने गरि रु.{' '}
              <strong>{convertToNepaliNumber(m.LoanAmount) || m.LoanAmount || '………'}</strong> (अक्षरेपी रु.{' '}
              <strong>{loanWords || '……………'}</strong> मात्र) ऋण लिनका लागि{' '}
              <strong>{mem?.Province || '……'}</strong> प्रदेश <strong>{mem?.District || '……'}</strong> जिल्ला{' '}
              <strong>{mem?.MUNVDC || '……'}</strong> वडा नं.{' '}
              <strong>{convertToNepaliNumber(mem?.WardNo) || mem?.WardNo || '…'}</strong> बस्ने{' '}
              <strong>{mem?.GrandfatherName || '…………'}</strong> को नाती/नातिनी{' '}
              <strong>{mem?.FatherName || '…………'}</strong> को छोरा/छोरी{' '}
              <strong>{mem?.SpouseName || '…………'}</strong> को श्रीमान/श्रीमती बर्ष{' '}
              <strong>{convertToNepaliNumber(memberAge) || memberAge || '…'}</strong> को श्री/सुश्री{' '}
              <strong>{mem?.FullName || '………………'}</strong> को यस संस्थाको शेयर सदस्य नं.{' '}
              <strong>{m.MemberNo}</strong> को श्री/सुश्री{' '}
              <strong>{mem?.FullName || '………………'}</strong> ले मेरो नाममा रहेको तपसिल बमोजिमको जग्गा निजले त्यस ऋण लिने प्रयोजनको लागि त्यस संस्थामा धितो जमानत प्रदान गर्न म मन्जुर भएको हुदा यो मन्जुरी नामाको कागजमा सहिछाप गरि दिएको छु | अन्य संघ संस्थामा धितो राखेको र राख्ने छैन भनि कुनै उजुर-वाजुर गर्ने छैन गरेमा यहि कागजले बदर गरि लिनु भनि पूर्ण दुरुस्तिका साथ, होसहवास, शारीरिक-मानसिक अवस्था ठिक भएको बेला म स्वयंम संस्थाको कार्यालयम उपस्थित भइ फड्के किनारका साक्षीको रोहबरमा यो मन्जुरीनामाको कागज गरि तपाई धनि संस्थालाई दियाँ |
            </p>
          </div>

          {/* तपसिल Table */}
          <div className="mb-6">
            <h4 className="font-bold text-sm text-slate-900 border-b pb-1 mb-2">तपसिल (धितो जग्गा विवरण)</h4>
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-300 text-xs text-left">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="border border-slate-300 p-2">जग्गा धनीको नामथर र ठेगाना</th>
                    <th className="border border-slate-300 p-2">बुबाको नामथर</th>
                    <th className="border border-slate-300 p-2">पतिको/पत्निको नामथर</th>
                    <th className="border border-slate-300 p-2">जग्गाको ठेगाना</th>
                    <th className="border border-slate-300 p-2">वडा नं. / ब्लक नं.</th>
                    <th className="border border-slate-300 p-2">कित्ता नं.</th>
                    <th className="border border-slate-300 p-2">क्षेत्रफल</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-medium">
                      {m.LandDhitoPersonName || '—'}<br />
                      <span className="text-[11px] text-slate-500">
                        {[m.LandDhitoPersonMUNVDC, m.LandDhitoPersonDistrict].filter(Boolean).join(', ')}
                      </span>
                    </td>
                    <td className="border border-slate-300 p-2">{m.LandDhitoPersonFather || '—'}</td>
                    <td className="border border-slate-300 p-2">{m.LandDhitoPersonSpouse || '—'}</td>
                    <td className="border border-slate-300 p-2">{m.LandDhitoAddress || '—'}</td>
                    <td className="border border-slate-300 p-2">{m.LandDhitoWardBlockNo || '—'}</td>
                    <td className="border border-slate-300 p-2 font-mono">{m.LandDhitoKittaNo || '—'}</td>
                    <td className="border border-slate-300 p-2">{m.LandDhitoArea || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures & Thumbprints */}
          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-800 mb-6">
            {/* मञ्जुरीनामा गराउने */}
            <div className="border border-slate-200 p-3 rounded-lg flex flex-col justify-between">
              <div>
                <h5 className="font-bold border-b pb-1 mb-2">मञ्जुरीनामा गराउने</h5>
                <p className="mt-4">दस्तखत: ________________________</p>
                <p className="font-semibold text-slate-900 mt-2">नाम: {m.StaffName || 'ऋण विभाग प्रमुख'}</p>
                <p className="text-slate-600">पद: {m.StaffPost || 'ऋण विभाग प्रमुख'}</p>
              </div>
              <p className="text-slate-500 font-mono mt-3">मिति: {m.EntryDate || '—'}</p>
            </div>

            {/* मञ्जुरीनामा दिने */}
            <div className="border border-slate-200 p-3 rounded-lg text-center flex flex-col justify-between">
              <div>
                <h5 className="font-bold border-b pb-1 mb-2">मञ्जुरीनामा दिने (जग्गाधनी)</h5>
                <p className="font-semibold text-slate-900 mt-1">{m.LandDhitoPersonName || '—'}</p>
                <div className="flex justify-center gap-3 my-3">
                  <div className="w-16 h-16 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                    दायाँ
                  </div>
                  <div className="w-16 h-16 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                    बायाँ
                  </div>
                </div>
              </div>
              <p className="text-slate-600 mt-2">दस्तखत: ________________________</p>
            </div>

            {/* मञ्जुरीनामा लिने */}
            <div className="border border-slate-200 p-3 rounded-lg text-center flex flex-col justify-between">
              <div>
                <h5 className="font-bold border-b pb-1 mb-2">मञ्जुरीनामा लिने (ऋणी सदस्य)</h5>
                <p className="font-semibold text-slate-900 mt-1">{mem?.FullName || m.MemberNo}</p>
                <div className="flex justify-center gap-3 my-3">
                  <div className="w-16 h-16 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                    दायाँ
                  </div>
                  <div className="w-16 h-16 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                    बायाँ
                  </div>
                </div>
              </div>
              <p className="text-slate-600 mt-2">दस्तखत: ________________________</p>
            </div>
          </div>

          {/* Witnesses Block */}
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-xs mb-6">
            <h5 className="font-bold text-slate-900 border-b pb-1 mb-3">रोहबरका साक्षीहरु</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-semibold block mb-1">१. साक्षी:</span>
                <p>नाम: <strong>{m.SachiName1 || '—'}</strong> (उमेर: {convertToNepaliNumber(m.SachiAge1) || m.SachiAge1 || '—'} वर्ष)</p>
                <p className="text-slate-600">ठेगाना: {m.SachiDistrict1 || '—'} जिल्ला {m.SachiMUNVDC1 || '—'} वडा नं. {convertToNepaliNumber(m.SachiWardNo1) || m.SachiWardNo1 || '—'}</p>
                <p className="text-slate-400 mt-2">दस्तखत: ________________________</p>
              </div>
              <div>
                <span className="font-semibold block mb-1">२. साक्षी:</span>
                <p>नाम: <strong>{m.SachiName2 || '—'}</strong> (उमेर: {convertToNepaliNumber(m.SachiAge2) || m.SachiAge2 || '—'} वर्ष)</p>
                <p className="text-slate-600">ठेगाना: {m.SachiDistrict2 || '—'} जिल्ला {m.SachiMUNVDC2 || '—'} वडा नं. {convertToNepaliNumber(m.SachiWardNo2) || m.SachiWardNo2 || '—'}</p>
                <p className="text-slate-400 mt-2">दस्तखत: ________________________</p>
              </div>
            </div>
          </div>

          {/* ईति सम्वत् Line */}
          <div className="text-center font-bold text-sm text-slate-900 border-t pt-4">
            ईति सम्वत् {convertToNepaliNumber(m.LegalYear) || m.LegalYear || '…………'} साल{' '}
            {m.LegalMonth || '…………'} महिना{' '}
            {convertToNepaliNumber(m.LegalDay) || m.LegalDay || '……'} गते{' '}
            {convertToNepaliNumber(m.LegalDayOfWeek) || m.LegalDayOfWeek || '……'} रोज शुभम् |
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
                <span className="font-medium text-slate-900">{m.branch_name || m.BranchID || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">फारम मिति:</span>
                <span className="font-mono text-slate-800">{m.EntryDate || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">ऋण प्रकार:</span>
                <span className="font-medium text-slate-900">{l?.LoanType || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">ऋण रकम:</span>
                <span className="font-semibold text-slate-900">{m.LoanAmount ? `रु. ${m.LoanAmount}` : '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">दर्ता गर्ने:</span>
                <span className="font-medium text-slate-900">{m.CreatedByName || '—'}</span>
              </div>

              {isApproved ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mt-4">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">प्रमाणित / स्वीकृत</p>
                      <p className="text-sm font-medium text-emerald-800 mt-0.5">{m.ApprovedBy || '—'}</p>
                      <p className="text-xs text-emerald-700 mt-1">
                        मिति: {m.ApprovedAt ? new Date(m.ApprovedAt).toLocaleString() : '—'}
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
                    <p className="text-xs font-semibold text-slate-800 mb-3">यो मञ्जुरीनामा प्रमाणित/स्वीकृत गर्ने?</p>
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
                    <Check className="size-4" /> मञ्जुरीनामा प्रमाणित गर्नुहोस्
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

