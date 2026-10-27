import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, Printer, Edit, Clock, CheckCircle2, AlertCircle, Trash2, Building2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { loanApplicationsApi } from '../../api/loanApplications';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';

export default function ViewLoanApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const canApprove = user?.permissions?.includes('loanapplication.approve');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () => {
    loanApplicationsApi.get(id)
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
      await loanApplicationsApi.approve(id);
      setConfirming(false);
      setMessage({ type: 'ok', text: 'कर्जा प्रस्ताव सफलतापूर्वक प्रमाणित/स्वीकृत भयो।' });
      load();
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'स्वीकृत गर्न सकिएन') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('के तपाईं साँच्चै यो कर्जा प्रस्ताव मेटाउन चाहनुहुन्छ?')) return;
    setBusy(true);
    try {
      await loanApplicationsApi.remove(id);
      navigate('/loan/application', { state: { message: 'कर्जा प्रस्ताव सफलतापूर्वक मेटाइयो।' } });
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'मेटाउन सकिएन') });
      setBusy(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (message.type === 'error' && !data) return <p className="p-4 text-sm text-stamp">{message.text}</p>;
  if (!data) return null;

  const { application: app, member: m, loan: l, loanRequest: lr, enterprise: ent, can_edit, can_delete } = data;
  const isApproved = app.ApprovedStatus === 1;
  const loanWords = app.LoanAmount ? convertToNepaliWords(app.LoanAmount) : '';
  const requestDate = lr?.EntryDate || l?.EntryDate || '';

  return (
    <>
      <PageHeader
        title="कर्जा प्रस्ताव"
        subtitle={`${m?.FullName || app.MemberNo} (ऋण नं. ${app.LoanNo})`}
      >
        <Link to="/loan/application" className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
        {can_edit && (
          <Link to={`/loan/application/edit/${id}`} className="btn-secondary">
            <Edit className="size-4" /> सम्पादन गर्नुहोस्
          </Link>
        )}
        {isApproved && (
          <Link to={`/loan/application/print/${id}`} className="btn-primary">
            <Printer className="size-4" />A4 प्रिन्ट गर्नुहोस्
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

      {/* Approval Banner */}
      {/* {!app.ApprovedStatus ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div>
            <p className="font-medium text-amber-900">यो कर्जा प्रस्ताव हाल प्रमाणीकरणको पर्खाइमा छ (PENDING)</p>
            <p className="text-xs text-amber-700">प्रमाणित भएपछि मात्र औपचारिक स्वीकृति मानिनेछ।</p>
          </div>
          {canApprove && (
            confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">निश्चित हुनुहुन्छ?</span>
                <button
                  type="button"
                  onClick={approve}
                  disabled={busy}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  हो, स्वीकृत गर्नुहोस्
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  रद्द
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <Check className="size-4" /> प्रस्ताव स्वीकृत/प्रमाणित गर्नुहोस्
              </button>
            )
          )}
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="size-5" />
            </span>
            <div>
              <p className="font-medium text-emerald-900">कर्जा प्रस्ताव स्वीकृत भइसकेको छ (APPROVED)</p>
              <p className="text-xs text-emerald-700">
                स्वीकृत गर्ने: <strong>{app.ApprovedBy || '—'}</strong> ({app.ApprovedAt ? new Date(app.ApprovedAt).toLocaleDateString() : '—'})
              </p>
            </div>
          </div>
          <StatusBadge status="APPROVED" />
        </div>
      )} */}

      {/* Main Letter Card */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6 items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {/* Letter Head */}
          <div className="text-center border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900">{ent?.companyname || 'हाम्रो सहकारी संस्था लि.'}</h2>
            <p className="text-sm text-slate-600">
              {ent?.district || ''} {ent?.munvdc ? `, ${ent.munvdc}` : ''} {ent?.wardno ? `-${convertToNepaliNumber(ent.wardno)}` : ''}, {ent?.tole || ''}
            </p>
            <div className="mt-2 text-xs text-slate-500">
              सम्पर्क: {ent?.contactno || '—'} | प्यान नं: {ent?.panno || '—'}
            </div>
          </div>

          {/* Date and Addressee */}
          <div className="flex justify-between items-start mb-6">
            <div className="text-sm">
              <p className="font-semibold text-slate-900">श्री {m?.FullName || app.MemberNo} ज्यु,</p>
              <p className="text-slate-600">
                {m?.TmpMUNVDC ? `${m.TmpMUNVDC} - ${m.TmpWardNo}, ${m.TmpTole || ''}` : '—'}
              </p>
              <p className="text-xs text-slate-500">सदस्यता नं: {app.MemberNo}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-slate-900">मिति: {convertToNepaliNumber(app.EntryDate) || app.EntryDate}</p>
            </div>
          </div>

          {/* Subject */}
          <div className="text-center font-bold text-base text-slate-900 border-b border-dashed pb-2 mb-6">
            विषय: कर्जा प्रस्ताव सम्बन्धमा |
          </div>

          {/* Body */}
          <div className="text-sm text-slate-800 leading-relaxed text-justify space-y-4 mb-10">
            <p>महोदय,</p>
            <p className="indent-8">
              उपर्युक्त सम्बन्धमा तपाइले मिति <strong>{convertToNepaliNumber(requestDate) || requestDate || '…………'}</strong> मा पेश गर्नु भएको ऋण माग फारममा संस्थाको ऋण उपसमितिको{' '}
              <strong>{convertToNepaliNumber(app.MeetingNo) || app.MeetingNo || '…'}</strong> औं बैठकले ऋण नं.{' '}
              <strong>{convertToNepaliNumber(app.LoanNo) || app.LoanNo}</strong> रु.{' '}
              <strong>{convertToNepaliNumber(app.LoanAmount) || app.LoanAmount}</strong> (अक्षरेपी रु.{' '}
              <strong>{loanWords}</strong> मात्र) हाल{' '}
              <strong>{convertToNepaliNumber(app.RateOfInterest) || app.RateOfInterest}%</strong> ले ब्याजदरका दरले ब्याज लाग्ने गरि तथा संस्थाको नियमानुसार समय समयमा परिवर्तित ब्याजदर अनुसार रहने गरि कर्जा स्वीकृत भएको जानकारी गराउदछौ |
            </p>
          </div>

          {/* Signature Area */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t">
            <div>
              <p className="text-xs text-slate-400 mb-10">हस्ताक्षर: ________________________</p>
              <p className="text-sm font-medium text-slate-900">ऋण लिनेको नाम: {m?.FullName || '—'}</p>
              <p className="text-xs text-slate-600">
                ठेगाना: {m?.TmpMUNVDC ? `${m.TmpMUNVDC} - ${m.TmpWardNo}, ${m.TmpTole || ''}` : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-10">हस्ताक्षर: ________________________</p>
              <p className="text-sm font-semibold text-slate-900">{app.StaffName || 'कर्मचारीको नाम'}</p>
              <p className="text-xs text-slate-600 font-medium">{app.StaffPost || 'पद'}</p>
            </div>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
              <Clock className="size-4 text-slate-500" /> स्थिति तथा इतिहास (Status & History)
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">स्वीकृति स्थिति:</span>
                <StatusBadge status={isApproved ? 'APPROVED' : 'PENDING'} />
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">शाखा:</span>
                <span className="font-medium text-slate-900">{app.branch_name || app.BranchID || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">फारम मिति:</span>
                <span className="font-mono text-slate-800">{app.EntryDate || '—'}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-slate-600">दर्ता गर्ने:</span>
                <span className="font-medium text-slate-900">{app.CreatedByName || '—'}</span>
              </div>

              {isApproved ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mt-4">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">प्रमाणित / स्वीकृत</p>
                      <p className="text-sm font-medium text-emerald-800 mt-0.5">{app.ApprovedBy || '—'}</p>
                      <p className="text-xs text-emerald-700 mt-1">
                        मिति: {app.ApprovedAt ? new Date(app.ApprovedAt).toLocaleString() : '—'}
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
                    <p className="text-xs font-semibold text-slate-800 mb-3">यो कर्जा प्रस्ताव फारम प्रमाणित/स्वीकृत गर्ने?</p>
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

