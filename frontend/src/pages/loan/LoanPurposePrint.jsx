import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { loanPurposeApi } from '../../api/loanPurpose';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber, formatNepaliCurrency } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';

export default function LoanPurposePrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanPurposeApi.get(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'विवरण प्राप्त गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (error || !data) return <p className="p-4 text-sm text-stamp">{error || 'डाटा फेला परेन।'}</p>;

  const { loanPurpose: p, member: mem, loan: l, enterprise: ent } = data;
  const loanWords = p.LoanAmountWords || (p.LoanAmount ? convertToNepaliWords(p.LoanAmount) : '');

  // Block printing if not approved
  if (!p.ApprovedStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="rounded-full bg-amber-100 p-4">
          <Printer className="size-10 text-amber-500" />
        </div>
        <p className="text-lg font-semibold text-amber-700">यो विवरण अझै प्रमाणित/स्वीकृत भएको छैन।</p>
        <p className="text-sm text-slate-500">प्रमाणीकरण पश्चात मात्र यो विवरण प्रिन्ट गर्न सकिन्छ।</p>
        <Link to={`/loan/purpose/${id}`} className="btn-secondary inline-flex items-center gap-2 mt-2">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Top action bar - Hidden when printing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/loan/purpose/${id}`} className="btn-secondary">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
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
      <div className="print-area mx-auto max-w-[210mm] bg-white p-8 text-black shadow-sm print:m-0 print:p-0 print:shadow-none font-serif text-[11pt] leading-normal">
        <style dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 15mm 15mm;
            }
            @media print {
              body {
                background: white !important;
                color: black !important;
                font-size: 11pt !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              .print-area {
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                max-width: 100% !important;
              }
            }
          `
        }} />

        {/* Company Info Header */}
        <div className="text-center pb-3 border-b border-black mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wider text-black">
            {ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}
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

        {/* Date Row */}
        <div className="flex justify-end text-sm mb-4">
          <div>
            <span className="font-bold">मिति : {convertToNepaliNumber(p.EntryDate) || '................'}</span>
          </div>
        </div>

        {/* Summary Table */}
        <div className="flex justify-center mb-6">
          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td colSpan={2} className="border border-black px-3 py-1.5 font-bold bg-gray-100 text-center">
                  ऋण सदुपयोग गर्ने विवरण
                </td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-semibold w-1/3">सदस्य नं.</td>
                <td className="border border-black px-3 py-1.5 font-bold">
                  {convertToNepaliNumber(p.MemberNo) || p.MemberNo || '—'}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-semibold">ऋणीको नाम</td>
                <td className="border border-black px-3 py-1.5 font-bold">
                  {p.BorrowerName || mem?.FullName || '—'}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-semibold">ऋणीको ठेगाना</td>
                <td className="border border-black px-3 py-1.5 font-bold">
                  {p.BorrowerAddress || '—'}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-semibold">ऋण लगानीको शिर्षक</td>
                <td className="border border-black px-3 py-1.5 font-bold">
                  {p.LoanPurpose || l?.LoanPurpose || '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legal Commitment Paragraph */}
        <div className="space-y-4 text-justify leading-relaxed text-[11pt]">
          <p className="indent-10">
            म यस <span className="font-bold">{ent?.CompanyName || ent?.companyname || 'संस्था'}</span>को शेयर सदस्य भइ नियमित रुपमा बचत गरिरहेकोले हाल मलाई तपशिलमा उल्लेखित उद्देश्य बमोजिम रु.{' '}
            <span className="font-bold underline px-1">
              {p.LoanAmount ? formatNepaliCurrency(p.LoanAmount) : '.............'}
            </span>{' '}
            (अक्षरेपी रु.{' '}
            <span className="font-bold underline px-1">
              {loanWords || '....................................................................'}
            </span>{' '}
            मात्र) ऋण आवश्यक भएकाले उक्त रकम उपलब्ध गरिदिनुहुन अनुरोध गर्दछु | उक्त ऋण रकमको किस्ता र ब्याज तिर्ने मेरो आम्दानीको श्रोत{' '}
            <span className="font-bold underline px-1">{p.IncomeSource || 'नोकरी'}</span> रहेको छ | मैले यस संस्थाबाट लिएको ऋण तल उल्लेखित शिर्षकमा सदुपयोग गरि नियमित बचत, ऋणको ब्याज र किस्ता समयमा भुक्तानी गर्ने प्रतिबद्धता व्यक्त गर्दछु|
          </p>

          {/* Basis of Loan Investment */}
          <div className="mt-4 pt-2">
            <h3 className="font-bold text-sm">ऋण लगानी सम्बन्धि आधारहरु:</h3>
            <h4 className="font-bold text-sm pl-4 mt-1">{p.LoanPurposeCategory || p.LoanPurpose || '(झ) घरायसी/सामाजिक कार्य ऋण'}</h4>
            <div className="pl-6 mt-2 space-y-2">
              <div className="flex">
                <span className="font-bold whitespace-nowrap">१. कुन कार्य गर्ने हो ? :-</span>
                <span className="font-bold border-b border-dotted border-black ml-2 flex-1 pb-0.5">
                  {p.LoanPurposeDetail1 || ''}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold whitespace-nowrap">२. कसको/कसका लागि गर्ने हो? :-</span>
                <span className="font-bold border-b border-dotted border-black ml-2 flex-1 pb-0.5">
                  {p.LoanPurposeDetail2 || ''}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold whitespace-nowrap">३. अन्य विवरण :-</span>
                <span className="font-bold border-b border-dotted border-black ml-2 flex-1 pb-0.5">
                  {p.OtherDetail || ''}
                </span>
              </div>
            </div>
          </div>

          <p className="indent-10 mt-6">
            माथि उल्लेखित परियोजना/ शिर्षक बाहेक अन्य क्षेत्रमा ऋणको प्रयोग गरेको पाइएमा संस्थाले गर्ने कारबाहीमा कुनै उजुर-वाजुर गर्ने छैन |
          </p>
        </div>

        {/* Signature Box */}
        <div className="mt-16 flex justify-end">
          <div className="text-right space-y-3 pr-4">
            <div className="h-10"></div>
            <div className="font-bold">
              हस्ताक्षर: ............................
            </div>
            <div className="font-bold text-sm">
              ऋणीको नाम: {p.BorrowerName || mem?.FullName || '............................'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
