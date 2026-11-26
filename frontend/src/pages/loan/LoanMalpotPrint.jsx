import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { loanMalpotApi } from '../../api/loanMalpot';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber, formatNepaliCurrency } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';

export default function LoanMalpotPrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanMalpotApi.get(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'विवरण प्राप्त गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (error || !data) return <p className="p-4 text-sm text-stamp">{error || 'डाटा फेला परेन।'}</p>;

  const { malpotApplication: m, member: mem, loan: l, enterprise: ent } = data;
  const loanWords = m.LoanAmountWords || (m.LoanAmount ? convertToNepaliWords(m.LoanAmount) : '');

  // Block printing if not approved
  if (!m.ApprovedStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="rounded-full bg-amber-100 p-4">
          <Printer className="size-10 text-amber-500" />
        </div>
        <p className="text-lg font-semibold text-amber-700">यो विवरण अझै प्रमाणित/स्वीकृत भएको छैन।</p>
        <p className="text-sm text-slate-500">प्रमाणीकरण पश्चात मात्र यो विवरण प्रिन्ट गर्न सकिन्छ।</p>
        <Link to={`/loan/malpot-application/${id}`} className="btn-secondary inline-flex items-center gap-2 mt-2">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
      </div>
    );
  }

  const orgName = ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.';
  const orgAddr = [
    ent?.munvdc || ent?.VDCMUN,
    ent?.wardno ? `- ${convertToNepaliNumber(ent.wardno)}` : '',
    ent?.district ? `, ${ent.district}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Top action bar - Hidden when printing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/loan/malpot-application/${id}`} className="btn-secondary">
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
      <div className="print-area mx-auto max-w-[210mm] bg-white p-8 text-black shadow-sm print:m-0 print:p-0 print:shadow-none text-[10.5pt] leading-normal">
        <style dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            @media print {
              body {
                background: white !important;
                color: black !important;
                font-size: 10pt !important;
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
        <div className="text-center pb-3 border-b border-black mb-5">
          <h1 className="text-xl font-bold uppercase tracking-wider text-black">
            {orgName}
          </h1>
          <h2 className="text-sm font-medium text-black mt-0.5">
            {orgAddr}
          </h2>
          {(ent?.contactno || ent?.panno || ent?.email) && (
            <div className="text-xs text-black mt-0.5">
              {ent?.contactno ? `फोन नं: ${ent.contactno}` : ''}
              {ent?.panno ? ` | प्यान नं: ${ent.panno}` : ''}
              {ent?.email ? ` | इमेल: ${ent.email}` : ''}
            </div>
          )}
        </div>

        {/* Register No, Chalaani No & Date */}
        <div className="flex justify-between items-start text-sm mb-4">
          <div className="space-y-1">
            <div>
              <span>दर्ता नं.: </span>
              <span className="font-bold">
                {m.RegisterNo || ent?.RegisterNo ? convertToNepaliNumber(m.RegisterNo || ent?.RegisterNo) : '................'}
              </span>
            </div>
            <div>
              <span>चलानी नं.: </span>
              <span className="font-bold">{convertToNepaliNumber(m.ChalaaniNo) || m.ChalaaniNo || '................'}</span>
            </div>
          </div>
          <div>
            <span>मिति: </span>
            <span className="font-bold">{convertToNepaliNumber(m.EntryDate) || '................'}</span>
          </div>
        </div>

        {/* Addressee */}
        <div className="mb-4 text-sm">
          <p className="font-medium">श्री मालपोत कार्यालय,</p>
          <p className="font-bold">{m.MalpotAddress || '................................'}</p>
        </div>

        {/* Subject */}
        <div className="text-center mb-5">
          <h3 className="font-bold underline text-base inline-block">
            बिषय: दृष्टिबन्धक पास सम्बन्धमा |
          </h3>
        </div>

        {/* Body Paragraph */}
        <div className="space-y-3 text-justify leading-relaxed text-[10.5pt]">
          <p>महोदय,</p>
          <p className="indent-10">
            उपर्युक्त सम्बन्धमा यस{' '}
            <span className="font-bold">
              {orgName}{orgAddr ? `, ${orgAddr}` : ''}
            </span>{' '}
            का शेयर सदस्य नं.{' '}
            <span className="font-bold underline px-1">
              {convertToNepaliNumber(m.MemberNo) || m.MemberNo || '........'}
            </span>{' '}
            भएका शेयर सदस्य श्री{' '}
            <span className="font-bold underline px-1">
              {m.BorrowerName || mem?.FullName || '........................'}
            </span>{' '}
            ले यस संस्थाबाट रु.{' '}
            <span className="font-bold underline px-1">
              {m.LoanAmount ? formatNepaliCurrency(m.LoanAmount) : (l?.LoanAmount ? formatNepaliCurrency(l.LoanAmount) : '............')}
            </span>{' '}
            (अक्षरेपी रु.{' '}
            <span className="font-bold underline px-1">
              {loanWords || '................................'}
            </span>{' '}
            मात्र) ऋण माग गर्नु भएको हुदा उक्त ऋणका लागि निजको र निजको श्रीमान/श्रीमती{' '}
            <span className="font-bold underline px-1">
              {m.SpouseName || mem?.SpouseName || '........................'}
            </span>{' '}
            को नाममा रहेको तपसिलको जग्गा दृष्टिबन्धक पास गरि सो को जानकारी समेत पठाइ दिनुहुन अनुरोध गर्दछौ | यस संस्थाबाट निम्न विवरण भएका प्रतिनिधि श्री{' '}
            <span className="font-bold underline px-1">
              {m.StaffName || '........................'}
            </span>{' '}
            लाई संस्थाको छाप सहित पठाइएको व्यहोरा अनुरोध छ |
          </p>
        </div>

        {/* 8-Column Land Table */}
        <div className="my-5">
          <table className="w-full border-collapse border border-black text-[9.5pt]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-1.5 py-1.5 text-center">क्र. स</th>
                <th className="border border-black px-1.5 py-1.5 text-left">जग्गा धनीको नामथर र ठेगाना</th>
                <th className="border border-black px-1.5 py-1.5 text-left">बाबुको नामथर</th>
                <th className="border border-black px-1.5 py-1.5 text-left">पति/बाजेको नामथर</th>
                <th className="border border-black px-1.5 py-1.5 text-left">जग्गाको ठेगाना</th>
                <th className="border border-black px-1.5 py-1.5 text-center">वडा नं./ब्लक नं.</th>
                <th className="border border-black px-1.5 py-1.5 text-center">कित्ता नं.</th>
                <th className="border border-black px-1.5 py-1.5 text-center">क्षेत्रफल</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-1.5 py-2 text-center align-top font-semibold">क.</td>
                <td className="border border-black px-1.5 py-2 align-top font-bold whitespace-pre-line">{m.LandHolderPersonNameAndAddress1 || ''}</td>
                <td className="border border-black px-1.5 py-2 align-top font-bold">{m.LandHolderFatherName1 || ''}</td>
                <td className="border border-black px-1.5 py-2 align-top font-bold">{m.LandHolderGrandfatherName1 || ''}</td>
                <td className="border border-black px-1.5 py-2 align-top font-bold">{m.LandAddress1 || ''}</td>
                <td className="border border-black px-1.5 py-2 text-center align-top font-bold">{m.LandWardNoBlockNo1 || ''}</td>
                <td className="border border-black px-1.5 py-2 text-center align-top font-bold">{m.LandKittaNo1 || ''}</td>
                <td className="border border-black px-1.5 py-2 text-center align-top font-bold">{m.LandArea1 || ''}</td>
              </tr>
              <tr>
                <td className="border border-black px-1.5 py-2 text-center align-top font-semibold">ख.</td>
                <td className="border border-black px-1.5 py-2 align-top font-bold whitespace-pre-line">{m.LandHolderPersonNameAndAddress2 || ''}</td>
                <td className="border border-black px-1.5 py-2 align-top font-bold">{m.LandHolderFatherName2 || ''}</td>
                <td className="border border-black px-1.5 py-2 align-top font-bold">{m.LandHolderGrandfatherName2 || ''}</td>
                <td className="border border-black px-1.5 py-2 align-top font-bold">{m.LandAddress2 || ''}</td>
                <td className="border border-black px-1.5 py-2 text-center align-top font-bold">{m.LandWardNoBlockNo2 || ''}</td>
                <td className="border border-black px-1.5 py-2 text-center align-top font-bold">{m.LandKittaNo2 || ''}</td>
                <td className="border border-black px-1.5 py-2 text-center align-top font-bold">{m.LandArea2 || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Representative Details & Signature */}
        <div className="mt-6 flex justify-between items-end">
          <div className="space-y-1.5 text-sm">
            <h4 className="font-bold underline mb-2">प्रतिनिधिको विवरण</h4>
            <p>नाम : <span className="font-bold">{m.PratinidhiName || '........................'}</span></p>
            <p>ठेगाना : <span className="font-bold">{m.PratinidhiAddress || '........................'}</span></p>
            <p>ना प्र. नं. : <span className="font-bold">{m.PratinidhiCitNo || '........................'}</span></p>
            <p>जारी मिति र जिल्ला : <span className="font-bold">{m.PratinidhiCitIssuedDateAndPlace || '........................'}</span></p>
          </div>

          <div className="text-right space-y-2 pr-4 text-sm">
            <div className="h-12"></div>
            <div className="font-bold border-t border-black pt-1 px-4">
              दस्तखत / संस्थाको छाप
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
