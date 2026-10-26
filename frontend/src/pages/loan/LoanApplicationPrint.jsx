import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { loanApplicationsApi } from '../../api/loanApplications';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';

export default function LoanApplicationPrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanApplicationsApi.get(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'विवरण प्राप्त गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (error || !data) return <p className="p-4 text-sm text-stamp">{error || 'डाटा फेला परेन।'}</p>;

  const { application: app, member: m, loan: l, loanRequest: lr, enterprise: ent } = data;
  const loanWords = app.LoanAmount ? convertToNepaliWords(app.LoanAmount) : '';
  const requestDate = lr?.EntryDate || l?.EntryDate || '';

  return (
    <>
      {/* Top action bar - Hidden when printing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/loan/application/${id}`} className="btn-secondary">
          <ArrowLeft className="size-4" /> विवरणमा फर्कनुहोस्
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Printer className="size-4" /> प्रिन्ट गर्नुहोस् (Print A4)
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="print-area mx-auto max-w-[210mm] bg-white p-8 text-black shadow-sm print:m-0 print:p-0 print:shadow-none">
        <div className="print-page min-h-[297mm] p-6 flex flex-col justify-between">
          <div>
            {/* Header / Enterprise Details */}
            <div className="text-center border-b pb-4 mb-8">
              <h1 className="text-2xl font-bold text-black tracking-wide">
                {ent?.companyname || 'हाम्रो सहकारी संस्था लि.'}
              </h1>
              <h2 className="text-sm font-medium text-black mt-1">
                {ent?.munvdc ? `${ent.munvdc}` : ''}
                {ent?.wardno ? ` - ${convertToNepaliNumber(ent.wardno)}` : ''}
                {ent?.district ? `, ${ent.district}` : ''}
                {ent?.province ? `, ${ent.province}` : ''}
              </h2>
              <div className="text-xs text-black mt-1">
                {ent?.contactno ? `फोन नं: ${ent.contactno}` : ''}
                {ent?.panno ? ` | प्यान नं: ${ent.panno}` : ''}
                {ent?.email ? ` | इमेल: ${ent.email}` : ''}
              </div>
            </div>

            {/* Date (Right aligned) */}
            <div className="flex justify-end items-center mb-6 text-sm">
              <span className="font-bold mr-1">मिति:</span>
              <span>{convertToNepaliNumber(app.EntryDate) || app.EntryDate}</span>
            </div>

            {/* Addressee Info (Left) */}
            <div className="mb-6 text-sm leading-relaxed">
              <p className="font-bold">श्री {m?.FullName || app.MemberNo} ज्यु,</p>
              <p>
                {m?.TmpMUNVDC ? `${m.TmpMUNVDC} - ${m.TmpWardNo}, ${m.TmpTole || ''}` : '………………………'}
              </p>
              <p className="text-xs">सदस्यता नं: {app.MemberNo}</p>
            </div>

            {/* Subject */}
            <div className="text-center font-bold text-base underline underline-offset-4 mb-8">
              विषय: कर्जा प्रस्ताव सम्बन्धमा |
            </div>

            {/* Letter Body */}
            <div className="text-sm leading-8 text-justify space-y-4">
              <p className="font-semibold">महोदय,</p>
              <p className="indent-10">
                उपर्युक्त सम्बन्धमा तपाइले मिति{' '}
                <span className="font-bold border-b border-black px-2 pb-0.5">
                  {convertToNepaliNumber(requestDate) || requestDate || '……………'}
                </span>{' '}
                मा पेश गर्नु भएको ऋण माग फारममा संस्थाको ऋण उपसमितिको{' '}
                <span className="font-bold border-b border-black px-2 pb-0.5">
                  {convertToNepaliNumber(app.MeetingNo) || app.MeetingNo || '…'}
                </span>{' '}
                औं बैठकले ऋण नं.{' '}
                <span className="font-bold border-b border-black px-2 pb-0.5">
                  {convertToNepaliNumber(app.LoanNo) || app.LoanNo}
                </span>{' '}
                रु.{' '}
                <span className="font-bold border-b border-black px-2 pb-0.5">
                  {convertToNepaliNumber(app.LoanAmount) || app.LoanAmount}
                </span>{' '}
                (अक्षरेपी रु.{' '}
                <span className="font-bold border-b border-black px-2 pb-0.5">
                  {loanWords || '……………………………………………'}
                </span>{' '}
                मात्र) हाल{' '}
                <span className="font-bold border-b border-black px-2 pb-0.5">
                  {convertToNepaliNumber(app.RateOfInterest) || app.RateOfInterest}
                </span>
                % ले ब्याजदरका दरले ब्याज लाग्ने गरि तथा संस्थाको नियमानुसार समय समयमा परिवर्तित ब्याजदर अनुसार रहने गरि कर्जा स्वीकृत भएको जानकारी गराउदछौ |
              </p>
            </div>
          </div>

          {/* Bottom Signatures Area */}
          <div className="mt-20 pt-8 border-t border-black/30">
            <div className="grid grid-cols-2 gap-8 text-sm">
              {/* Member Sign */}
              <div>
                <p className="mb-4">हस्ताक्षर: _____________________________</p>
                <p className="font-bold">ऋण लिनेको नाम: {m?.FullName || '—'}</p>
                <p className="text-xs mt-1">
                  ठेगाना: {m?.TmpMUNVDC ? `${m.TmpMUNVDC} - ${m.TmpWardNo}, ${m.TmpTole || ''}` : '—'}
                </p>
              </div>

              {/* Staff Sign */}
              <div className="text-right">
                <p className="mb-4">हस्ताक्षर: _____________________________</p>
                <p className="font-bold">{app.StaffName || 'कर्मचारीको नाम'}</p>
                <p className="text-xs font-semibold mt-1">{app.StaffPost || 'पद'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

