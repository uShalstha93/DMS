import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, Trash2, Building2, Calendar, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanRulesApi } from '../../api/loanRules';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';

export default function ViewLoanRules() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loanrule.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanRulesApi.get(id)
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
      await loanRulesApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'ऋणका शर्तहरु सफलतापूर्वक प्रमाणित/स्वीकृत भयो।' });
      load();
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'स्वीकृत गर्न सकिएन') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('के तपाईं साँच्चै यो ऋण शर्त विवरण मेटाउन चाहनुहुन्छ?')) return;
    setBusy(true);
    try {
      await loanRulesApi.remove(id);
      navigate('/loan/rules', { state: { message: 'ऋणका शर्तहरु सफलतापूर्वक मेटाइयो।' } });
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'मेटाउन सकिएन') });
      setBusy(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (message.type === 'error' && !data) return <p className="p-4 text-sm text-stamp">{message.text}</p>;
  if (!data) return null;

  const { rule, member: m, loan: l, enterprise: ent, can_edit, can_delete } = data;
  const isApproved = rule.ApprovedStatus === 1;
  const loanWords = rule.LoanAmount ? convertToNepaliWords(rule.LoanAmount) : '';

  return (
    <>
      <PageHeader
        title={`ऋणका शर्तहरु: ${m?.FullName || rule.MemberNo} (ऋण नं. ${rule.LoanNo})`}
        subtitle="ऋणी सदस्यले पालना गर्नुपर्ने सर्तहरु तथा परामर्श सहमति विवरण"
      >
        <Link to="/loan/rules" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
        {can_edit && (
          <Link to={`/loan/rules/edit/${id}`} className="btn-secondary">
            <Edit className="size-4" /> सम्पादन
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/rules/print/${id}`} className="btn-primary">
            <Printer className="size-4" /> A4 प्रिन्ट गर्नुहोस्
          </Link>
        )}
        {/* {can_delete && (
          <button type="button" onClick={remove} disabled={busy} className="btn-danger">
            <Trash2 className="size-4" /> मेटाउनुहोस्
          </button>
        )} */}
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
              <span className="font-semibold text-slate-900">{m?.FullName || rule.MemberNo} (सदस्य नं. {rule.MemberNo})</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900">मिति: {convertToNepaliNumber(rule.EntryDate) || rule.EntryDate}</span>
            </div>
          </div>

          <div className="text-center font-bold text-base text-slate-900 border-b border-dashed pb-2 mb-6">
            ऋण लिने सदस्यले पालना गर्नुपर्ने सर्तहरु:
          </div>

          {/* 14 Rules list */}
          <div className="text-sm text-slate-800 leading-relaxed text-justify space-y-3 mb-8">
            <p>
              १. ऋणी सदस्यले ऋण लिदा तमसुकमा लेखिएको बमोजिम मासिक ब्याज र किस्ता वापत रु.{' '}
              <strong>{convertToNepaliNumber(rule.LoanAmount) || rule.LoanAmount}</strong> | (अक्षरेपी रु.{' '}
              <strong>{loanWords}</strong> मात्र) तोकिएको समयमा भुक्तानी गर्नु पर्ने छ |
            </p>
            <p>२. तपाईले लिनु भएको ऋणको किस्ता र ब्याज हरेक किस्ताको समय अवधि भित्र बुझाउनु पर्छ |</p>
            <p>३. ऋणको ब्याजदर संस्थाको संचालक समितिले परिबर्तित वित्तिय बजार अनुसार ब्याजदर परिवर्तन गरे, परिबर्तित ब्याजदर अनुसार ऋणीले ऋणको ब्याज भुक्तानी गर्नु पर्ने छ |</p>
            <p>४. ऋणीले लिएको ऋण, प्रयोजन अनुसार लगानी गर्नु पर्ने छ र बेला-बेलामा ऋणको सदुपयोग र प्रगति/प्रतिफलको जानकारी संस्थामा जानकारी गराउनु पर्ने छ |</p>
            <p>५. शेयर सदस्यले मासिक बचत नियमित रुपमा गरेको हुनुपर्ने छ |</p>
            <p>६. संस्थाले तोके अनुसारको समय भित्र किस्ता तिरेमा निर्धारित ब्याज लाग्ने छ तर नियमित नबुझाएमा समितिले तोकेको ब्याज र हर्जाना लाग्ने छ |</p>
            <p>७. कथमकदाचित आफुले लिएको ऋण लगानी गरेको परियोजनामा कुनै दुर्घटना, प्राकृतिक प्रकोप, अन्य कुनै बिपत्ति, आदिले असफल भएमा तत्काल संस्थामा जानकारी गराएमा हर्जाना छुट हुनेछ |</p>
            <p>
              ८. एउटा शिर्षकमा ऋण लिएर अर्को शिर्षकमा लगानी गरेमा थप{' '}
              <strong>{convertToNepaliNumber(rule.AdditionalIntRate) || rule.AdditionalIntRate || '…'}%</strong> ले अतिरिक्त ब्याज शुल्क लाग्ने छ |
            </p>
            <p>९. यदि किस्ता र ब्याज नियमित नआएमा तपाई ऋणीलाई पठाउने स्मरण-पत्र, ताकेता-पत्र, चिठी, टेलिफोन, घरदैलो, पत्रपत्रिकामा प्रकाशन, आदि लाग्ने शुल्क ऋणी आफै स्वयमले व्यहोर्नु पर्नेछ |</p>
            <p>१०. ऋणीले कुनै एक किस्ता नतिर्दा संस्थाको नियमानुसार तिर्न बाकी सबै ऋणलाई कर्जा जोखिम ब्यबस्थामा गणना गरि ऋणीलाई संरक्षित पुंजी फिर्ता कोष वितरण गरिने छैन |</p>
            <p>११. ऋण लिएपछी नियमित नतिरी भाका नाघेमा संस्थाको साधारणसभाको प्रतिवेदनमा, खराब कर्जाको सुचिमा, पत्रपत्रिकामा, बुलेटिन, आदिमा ऋण र तीनपुस्ते विवरण सहित ऋणीको कालो सुचिमा नाम प्रकाशन गरि प्रचलित कानुन बमोजिम संस्थाले कारबाही गर्ने छ |</p>
            <p>
              १२. आज मिति{' '}
              <strong>{convertToNepaliNumber(rule.VisitDate) || rule.VisitDate}</strong> मा म स्वयम् ऋणी आफै संस्थामा उपस्थित भइ ऋणको सम्पूर्ण परामर्श लिई उल्लेखित सर्तहरु पालना गर्दछु भनि एक प्रति बुझी लिई सहिछाप गरिदिए |
            </p>
            <p>
              १३. बजार दर अनुसार संचालक समितिले ब्याजदर{' '}
              <strong>{convertToNepaliNumber(rule.ChangeIntRate) || rule.ChangeIntRate || '…'}%</strong> सम्म हेरफेर गर्न सक्छ |
            </p>
            <p>१४. यो सहकारी सबै सदस्यको साझा संस्था हो, यसको नीति नियमको पालना गरि आफ्नो मान, इज्जत, प्रतिष्ठा र संस्थाको छविलाई उच्च राख्न सहयोगको अपेक्षा गर्दछौ |</p>
          </div>

          {/* Counseling Attendees */}
          <div className="border-t pt-4 mb-6">
            <p className="font-bold underline text-sm mb-3">परामर्शमा उपस्थित हुनेको विवरण:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p>१. नाम थर: <strong>{m?.FullName || '—'}</strong></p>
                <p className="text-xs text-slate-400 mt-6">दस्तखत: ________________________</p>
              </div>
              <div>
                <p>२. नाम थर: <strong>{rule.Person2 || '—'}</strong></p>
                <p className="text-xs text-slate-400 mt-6">दस्तखत: ________________________</p>
              </div>
            </div>
          </div>

          {/* Staff Sign */}
          <div className="text-right border-t pt-4">
            <p className="text-xs text-slate-400 mb-8">दस्तखत: ________________________</p>
            <p className="text-sm font-semibold text-slate-900">{rule.StaffName || 'कर्मचारीको नाम'}</p>
            <p className="text-xs text-slate-600 font-medium">{rule.StaffPost || 'पद'}</p>
          </div>
        </div>

        {/* ── Right Column: History & Approval Status Sidebar ────────── */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
              <Clock className="size-4 text-slate-500" /> स्थिति तथा इतिहास (Status & History)
            </h3>

            {/* Status Badge Item */}
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">स्वीकृति स्थिति:</span>
                <StatusBadge status={isApproved ? 'APPROVED' : 'PENDING'} />
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">शाखा:</span>
                <span className="font-medium text-slate-900">{rule.branch_name || rule.BranchID || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">फारम मिति:</span>
                <span className="font-mono text-slate-800">{rule.EntryDate || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">परामर्श मिति:</span>
                <span className="font-mono text-slate-800">{rule.VisitDate || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">दर्ता गर्ने:</span>
                <span className="font-medium text-slate-900">{rule.CreatedByName || '—'}</span>
              </div>

              {isApproved ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mt-4">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">प्रमाणित / स्वीकृत</p>
                      <p className="text-sm font-medium text-emerald-800 mt-0.5">{rule.ApprovedBy || '—'}</p>
                      <p className="text-xs text-emerald-700 mt-1">
                        मिति: {rule.ApprovedAt ? new Date(rule.ApprovedAt).toLocaleString() : '—'}
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
                    <p className="text-xs font-semibold text-slate-800 mb-3">यो ऋण शर्त फारम प्रमाणित/स्वीकृत गर्ने?</p>
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
                    <Check className="size-4" /> शर्त प्रमाणित गर्नुहोस्
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
