import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { loanBektigatJamaniApi } from '../../api/loanBektigatJamani';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';

export default function LoanBektigatJamaniPrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanBektigatJamaniApi.get(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'विवरण प्राप्त गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (error || !data) return <p className="p-4 text-sm text-stamp">{error || 'डाटा फेला परेन।'}</p>;

  const { bektigatJamani: j, member: mem, enterprise: ent } = data;
  const loanWords = j.LoanAmountWords || (j.LoanAmount ? convertToNepaliWords(j.LoanAmount) : '');

  // Block printing if not approved
  if (!j.ApprovedStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="rounded-full bg-amber-100 p-4">
          <Printer className="size-10 text-amber-500" />
        </div>
        <p className="text-lg font-semibold text-amber-700">यो तमसुक अझै प्रमाणित भएको छैन।</p>
        <p className="text-sm text-slate-500">प्रमाणीकरण पश्चात मात्र यो तमसुक प्रिन्ट गर्न सकिन्छ।</p>
        <Link to={`/loan/bektigat-jamani/${id}`} className="btn-secondary inline-flex items-center gap-2 mt-2">
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Top action bar - Hidden when printing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/loan/bektigat-jamani/${id}`} className="btn-secondary">
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
      <div className="print-area mx-auto max-w-[210mm] bg-white p-6 text-black shadow-sm print:m-0 print:p-0 print:shadow-none">
        <div className="print-page min-h-[297mm] p-6 flex flex-col justify-between">
          <div>
            {/* Header / Enterprise Details */}
            <div className="company-info text-center border-b pb-3 mb-4">
              <h1 className="text-2xl font-bold text-black tracking-wide">
                {ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}
              </h1>
              <h2 className="text-sm font-medium text-black mt-1">
                {ent?.VDCMUN || ent?.munvdc ? `${ent.VDCMUN || ent.munvdc}` : ''}
                {ent?.WardNo || ent?.wardno ? ` - ${convertToNepaliNumber(ent.WardNo || ent.wardno)}` : ''}
                {ent?.District || ent?.district ? `, ${ent.District || ent.district}` : ''}
              </h2>
            </div>

            {/* Title */}
            <div className="text-center font-bold text-base border-b border-black pb-1 mb-5">
              व्यक्तिगत जमानी तमसुक
            </div>

            {/* Deed Content with Left Witness Column */}
            <div className="flex border border-black text-[12px] leading-relaxed">
              {/* Witnesses Side Panel */}
              <div className="w-[24%] border-r border-black p-3 space-y-4 text-black">
                <div className="font-bold border-b border-black pb-1 text-center">साक्षीहरू</div>
                <div className="space-y-1">
                  <p className="font-bold">१. साक्षी</p>
                  <p>नाम: <strong>{j.SakshiName1 || '………………'}</strong></p>
                  <p>जिल्ला: {j.SakshiDistrict1 || '…………'}</p>
                  <p>गा.वि.स/न.पा: {j.SakshiPalika1 || '…………'}</p>
                  <p>वडा नं.: {convertToNepaliNumber(j.SakshiWardNo1) || '…'}</p>
                  <p>बस्ने वर्ष: {convertToNepaliNumber(j.SakshiAge1) || '…'}</p>
                  <p>को: {j.SakshiRelation1 || '…………'}</p>
                  <div className="pt-2">
                    <p className="text-[11px]">दस्तखत: ……………</p>
                  </div>
                </div>

                <div className="space-y-1 pt-3 border-t border-black">
                  <p className="font-bold">२. साक्षी</p>
                  <p>नाम: <strong>{j.SakshiName2 || '………………'}</strong></p>
                  <p>जिल्ला: {j.SakshiDistrict2 || '…………'}</p>
                  <p>गा.वि.स/न.पा: {j.SakshiPalika2 || '…………'}</p>
                  <p>वडा नं.: {convertToNepaliNumber(j.SakshiWardNo2) || '…'}</p>
                  <p>बस्ने वर्ष: {convertToNepaliNumber(j.SakshiAge2) || '…'}</p>
                  <p>को: {j.SakshiRelation2 || '…………'}</p>
                  <div className="pt-2">
                    <p className="text-[11px]">दस्तखत: ……………</p>
                  </div>
                </div>
              </div>

              {/* Main Deed Text */}
              <div className="w-[76%] p-4 text-justify space-y-3">
                <p className="indent-6 leading-relaxed">
                  लिखितम <strong>{j.BorrowerProvince || '……'}</strong> प्रदेश{' '}
                  <strong>{j.BorrowerDistrict || '……'}</strong> जिल्ला{' '}
                  <strong>{j.BorrowerPalika || '……'}</strong> महा-नगर/ उप-महानगर/ नगरपालिका/ गाउपालिका वडा न.{' '}
                  <strong>{convertToNepaliNumber(j.BorrowerWard) || '…'}</strong> बस्ने वर्ष{' '}
                  <strong>{convertToNepaliNumber(j.BorrowerAge) || '…'}</strong> को सदस्य न.{' '}
                  <strong>{j.MemberNo}</strong> को म{' '}
                  <strong>{j.BorrowerGrandfatherName || '…………'}</strong> को नाती/नातिनी{' '}
                  <strong>{j.BorrowerFatherName || '…………'}</strong> को छोरा/छोरी{' '}
                  <strong>{j.BorrowerSpouseName || '…………'}</strong> श्रीमान/ श्रीमती नागरिकता बमोजिम{' '}
                  <strong>{j.BorrowerCitizenshipDistrict || '……'}</strong> जिल्ला{' '}
                  <strong>{j.BorrowerCitizenshipPalika || '……'}</strong> गा. वि. स. / नगरपालिका/ गाउपालिका वडा न.{' '}
                  <strong>{convertToNepaliNumber(j.BorrowerCitizenshipWard) || '…'}</strong> जारी मिति{' '}
                  <strong>{j.BorrowerCitizenshipDate || '…………'}</strong> जारी जिल्ला{' '}
                  <strong>{j.BorrowerCitizenshipDistrict || '……'}</strong> आगे यस{' '}
                  <strong>{ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}</strong> बाट{' '}
                  <strong>{j.LoanPurpose || '…………'}</strong> परियोजनाको निमित्त रु.{' '}
                  <strong>{convertToNepaliNumber(j.LoanAmount) || '………'}</strong> (अक्षरेपी{' '}
                  <strong>{loanWords || '…………………'}</strong>) मात्र ऋण लिई मिति{' '}
                  <strong>{j.LoanDate || '…………'}</strong> मा तमसुक गरि लिएको कर्जा निजको{' '}
                  <strong>{ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}</strong>{' '}
                  {ent?.VDCMUN || ''} न पा/गा.पा वडा न. {ent?.WardNo || ''} संगको सर्त सम्झौता उल्लघन गरि कर्जा नतिरेमा लिलाम बिक्रि वा अन्य ब्यबस्थावाट{' '}
                  <strong>{ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}</strong> सहकारी संस्था लि.{' '}
                  {ent?.VDCMUN || ''} न पा/गा. पा वडा न. {ent?.WardNo || ''} ले लिने रकम असुल गरेमा मन्जुरी छ / छैन भनि त्यस सहकारी संस्था लि.{' '}
                  बाट सोधनी गर्दा मेरो चित्त बुझ्यो | उपयुक्त{' '}
                  <strong>{j.BorrowerName || mem?.FullName || '………………'}</strong> ले कर्जा लिदा लेखिदिएको धितो, बचत, शेयर तथा घरघरानाबाट{' '}
                  <strong>{ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}</strong> सहकारी संस्था लि. को लिने रकम असुल हुन नसकेमा निजले कर्जा लिदा गरिदिएको तमसुकलाई यसै लिखतको अभिन्न अंग मानी म{' '}
                  <strong>{j.JamaniGrandfatherName || '…………'}</strong> को नाती/नातिनी{' '}
                  <strong>{j.JamaniFatherName || '…………'}</strong> को छोरा/छोरी{' '}
                  <strong>{j.JamaniSpouseName || '…………'}</strong> श्रीमान/ श्रीमती म{' '}
                  <strong className="underline text-[13px]">{j.JamaniName}</strong> स्वयमको नाममा रहेको जुनसुकै चलअचल सम्पति{' '}
                  <strong>{ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}</strong> सहकारी संस्था लि. ले लिने रकम असुलउपर गरेमा र असुलीको सिलसिलामा मेरो नाम कालो सुचिमा समावेश गरेमा मेरो पूर्ण मन्जुरी छ | पछी निजको नामको बाकी कर्जा मेरो नामको सम्पतिबाट असुलउपर गर्न पाउने होइन र मलाई कालो सुचिमा राख्न पाउने छैन भनि कहिँ कतै कुनै किसिमको उजुर वाजुर गर्ने छैन, गरे यसै कागजबाट बदर गरिदिनु हुन भनि मेरो मनोमानी, राजीखुसीले{' '}
                  <strong>{ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}</strong> सहकारी संस्था लि. मा बसी किनारामा साक्षीको रोहबरमा यो व्यक्तिगत जमानिको कागज गरिदियाँ |
                </p>

                {/* Thumbprint and Jamani Sign */}
                <div className="pt-4 flex justify-end">
                  <div className="text-center space-y-1">
                    <div className="flex gap-2 justify-center">
                      <div className="w-16 h-16 border border-black flex items-center justify-center text-[10px] text-gray-500">
                        दायाँ
                      </div>
                      <div className="w-16 h-16 border border-black flex items-center justify-center text-[10px] text-gray-500">
                        बायाँ
                      </div>
                    </div>
                    <div className="border-b border-black pt-4"></div>
                    <p className="font-bold text-[11px]">जमानी दिनेको सहि</p>
                    <p className="text-[11px]">नाम: {j.JamaniName}</p>
                  </div>
                </div>

                {/* Legal Date */}
                <div className="pt-3 text-center text-[12px] font-semibold border-t border-black">
                  ईति सम्वत् <strong>{convertToNepaliNumber(j.LegalYear)}</strong> साल{' '}
                  <strong>{j.LegalMonth}</strong> महिना{' '}
                  <strong>{convertToNepaliNumber(j.LegalDay)}</strong> गते रोज{' '}
                  <strong>{convertToNepaliNumber(j.LegalDayOfWeek)}</strong> शुभम्
                </div>
              </div>
            </div>

            {/* Bottom Signatures */}
            <div className="pt-8 flex justify-between items-center text-[12px] font-semibold px-4">
              <div className="text-center space-y-1">
                <div className="border-b border-black w-36 pb-3 mb-1"></div>
                <p>तयार गर्नेको दस्तखत</p>
                <p className="font-normal">नाम: {j.LoanBhibhagPramukh || '……………………'}</p>
                <p className="text-gray-700 font-normal">पद: ऋण विभाग प्रमुख</p>
              </div>
              <div className="text-center space-y-1">
                <div className="border-b border-black w-36 pb-3 mb-1"></div>
                <p>रुजु गर्नेको दस्तखत</p>
                <p className="font-normal">नाम: {j.Bhyabasthapak || '……………………'}</p>
                <p className="text-gray-700 font-normal">पद: व्यवस्थापक</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
