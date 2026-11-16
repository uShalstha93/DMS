import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { loanDhitoTamasukApi } from '../../api/loanDhitoTamasuk';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';

export default function LoanDhitoTamasukPrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanDhitoTamasukApi
      .get(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'विवरण प्राप्त गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (error || !data)
    return <p className="p-4 text-sm text-stamp">{error || 'डाटा फेला परेन।'}</p>;

  const { dhitoTamasuk: t, member: mem, enterprise: ent, dhitos = [] } = data;
  const loanWords = t.LoanAmountWords || (t.LoanAmount ? convertToNepaliWords(t.LoanAmount) : '');

  // Block printing if not approved!
  if (!t.ApprovedStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="rounded-full bg-amber-100 p-4">
          <Printer className="size-10 text-amber-500" />
        </div>
        <p className="text-lg font-semibold text-amber-700">यो तमसुक अझै प्रमाणित भएको छैन।</p>
        <p className="text-sm text-slate-500">
          प्रमाणीकरण पश्चात मात्र यो तमसुक प्रिन्ट गर्न सकिन्छ।
        </p>
        <Link
          to={`/loan/dhito-tamasuk/${id}`}
          className="btn-secondary inline-flex items-center gap-2 mt-2"
        >
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
      </div>
    );
  }

  const displayDhitos =
    Array.isArray(t.DhitoItems) && t.DhitoItems.length > 0
      ? t.DhitoItems
      : dhitos.length > 0
        ? dhitos
        : [
          {
            DhitoPerson: t.DhitoPerson,
            DhitoDistrict: t.DhitoDistrict,
            DhitoVDCMUN: t.DhitoVDCMUN,
            DhitoWardNo: t.DhitoWardNo,
            DhitoKittaNo: t.DhitoKittaNo,
            DhitoArea: t.DhitoArea,
            Remarks: t.DhitoRemarks,
          },
        ];

  return (
    <>
      {/* Top action bar - Hidden when printing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/loan/dhito-tamasuk/${id}`} className="btn-secondary">
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
        <div className="print-page min-h-[297mm] p-6 flex flex-col justify-between text-black">
          <div>
            {/* Header / Enterprise Details */}
            <div className="company-info text-center border-b border-black pb-2 mb-3">
              <h1 className="text-xl font-bold tracking-wide text-black">
                {ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}
              </h1>
              <h2 className="text-xs font-medium text-black mt-0.5">
                {ent?.VDCMUN || ent?.munvdc ? `${ent.VDCMUN || ent.munvdc}` : ''}
                {ent?.WardNo || ent?.wardno ? ` - ${convertToNepaliNumber(ent.WardNo || ent.wardno)}` : ''}
                {ent?.District || ent?.district ? `, ${ent.District || ent.district}` : ''}
              </h2>
              <div className="flex justify-between items-center text-[10px] text-black mt-2 font-mono">
                <span>
                  दर्ता नं:{' '}
                  <strong>
                    {convertToNepaliNumber(ent?.RegisterNo || ent?.registerno || ent?.panno || '')}
                  </strong>
                </span>
                <span>
                  मिति: <strong>{convertToNepaliNumber(t.EntryDate || '')}</strong>
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center font-bold text-sm pb-1 mb-2">
              धितो तमसुक
            </div>

            {/* Top Office Sanction & Endorsement Memo Block (कार्यालय लगानी टिप्पणी खण्ड) */}
            <div className="border border-black p-2.5 mb-3 text-black">
              <div className="flex gap-3 items-start">
                {/* Left Thumbprints Box */}
                <div className="flex flex-col items-center justify-center p-1 border-r border-black pr-3 shrink-0">
                  <div className="flex items-end">
                    <div className="flex items-end justify-center w-16 h-16 border border-black p-0.5">
                      <p className="text-[10px] text-gray-500">दायाँ</p>
                    </div>
                    <div className="h-6 border-l border-black mx-1"></div>
                    <div className="flex items-end justify-center w-16 h-16 border border-black p-0.5">
                      <p className="text-[10px] text-gray-500">बायाँ</p>
                    </div>
                  </div>
                  <p className="text-[9px] font-bold mt-1">सहिछाप / ल्याप्चे</p>
                </div>

                {/* Right: Reg & Date + Memo Statement + Staff Signs */}
                <div className="flex-1 flex flex-col justify-between space-y-2 text-[10.5px]">

                  <div className="leading-relaxed text-justify">
                    <p>
                      श्री <strong>{ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}</strong> को
                      मुख्य कार्यलय संस्थाका शेयर सदस्य श्री{' '}
                      <strong>{t.BorrowerName || mem?.FullName || '………………'}</strong> ले संस्थाका ऋण
                      व्यवस्थापन कार्यबिधि तथा तत्सम्बन्धी कानुनी प्रकृया समेत पढीबाची सुनाउदा चित्त
                      बुझाई सहिछाप गरी ऋण लिएकोले आजकै मितिमा ने. रू.{' '}
                      <strong>{convertToNepaliNumber(t.LoanAmount) || '………'}</strong> (अक्षरेपी रु.{' '}
                      <strong>{loanWords || '…………………'}</strong>) मात्र लगानी गरियो |
                    </p>
                  </div>

                  <div className="flex justify-between gap-4 pt-1.5 border-t border-black text-[10px]">
                    <div className="space-y-1">
                      <p className="font-bold mb-3">तमसुक तयार गर्ने :</p>
                      <p className="text-gray-500">दस्तखत: ....................</p>
                      <p>
                        नाम : <strong>{t.LoanBhibhagPramukh || '………………'}</strong>
                      </p>
                      <p className="text-gray-600 text-[9px]">पद : ऋण बिभाग प्रमुख</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold mb-3">तमसुक प्रमाणित गर्ने :</p>
                      <p className="text-gray-500">दस्तखत: ....................</p>
                      <p>
                        नाम : <strong>{t.Byabasthapak || '………………'}</strong>
                      </p>
                      <p className="text-gray-600 text-[9px]">पद : व्यवस्थापक</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deed Content */}
            <div className="border border-black text-[12px] leading-relaxed">
              <div className="w-full p-3 text-justify space-y-2 text-black">
                <p className="indent-6 leading-relaxed">
                  लिखितम धनीका नाम सहकारी ऐन <strong>{t.SahakariAin || '२०४८'}</strong> बमोजिम
                  जिल्ला सहकारी कार्यालय, <strong>{t.JillaSahakariAddress || 'काठमाडौं'}</strong>{' '}
                  जिल्लामा दर्ता भइ{' '}
                  <strong>{ent?.Province || ent?.province || 'बागमती'}</strong> प्रदेश{' '}
                  <strong>{ent?.District || ent?.district || 'काठमाडौं'}</strong> जिल्ला{' '}
                  <strong>{ent?.VDCMUN || ent?.munvdc || 'काठमाण्डौ'}</strong> म.न.पा./उ.म.न.पा./न.पा./ग.पा.
                  वडा नं.{' '}
                  <strong>
                    {convertToNepaliNumber(ent?.WardNo || ent?.wardno || '१०')}
                  </strong>{' '}
                  स्थित श्री{' '}
                  <strong>
                    {ent?.CompanyName || ent?.companyname || 'सहकारी संस्था लि.'}
                  </strong>{' '}
                  सो धन व्यहोर्ने ऋणीका नाम{' '}
                  <strong>{t.BorrowerGrandfatherName || '…………'}</strong> को नाति/नातिनी/बुहारी{' '}
                  <strong>{t.BorrowerFatherName || '…………'}</strong> को छोरा/छोरी/श्रीमती{' '}
                  <strong>{t.BorrowerProvince || '……'}</strong> प्रदेश{' '}
                  <strong>{t.BorrowerDistrict || '……'}</strong> जिल्ला{' '}
                  <strong>{t.BorrowerPalika || '……'}</strong> न.पा/गा.पा वडा नं.{' '}
                  <strong>{convertToNepaliNumber(t.BorrowerWard) || '…'}</strong> को हाल{' '}
                  <strong>{t.BorrowerTmpProvince || '……'}</strong> प्रदेश{' '}
                  <strong>{t.BorrowerTmpDistrict || '……'}</strong> जिल्ला{' '}
                  <strong>{t.BorrowerTmpPalika || '……'}</strong> न.पा/गा.पा वडा नं.{' '}
                  <strong>{convertToNepaliNumber(t.BorrowerTmpWard) || '…'}</strong> बस्ने
                  नागरिकता प्रमाणपत्र नं.{' '}
                  <strong>{t.BorrowerCitizenshipNo || '…………'}</strong> (जारी मिति{' '}
                  <strong>{convertToNepaliNumber(t.BorrowerCitizenshipDate) || '…………'}</strong> जारी
                  जिल्ला <strong>{t.BorrowerCitizenshipDistrict || '……'}</strong>) वर्ष{' '}
                  <strong>{convertToNepaliNumber(t.BorrowerAge) || '…'}</strong> का धनी संस्थाको
                  सदस्य नं. <strong>{convertToNepaliNumber(t.MemberNo) || '………'}</strong> का सदस्य
                  श्री/श्रीमती/सुश्री{' '}
                  <strong className="underline">{t.BorrowerName || mem?.FullName || '………………'}</strong>{' '}
                  ले जग्गा धितो जमानत अन्तर्गत{' '}
                  <strong>{t.LoanPurpose || '…………'}</strong> कार्य गर्नका लागि मिति{' '}
                  <strong>{convertToNepaliNumber(t.LoanApplicationDate) || '…………'}</strong> मा
                  पेश गरेको ऋण निवेदनमा उल्लेखित शर्तहरु र तपसिल बमोजिमका धनजमानी राखी संस्थाको
                  स्वीकृत ऋण व्यवस्थापन कार्यविधि तथा निर्देशन समेतलाई पालना गर्ने गरी आजका मितिमा रु.{' '}
                  <strong>{convertToNepaliNumber(t.LoanAmount) || '………'}</strong> (अक्षरेपी रु.{' '}
                  <strong>{loanWords || '…………………'}</strong> मात्र |) ऋण लिएको ठिक साँचो हो |
                </p>

                <p className="indent-6 leading-relaxed">
                  उक्त ऋण रकम र सो मा बार्षिक{' '}
                  <strong>{convertToNepaliNumber(t.RateOfInterest) || '…'}</strong> प्रतिशतका दरले
                  ब्याज समेत राखी{' '}
                  <strong>{convertToNepaliNumber(t.LoanPeriodYear) || '०'}</strong> वर्ष{' '}
                  <strong>{convertToNepaliNumber(t.LoanPeriodMonth) || '०'}</strong> महिना भित्र{' '}
                  <strong>{convertToNepaliNumber(t.LoanKista) || '…'}</strong> किस्तामा सम्पूर्ण
                  साँवा तथा मासिक रुपमा ब्याज धनि संस्थामा तिर्ने बुझाउने छु| जुन कार्यका लागि ऋण
                  लिएको हो, सो कार्यमा नलगाएमा एवम् भाखा भित्र साँवा तथा ब्याज बुझाउन नल्याएमा धनी
                  संस्थाको नियमानुसार लाग्ने हर्जाना/बिलम्ब शुल्क समेत बुझाउन मंजुर छु/छौं |
                </p>

                <p className="indent-6 leading-relaxed">
                  कथकदाचित मैले बुझाउन पर्ने साँवा तथा ब्याज र हर्जाना समेत नबुझाएमा मेरो यस सहकारी
                  संस्थामा जम्मा भएको बचत रकमबाट र तपसिल बमोजिम व्यक्तिहरुको जमानी राखेको रकमबाट
                  अशुल उपर गरिलिनु र उक्त रकमबाट पनि पुरा असुल हुन नसकेमा मेरा एकाघरका सगोलको
                  परिवारको नाममा रहेको चलअचल श्रीसम्पतिबाट प्रचलित कानुन बमोजिम असुलउपर गरिलिनु
                  भएमा कुनै प्रकारको उजुरबाजुर गर्ने छैन भनि राजीखुसि तथा मंजुरीले किनाराका
                  साक्षीहरुको रोहबरमा धनी संस्थामा बसी यो तमसुकमा सहीछाप गरी धनी संस्थालाई दिएँ|
                </p>

                {/* Tapasil Mortgage Table */}
                <div className="pt-2">
                  <div className="text-center font-bold text-[10px] uppercase pb-0.5 mb-1">
                    तपसिल: जग्गा धितोको विवरण
                  </div>
                  <table className="w-full text-[10px] border border-black text-center border-collapse">
                    <thead>
                      <tr className="bg-gray-100 font-bold border-b border-black">
                        <th className="border-r border-black p-1">जग्गाधनीको नामथर</th>
                        <th className="border-r border-black p-1">जिल्ला</th>
                        <th className="border-r border-black p-1">न.पा/गा.पा</th>
                        <th className="border-r border-black p-1">वडा नं.</th>
                        <th className="border-r border-black p-1">कित्ता नं.</th>
                        <th className="border-r border-black p-1">क्षेत्रफल</th>
                        <th className="p-1">कैफियत</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayDhitos.map((d, i) => (
                        <tr key={i} className="border-b border-black">
                          <td className="border-r border-black p-1 font-bold">
                            {d.DhitoPerson || '—'}
                          </td>
                          <td className="border-r border-black p-1">{d.DhitoDistrict || '—'}</td>
                          <td className="border-r border-black p-1">{d.DhitoVDCMUN || '—'}</td>
                          <td className="border-r border-black p-1">
                            {convertToNepaliNumber(d.DhitoWardNo) || '—'}
                          </td>
                          <td className="border-r border-black p-1 font-bold">
                            {convertToNepaliNumber(d.DhitoKittaNo) || '—'}
                          </td>
                          <td className="border-r border-black p-1">{d.DhitoArea || '—'}</td>
                          <td className="p-1">{d.Remarks || d.DhitoRemarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Thumbprint and Borrower Sign */}
                <div className="pt-3 flex justify-end">
                  <div className="text-center space-y-1">
                    <div className="flex gap-2 justify-center">
                      <div className="w-14 h-14 border border-black flex items-center justify-center text-[9px] text-gray-500">
                        दायाँ
                      </div>
                      <div className="w-14 h-14 border border-black flex items-center justify-center text-[9px] text-gray-500">
                        बायाँ
                      </div>
                    </div>
                    <div className="border-b border-black pt-8"></div>
                    <p className="font-bold text-[10px]">ऋणीको सहीछाप</p>
                    <p className="text-[10px]">नाम: {t.BorrowerName || mem?.FullName}</p>
                  </div>
                </div>

                {/* Witnesses */}
                <div className="pt-2 space-y-1 text-black">
                  <div className="font-bold border-b border-black pb-1 text-center">साक्षीहरू</div>
                  <div className="flex items-center justify-between gap-2 pt-3 whitespace-nowrap text-[9px]">
                    <p className="font-bold">१. साक्षी</p>
                    <p>
                      नाम: <strong>{t.SakshiName1 || '………………'}</strong>
                    </p>
                    <p>जिल्ला: {t.SakshiDistrict1 || '…………'}</p>
                    <p>गा.वि.स/न.पा: {t.SakshiPalika1 || '…………'}</p>
                    <p>वडा नं.: {convertToNepaliNumber(t.SakshiWardNo1) || '…'}</p>
                    {t.SakshiMemberNo1 && (
                      <p>सदस्य नं.: {convertToNepaliNumber(t.SakshiMemberNo1)}</p>
                    )}
                    <p>दस्तखत: …………………………</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-black pt-3 whitespace-nowrap text-[9px]">
                    <p className="font-bold">२. साक्षी</p>
                    <p>
                      नाम: <strong>{t.SakshiName2 || '………………'}</strong>
                    </p>
                    <p>जिल्ला: {t.SakshiDistrict2 || '…………'}</p>
                    <p>गा.वि.स/न.पा: {t.SakshiPalika2 || '…………'}</p>
                    <p>वडा नं.: {convertToNepaliNumber(t.SakshiWardNo2) || '…'}</p>
                    {t.SakshiMemberNo2 && (
                      <p>सदस्य नं.: {convertToNepaliNumber(t.SakshiMemberNo2)}</p>
                    )}
                    <p>दस्तखत: …………………………</p>
                  </div>
                </div>

                {/* Legal Date */}
                <div className="pt-3 text-center text-[11px] font-bold border-t border-black border-dashed">
                  ईति सम्वत् <strong>{convertToNepaliNumber(t.LegalYear)}</strong> साल{' '}
                  <strong>{t.LegalMonth}</strong> महिना{' '}
                  <strong>{convertToNepaliNumber(t.LegalDay)}</strong> गते रोज{' '}
                  <strong>{convertToNepaliNumber(t.LegalDayOfWeek)}</strong> शुभम्
                </div>

                {/* Staff Signatures */}
                <div className="pt-5 flex justify-between items-center text-[10px] font-bold">
                  <div className="text-center space-y-0.5">
                    <div className="border-b border-black w-28 pb-3 mb-1"></div>
                    <p>तमसुक तयार गर्ने</p>
                    <p className="font-normal">नाम: {t.LoanBhibhagPramukh || '………………'}</p>
                    <p className="text-gray-600 font-normal">पद: ऋण विभाग प्रमुख</p>
                  </div>
                  <div className="text-center space-y-0.5">
                    <div className="border-b border-black w-28 pb-3 mb-1"></div>
                    <p>तमसुक प्रमाणित गर्ने</p>
                    <p className="font-normal">नाम: {t.Byabasthapak || '………………'}</p>
                    <p className="text-gray-600 font-normal">पद: व्यवस्थापक</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
