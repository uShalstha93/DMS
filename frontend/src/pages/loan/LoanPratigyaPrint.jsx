import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { loanPratigyaApi } from '../../api/loanPratigya';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';

export default function LoanPratigyaPrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanPratigyaApi.get(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'विवरण प्राप्त गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (error || !data) return <p className="p-4 text-sm text-stamp">{error || 'डाटा फेला परेन।'}</p>;

  const { pratigya: p, member: m, enterprise: ent } = data;

  return (
    <>
      {/* Top action bar - Hidden when printing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/loan/pratigya/${id}`} className="btn-secondary">
          <ArrowLeft className="size-4" />फर्कनुहोस्
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
            <div className="company-info text-center border-b pb-3 mb-6">
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
            <div className="flex justify-end items-center mb-4 text-sm">
              <span className="font-bold mr-1">मिति:</span>
              <span>{convertToNepaliNumber(p.EntryDate) || p.EntryDate}</span>
            </div>

            {/* Title */}
            <div className="text-center font-bold text-base border-b border-black pb-1 mb-5">
              प्रतिज्ञा पत्र फारम:
            </div>

            {/* 8 Clauses */}
            <div className="text-[13px] leading-relaxed text-justify space-y-3">
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
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.RateOfInterest) || p.RateOfInterest || '……'}
                </span>
                % रहेको छ |
              </p>
              <p>
                ६. मैले लिएको ऋणको ब्याज नियमित तिरेमा परियोजना अनुसार जति ब्याजदर निर्धारण गरिएको अनुसार लाग्ने छ र{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.Day1) || p.Day1 || '…'}
                </span>{' '}
                देखि{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.Day2) || p.Day2 || '…'}
                </span>{' '}
                दिन भित्र आएमा{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.AddInterest1) || p.AddInterest1 || '…'}
                </span>
                % ब्याज लाग्ने छ,{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.Day3) || p.Day3 || '…'}
                </span>{' '}
                देखि{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.Day4) || p.Day4 || '…'}
                </span>{' '}
                दिन भित्र आएमा{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.AddInterest2) || p.AddInterest2 || '…'}
                </span>
                % ब्याज लाग्ने छ | त्यसै गरि{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.Day5) || p.Day5 || '…'}
                </span>{' '}
                देखि{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.Day6) || p.Day6 || '…'}
                </span>{' '}
                दिन भित्र आएमा{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.AddInterest3) || p.AddInterest3 || '…'}
                </span>
                % ब्याज लाग्दै जाने छ |
              </p>
              <p>
                ७. मैले लिएको ऋणको किस्ताको भाका नाघेमा भाखा नागेको दिन देखि{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.KistaDay1) || p.KistaDay1 || '…'}
                </span>{' '}
                दिन सम्म किस्ता नआएमा भाका नाघेको किस्ताको{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.Fine1) || p.Fine1 || '…'}
                </span>
                % ले हर्जना,{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.KistaDay2) || p.KistaDay2 || '…'}
                </span>{' '}
                दिन सम्म किस्ता नआएमा{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.Fine2) || p.Fine2 || '…'}
                </span>
                % हर्जाना र{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.KistaDay3) || p.KistaDay3 || '…'}
                </span>{' '}
                दिन सम्म किस्ता नआएमा{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.Fine3) || p.Fine3 || '…'}
                </span>
                % हर्जाना तिर्न मन्जुर छु |
              </p>
              <p>
                ८. बजार दर अनुसार संचालक समितिले ब्याजदर{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(p.ChangeableInterest) || p.ChangeableInterest || '…'}
                </span>
                % सम्म हेरफेर गरेको दरमा म ऋण र ब्याज तिर्न मंजुर रहेको छु |
              </p>
            </div>
          </div>

          {/* Bottom Signatures */}
          <div className="mt-8 pt-4 border-t border-black/40">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="mb-6">हस्ताक्षर: ________________________</span>
                <span>ऋण लिनेको नाम: <strong className="underline ml-1">{m?.FullName || '—'}</strong></span>
                <span className="text-xs text-black/80 mt-1">
                  ठेगाना: {m?.TmpMUNVDC ? `${m.TmpMUNVDC} - ${m.TmpWardNo || ''}, ${m.TmpTole || ''}` : '—'}
                </span>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="mb-6">दस्तखत: ________________________</span>
                <span className="font-bold text-sm">{p.StaffName || 'कर्मचारीको नाम'}</span>
                <span className="text-xs">{p.StaffPost || 'पद'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

