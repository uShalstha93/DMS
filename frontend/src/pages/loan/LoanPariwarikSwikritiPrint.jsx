import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { loanPariwarikSwikritiApi } from '../../api/loanPariwarikSwikriti';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';

export default function LoanPariwarikSwikritiPrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanPariwarikSwikritiApi.get(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'विवरण प्राप्त गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (error || !data) return <p className="p-4 text-sm text-stamp">{error || 'डाटा फेला परेन।'}</p>;

  const { pariwarikSwikriti: p, member: mem, enterprise: ent } = data;
  const memberAge = mem?.DOB ? calculateAgeFromNepaliDate(mem.DOB) : '';
  const loanWords = p.LoanAmount ? convertToNepaliWords(p.LoanAmount) : '';

  return (
    <>
      {/* Top action bar - Hidden when printing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/loan/pariwarik-swikriti/${id}`} className="btn-secondary">
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

            {/* Title */}
            <div className="text-center font-bold text-base border-b border-black pb-1 mb-6">
              पारिवारिक स्वीकृत फारम
            </div>

            {/* Document Content */}
            <div className="text-[13px] leading-relaxed text-justify space-y-3 mb-8">
              <p className="before:inline-block before:w-8">
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
            <div className="border border-black p-4 mb-6">
              <p className="font-bold border-b border-black pb-1 mb-4 text-sm">पारिवारिक स्वीकृति</p>
              <div className="grid grid-cols-2 gap-6 items-center text-xs">
                <div>
                  <p className="mb-4">हस्ताक्षर: ________________________</p>
                  <p className="font-semibold text-sm">नाम: {p.RelativeName || '—'}</p>
                  <p className="mt-1">नाता: <strong>{p.Relationship || '—'}</strong></p>
                </div>
                <div className="flex justify-end gap-3">
                  <div className="w-16 h-20 border border-black flex items-center justify-center text-[10px]">
                    दायाँ
                  </div>
                  <div className="w-16 h-20 border border-black flex items-center justify-center text-[10px]">
                    बायाँ
                  </div>
                </div>
              </div>
            </div>

            {/* ईति सम्वत् Line */}
            <div className="text-center font-bold text-xs border-t border-black pt-4 mb-8">
              ईति सम्वत् {convertToNepaliNumber(p.LegalYear) || p.LegalYear || '…………'} साल{' '}
              {p.LegalMonth || '…………'} महिना{' '}
              {convertToNepaliNumber(p.LegalDay) || p.LegalDay || '……'} गते{' '}
              {convertToNepaliNumber(p.LegalDayOfWeek) || p.LegalDayOfWeek || '……'} रोज शुभम् |
            </div>

            {/* Bottom Officers */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs border-t border-black pt-6">
              <div>
                <p className="mb-8">दस्तखत: ________________________</p>
                <p className="font-bold text-sm">ऋण विभाग प्रमुख</p>
                <p className="mt-1">नाम थर: {p.LoanBhibhagPramukh || '—'}</p>
              </div>
              <div>
                <p className="mb-8">दस्तखत: ________________________</p>
                <p className="font-bold text-sm">कार्यालय प्रमुख</p>
                <p className="mt-1">नाम थर: {p.KaryalayaPramukh || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

