import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { loanManjurinaamaApi } from '../../api/loanManjurinaama';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';

export default function LoanManjurinaamaPrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanManjurinaamaApi.get(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'विवरण प्राप्त गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (error || !data) return <p className="p-4 text-sm text-stamp">{error || 'डाटा फेला परेन।'}</p>;

  const { manjurinaama: m, member: mem, enterprise: ent } = data;
  const memberAge = mem?.DOB ? calculateAgeFromNepaliDate(mem.DOB) : '';
  const loanWords = m.LoanAmount ? convertToNepaliWords(m.LoanAmount) : '';

  return (
    <>
      {/* Top action bar - Hidden when printing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/loan/manjurinaama/${id}`} className="btn-secondary">
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
            <div className="company-info text-center border-b pb-3 mb-4">
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
            <div className="text-center font-bold text-base border-b border-black pb-1 mb-4">
              मञ्जुरीनामा
            </div>

            {/* Document Content */}
            <div className="text-[12.5px] leading-relaxed text-justify space-y-2.5 mb-4">
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
            <div className="mb-4">
              <h4 className="font-bold text-xs border-b border-black pb-0.5 mb-1.5">तपसिल (धितो जग्गा विवरण)</h4>
              <table className="w-full border-collapse border border-black text-[11px] text-left">
                <thead>
                  <tr className="bg-slate-100 font-semibold">
                    <th className="border border-black p-1.5">जग्गा धनीको नामथर र ठेगाना</th>
                    <th className="border border-black p-1.5">बुबाको नामथर</th>
                    <th className="border border-black p-1.5">पतिको/पत्निको नामथर</th>
                    <th className="border border-black p-1.5">जग्गाको ठेगाना</th>
                    <th className="border border-black p-1.5">वडा नं. / ब्लक नं.</th>
                    <th className="border border-black p-1.5">कित्ता नं.</th>
                    <th className="border border-black p-1.5">क्षेत्रफल</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1.5 font-medium">
                      {m.LandDhitoPersonName || '—'}<br />
                      <span className="text-[10px]">
                        {[m.LandDhitoPersonMUNVDC, m.LandDhitoPersonDistrict].filter(Boolean).join(', ')}
                      </span>
                    </td>
                    <td className="border border-black p-1.5">{m.LandDhitoPersonFather || '—'}</td>
                    <td className="border border-black p-1.5">{m.LandDhitoPersonSpouse || '—'}</td>
                    <td className="border border-black p-1.5">{m.LandDhitoAddress || '—'}</td>
                    <td className="border border-black p-1.5">{m.LandDhitoWardBlockNo || '—'}</td>
                    <td className="border border-black p-1.5">{m.LandDhitoKittaNo || '—'}</td>
                    <td className="border border-black p-1.5">{m.LandDhitoArea || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures & Thumbprints */}
            <div className="grid grid-cols-3 gap-4 text-xs border border-black p-3 mb-4">
              {/* मञ्जुरीनामा गराउने */}
              <div className="flex flex-col justify-between">
                <div>
                  <p className="font-bold border-b border-black pb-1 mb-2">मञ्जुरीनामा गराउने</p>
                  <p className="mt-5">दस्तखत: _________________</p>
                  <p className="font-semibold mt-2">नाम: {m.StaffName || 'ऋण विभाग प्रमुख'}</p>
                  <p>पद: {m.StaffPost || 'ऋण विभाग प्रमुख'}</p>
                </div>
                <p className="mt-2 text-[11px]">मिति: {convertToNepaliNumber(m.EntryDate) || m.EntryDate}</p>
              </div>

              {/* मञ्जुरीनामा दिने */}
              <div className="text-center flex flex-col justify-between border-x border-black px-2">
                <div>
                  <p className="font-bold border-b border-black pb-1 mb-1">मञ्जुरीनामा दिने (जग्गाधनी)</p>
                  <p className="font-semibold mt-1">{m.LandDhitoPersonName || '—'}</p>
                  <div className="flex justify-center gap-2 my-2">
                    <div className="w-12 h-14 border border-black flex items-center justify-center text-[10px]">दायाँ</div>
                    <div className="w-12 h-14 border border-black flex items-center justify-center text-[10px]">बायाँ</div>
                  </div>
                </div>
                <p className="text-[11px]">दस्तखत: _______________</p>
              </div>

              {/* मञ्जुरीनामा लिने */}
              <div className="text-center flex flex-col justify-between">
                <div>
                  <p className="font-bold border-b border-black pb-1 mb-1">मञ्जुरीनामा लिने (ऋणी सदस्य)</p>
                  <p className="font-semibold mt-1">{mem?.FullName || m.MemberNo}</p>
                  <div className="flex justify-center gap-2 my-2">
                    <div className="w-12 h-14 border border-black flex items-center justify-center text-[10px]">दायाँ</div>
                    <div className="w-12 h-14 border border-black flex items-center justify-center text-[10px]">बायाँ</div>
                  </div>
                </div>
                <p className="text-[11px]">दस्तखत: _______________</p>
              </div>
            </div>

            {/* Witnesses Block */}
            <div className="border border-black p-3 text-xs mb-4">
              <p className="font-bold border-b border-black pb-1 mb-2">रोहबरका साक्षीहरु:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">१. साक्षी:</p>
                  <p>नाम: <strong>{m.SachiName1 || '—'}</strong> (उमेर: {convertToNepaliNumber(m.SachiAge1) || m.SachiAge1 || '—'} वर्ष)</p>
                  <p>ठेगाना: {m.SachiDistrict1 || '—'} जिल्ला {m.SachiMUNVDC1 || '—'} वडा नं. {convertToNepaliNumber(m.SachiWardNo1) || m.SachiWardNo1 || '—'}</p>
                  <p className="mt-4">दस्तखत: ________________________</p>
                </div>
                <div>
                  <p className="font-semibold">२. साक्षी:</p>
                  <p>नाम: <strong>{m.SachiName2 || '—'}</strong> (उमेर: {convertToNepaliNumber(m.SachiAge2) || m.SachiAge2 || '—'} वर्ष)</p>
                  <p>ठेगाना: {m.SachiDistrict2 || '—'} जिल्ला {m.SachiMUNVDC2 || '—'} वडा नं. {convertToNepaliNumber(m.SachiWardNo2) || m.SachiWardNo2 || '—'}</p>
                  <p className="mt-4">दस्तखत: ________________________</p>
                </div>
              </div>
            </div>

            {/* ईति सम्वत् Line */}
            <div className="text-center font-bold text-xs border-t border-black pt-3">
              ईति सम्वत् {convertToNepaliNumber(m.LegalYear) || m.LegalYear || '…………'} साल{' '}
              {m.LegalMonth || '…………'} महिना{' '}
              {convertToNepaliNumber(m.LegalDay) || m.LegalDay || '……'} गते{' '}
              {convertToNepaliNumber(m.LegalDayOfWeek) || m.LegalDayOfWeek || '……'} रोज शुभम् |
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

