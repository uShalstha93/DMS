import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { loanRequestsApi } from '../../api/loanRequests';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { calculateAgeFromNepaliDate } from '../../utils/CalcAge';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';

const IMG_URL = import.meta.env.VITE_IMG_URL;

export default function LoanRequestPrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const firstPageRef = useRef(null);
  const secondPageRef = useRef(null);

  useEffect(() => {
    loanRequestsApi.get(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'विवरण प्राप्त गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (error || !data) return <p className="p-4 text-sm text-stamp">{error || 'डाटा फेला परेन।'}</p>;

  const { request: r, member: m, loan: l, dhitoDetail: d, branch: b, staffs } = data;

  const age = m?.DOB ? calculateAgeFromNepaliDate(m.DOB) : null;
  const nepaliAge = age !== null ? convertToNepaliNumber(age) : '';

  const loanOfficer = staffs?.find((s) => s.post?.includes('ऋण बिभाग प्रमुख'))?.name || 'ऋण बिभाग प्रमुख';
  const manager = staffs?.find((s) => s.post?.includes('व्यवस्थापक'))?.name || 'व्यवस्थापक';
  const committeeHead = staffs?.find((s) => s.post?.includes('संयोजक'))?.name || 'ऋण उपसमिति संयोजक';
  const president = staffs?.find((s) => s.post?.includes('अध्यक्ष'))?.name || 'अध्यक्ष';

  return (
    <>
      {/* Top action bar - Hidden when printing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/loan/request/${id}`} className="btn-secondary">
          <ArrowLeft size={16} />फर्कनुहोस्
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">A4 Portrait (२ पृष्ठहरू / 2 Pages)</span>
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} />प्रिन्ट गर्नुहोस् (Print)
          </button>
        </div>
      </div>

      {/* Printable Area - styling conforms to standard A4 sheet */}
      <div className="print-area flex flex-col items-center justify-center gap-8 bg-slate-300/40 p-4 print:m-0 print:block print:bg-white print:p-0">

        {/* ════════════════════ PAGE 1 ════════════════════ */}
        <article
          ref={firstPageRef}
          className="print-page a4-sheet relative flex flex-col justify-between border border-slate-300 bg-white p-6 text-[10pt] leading-tight text-black shadow-lg print:border-none print:shadow-none"
          style={{ width: '210mm', minHeight: '290mm' }}
        >
          <div>
            {/* Header Title */}
            <div className="mb-2 flex w-full items-center justify-center bg-[#00A650] py-1 text-center print:bg-transparent print:border-b-2 print:border-black">
              <h1 className="font-mono text-base font-bold text-white print:text-black">
                ऋण रकम माग फारम
              </h1>
            </div>

            {/* Date */}
            <div className="flex justify-end py-1 text-xs">
              <span className="font-bold mr-1">मिति:</span>
              <span className="font-medium underline decoration-dotted underline-offset-4">
                {r.EntryDate ? convertToNepaliNumber(r.EntryDate) : '—'}
              </span>
            </div>

            {/* Recipient & Member Photo */}
            <div className="flex items-start justify-between pb-2">
              <div className="text-xs">
                <p className="font-bold">श्री व्यवस्थापक / ऋण संयोजक / अध्यक्ष ज्यू,</p>
                <p className="font-bold text-sm">{b?.name || 'सहकारी संस्था लिमिटेड'}</p>
                <p className="text-xs">{b?.address || 'ठेगाना'}</p>
              </div>
              <div className="mr-2 flex h-24 w-20 items-center justify-center overflow-hidden border border-gray-400 bg-gray-50">
                {m?.PhotoIm ? (
                  <img
                    src={`${IMG_URL}/membership/photo/${m.PhotoIm}`}
                    alt="Photo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-gray-400">फोटो</span>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="my-1 text-center">
              <h2 className="font-bold underline text-xs">विषय: ऋण रकम माग सम्बन्धमा।</h2>
            </div>

            {/* Preamble */}
            <div className="my-1 text-justify text-[9.5pt] leading-snug">
              <p>महोदय,</p>
              <p className="indent-6">
                उपयुक्त सम्बन्धमा मलाई तपसिलको व्यवसाय/परियोजना संचालन गर्नको लागि ऋण रकमको आवश्यकता परेको हुँदा संस्थाको नियमानुसार बचत / धितो जमानत राखी उल्लेखित ऋण उपलब्ध गरिदिनुहुन यो निवेदन पेश गर्दछु। म यस संस्थाको सम्पूर्ण शर्त तथा नियमहरूका साथै संस्थाले यस पश्चात जारी गर्ने नीति, नियम समेत पालना गर्दछु।
              </p>
            </div>

            {/* १. ऋण माग गर्नेको विवरण */}
            <div className="mt-2">
              <p className="font-bold text-xs underline mb-1">१. ऋण माग गर्नेको विवरण:</p>
              <table className="w-full border-collapse border border-black text-[9pt]">
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold w-36">सदस्यता नं.</td>
                    <td className="border border-black px-2 py-1 font-semibold">{r.MemberNo}</td>
                    <td className="border border-black px-2 py-1 font-bold w-36">ऋण नं.</td>
                    <td className="border border-black px-2 py-1 font-semibold">{r.LoanNo}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold">आवेदकको नाम थर</td>
                    <td className="border border-black px-2 py-1 font-medium">{m?.FullName || '—'}</td>
                    <td className="border border-black px-2 py-1 font-bold">ठेगाना</td>
                    <td className="border border-black px-2 py-1">{[m?.Tole, m?.MUNVDC, m?.District].filter(Boolean).join(', ') || '—'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold">बाबुको नाम थर</td>
                    <td className="border border-black px-2 py-1">{m?.FatherName || '—'}</td>
                    <td className="border border-black px-2 py-1 font-bold">आमाको नाम थर</td>
                    <td className="border border-black px-2 py-1">{m?.MotherName || '—'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold">बाजेको नाम थर</td>
                    <td className="border border-black px-2 py-1">{m?.GrandfatherName || '—'}</td>
                    <td className="border border-black px-2 py-1 font-bold">उमेर</td>
                    <td className="border border-black px-2 py-1">{nepaliAge ? `${nepaliAge} वर्ष` : '—'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold">पति/पत्नीको नाम</td>
                    <td className="border border-black px-2 py-1">{m?.SpouseName || '—'}</td>
                    <td className="border border-black px-2 py-1 font-bold">मोबाइल नं.</td>
                    <td className="border border-black px-2 py-1">{m?.MobileNo || '—'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold">ससुराको नाम थर</td>
                    <td className="border border-black px-2 py-1">{m?.FatherInLaw || '—'}</td>
                    <td className="border border-black px-2 py-1 font-bold">नागरिकता नं.</td>
                    <td className="border border-black px-2 py-1">{m?.CitizenshipNo || '—'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold">जारी मिति</td>
                    <td className="border border-black px-2 py-1">{m?.CitIssuedDate ? convertToNepaliNumber(m.CitIssuedDate) : '—'}</td>
                    <td className="border border-black px-2 py-1 font-bold">जारी जिल्ला</td>
                    <td className="border border-black px-2 py-1">{m?.CitIssuedDistrict || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* २. ऋणको परियोजना विवरण */}
            <div className="mt-2">
              <p className="font-bold text-xs underline mb-1">२. ऋणको परियोजना विवरण:</p>
              <table className="w-full border-collapse border border-black text-center text-[9pt]">
                <thead>
                  <tr className="bg-gray-100 print:bg-transparent">
                    <th className="border border-black px-2 py-1 font-bold" rowSpan={2}>परियोजना, उद्देश्य वा व्यवसायको नाम</th>
                    <th className="border border-black px-2 py-1 font-bold" colSpan={3}>परियोजना / व्यवसायको लागत</th>
                    <th className="border border-black px-2 py-1 font-bold" rowSpan={2}>ऋणको किसिम</th>
                  </tr>
                  <tr className="bg-gray-100 print:bg-transparent">
                    <th className="border border-black px-1 py-1 font-normal text-[8pt]">सदस्यको आफ्नो श्रोत (मेरो लगानी)</th>
                    <th className="border border-black px-1 py-1 font-normal text-[8pt]">संस्थाबाट लिने ऋण रकम रु.</th>
                    <th className="border border-black px-1 py-1 font-normal text-[8pt]">जम्मा लगानी / लागत रु.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 font-medium">{l?.BusinessName || l?.LoanPurpose || '—'}</td>
                    <td className="border border-black px-2 py-1">{l?.IncomeSource || '—'}</td>
                    <td className="border border-black px-2 py-1 font-bold">{l?.LoanAmount ? `रू ${l.LoanAmount}` : '—'}</td>
                    <td className="border border-black px-2 py-1">{l?.IncomeSourceRs || '—'}</td>
                    <td className="border border-black px-2 py-1">{l?.LoanType || '—'}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-1 text-xs">
                <span className="font-bold">ऋणको रकम अक्षरेपी: </span>
                <span className="underline decoration-dotted underline-offset-4">
                  {l?.LoanAmount ? `${convertToNepaliWords(l.LoanAmount)} मात्र` : '—'}
                </span>
              </p>
            </div>

            {/* ३. बचत जमानतको विवरण */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <p className="font-bold underline">३. बचत जमानतको विवरण:</p>
                <span>
                  व्यवसायको पान नं: <span className="font-mono font-bold underline">{l?.BusinessPAN || '—'}</span> (यदि भएमा {l?.HasBusiness ? '✓' : '✗'})
                </span>
              </div>
              <table className="w-full border-collapse border border-black text-[8.5pt]">
                <thead>
                  <tr className="bg-gray-100 print:bg-transparent">
                    <th className="border border-black px-1 py-1 w-6">क्र.सं.</th>
                    <th className="border border-black px-2 py-1">जमानी बस्नेको नाम थर</th>
                    <th className="border border-black px-2 py-1">ठेगाना</th>
                    <th className="border border-black px-1 py-1">सदस्यता नं.</th>
                    <th className="border border-black px-2 py-1">जमानतको बचत</th>
                    <th className="border border-black px-2 py-1">कबोल रकम</th>
                    <th className="border border-black px-2 py-1 text-[7.5pt] w-36">ऋणीले नबुझाएमा जमानत रकमबाट बुझाउन मन्जुर हस्ताक्षर</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-1 py-1 text-center">१</td>
                    <td className="border border-black px-2 py-1 font-medium">{l?.JamaniName || '—'}</td>
                    <td className="border border-black px-2 py-1">{[l?.JamaniDistrict, l?.JamaniVDCMUN, l?.JamaniWardNo].filter(Boolean).join(', ') || '—'}</td>
                    <td className="border border-black px-1 py-1 text-center">{l?.JamaniMemberNo || '—'}</td>
                    <td className="border border-black px-2 py-1">{l?.JamaniType || '—'}</td>
                    <td className="border border-black px-2 py-1 font-bold">{l?.JamaniTypeRs ? `रू ${l.JamaniTypeRs}` : '—'}</td>
                    <td className="border border-black px-2 py-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ४. धितोको विवरण */}
            <div className="mt-2">
              <p className="font-bold text-xs underline mb-1">४. धितोको विवरण:</p>
              <table className="w-full border-collapse border border-black text-[8.5pt]">
                <thead>
                  <tr className="bg-gray-100 print:bg-transparent">
                    <th className="border border-black px-1 py-1 w-6">क्र.सं.</th>
                    <th className="border border-black px-2 py-1">धितो दिनेको नाम</th>
                    <th className="border border-black px-2 py-1">धितोको किसिम</th>
                    <th className="border border-black px-2 py-1">गा.वि.स. / न.पा.</th>
                    <th className="border border-black px-1 py-1">वडा / ब्लक</th>
                    <th className="border border-black px-2 py-1">कित्ता नं.</th>
                    <th className="border border-black px-2 py-1">क्षेत्रफल</th>
                    <th className="border border-black px-1 py-1">कैफियत</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-1 py-1 text-center">१</td>
                    <td className="border border-black px-2 py-1 font-medium">{d?.DhitoPerson || '—'}</td>
                    <td className="border border-black px-2 py-1">{d?.DhitoType || '—'}</td>
                    <td className="border border-black px-2 py-1">{d?.DhitoVDCMUN || '—'}</td>
                    <td className="border border-black px-1 py-1">{[d?.DhitoWardNo, d?.DhitoBlockNo].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="border border-black px-2 py-1 text-center">{d?.DhitoKittaNo || '—'}</td>
                    <td className="border border-black px-2 py-1">{d?.DhitoArea || '—'}</td>
                    <td className="border border-black px-1 py-1">{d?.Remarks || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Commitment */}
            <p className="mt-3 text-justify text-[8.5pt] font-semibold">
              ऋणका शर्तहरू पालना नगरेमा, विवरणहरू झुट्टा ठहरिएमा सहकारी ऐन २०७४, नियमावली २०७५, मापदण्ड २०६८, संस्थाको विनियम तथा ऋण व्यवस्थापन कार्यविधि-२०७९ बमोजिम साहुँला/बुझाउँला।
            </p>
          </div>

          {/* Applicant Signature Footer of Page 1 */}
          <div className="flex items-center justify-between border-t border-black pt-2 text-xs">
            <div>
              <span>आवेदकको नाम: </span>
              <span className="font-bold underline">{m?.FullName || '—'}</span>
            </div>
            <div>
              <span>दस्तखत: </span>
              <span className="inline-block w-36 border-b border-black"></span>
            </div>
          </div>
        </article>

        {/* ════════════════════ PAGE 2 (OFFICE USE) ════════════════════ */}
        <article
          ref={secondPageRef}
          className="print-page a4-sheet relative flex flex-col justify-between border border-slate-300 bg-white p-6 text-[10pt] leading-tight text-black shadow-lg print:border-none print:shadow-none"
          style={{ width: '210mm', minHeight: '290mm' }}
        >
          <div>
            {/* Top Badge */}
            <div className="mb-2 text-center">
              <span className="border-2 border-red-600 px-6 py-1 font-bold text-red-600 text-xs">
                कार्यालय प्रयोजनको लागि मात्र
              </span>
            </div>

            {/* ५. ऋणीको ऋण तिर्ने आय श्रोतको आधार */}
            <div className="mt-2">
              <p className="font-bold text-xs underline mb-1">५. ऋणीको ऋण तिर्ने आय श्रोतको आधार:</p>
              <table className="w-full border-collapse border border-black text-center text-[9pt]">
                <thead>
                  <tr className="bg-gray-100 print:bg-transparent">
                    <th className="border border-black px-2 py-1 font-bold" rowSpan={2}>आम्दानीको प्रमुख श्रोत</th>
                    <th className="border border-black px-2 py-1">व्यापार / व्यवसाय</th>
                    <th className="border border-black px-2 py-1">पशुपंक्षी / कृषि व्यवसाय</th>
                    <th className="border border-black px-2 py-1">वैदेशिक रोजगार</th>
                    <th className="border border-black px-2 py-1">नोकरी / अन्य</th>
                    <th className="border border-black px-2 py-1">कैफियत</th>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold text-xs">
                      {r.IncomeSource === 'व्यापार/ब्यबसाय' ? '✓' : '✗'}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold text-xs">
                      {r.IncomeSource === 'पशुपंक्षी पालन/कृषि ब्यबसाय' ? '✓' : '✗'}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold text-xs">
                      {r.IncomeSource === 'बैदेशिक रोजगार' ? '✓' : '✗'}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold text-xs">
                      {r.IncomeSource === 'नोकरी/अन्य' ? '✓' : '✗'}
                    </td>
                    <td className="border border-black px-2 py-1"></td>
                  </tr>
                </thead>
              </table>
            </div>

            {/* ६. शेयर र नियमित बचत कारोबार */}
            <div className="mt-2">
              <p className="font-bold text-xs underline mb-1">६. सदस्यको संस्थामा शेयर र नियमित बचत कारोबारको अवस्था कस्तो छ?</p>
              <table className="w-full border-collapse border border-black text-center text-[8.5pt]">
                <thead>
                  <tr className="bg-gray-100 print:bg-transparent">
                    <th className="border border-black px-2 py-1 font-bold">जम्मा शेयर रकम</th>
                    <th className="border border-black px-2 py-1 font-bold">जम्मा मासिक बचत</th>
                    <th className="border border-black px-2 py-1 font-bold">मासिक बचतको दर</th>
                    <th className="border border-black px-2 py-1 font-bold">कहिले सम्मको बचत गरेको छ?</th>
                    <th className="border border-black px-2 py-1 font-bold">नियमित बचत</th>
                    <th className="border border-black px-2 py-1 font-bold">कैफियत</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 font-medium">{r.TotalShareAmount ? `रु ${r.TotalShareAmount}` : '—'}</td>
                    <td className="border border-black px-2 py-1">{r.TotalMonthlySaving ? `रु ${r.TotalMonthlySaving}` : '—'}</td>
                    <td className="border border-black px-2 py-1">{r.MonthlySavingRate || '—'}</td>
                    <td className="border border-black px-2 py-1">{r.DepositUptoDate ? convertToNepaliNumber(r.DepositUptoDate) : '—'}</td>
                    <td className="border border-black px-2 py-1">{r.RegularSaving || '—'}</td>
                    <td className="border border-black px-2 py-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ७. विगतको बचत र ऋणको कारोबार */}
            <div className="mt-2">
              <p className="font-bold text-xs underline mb-1">७. सदस्यको संस्थामा विगतको बचत र ऋणको कारोबारको अवस्था कस्तो छ?</p>
              <table className="w-full border-collapse border border-black text-center text-[8.5pt]">
                <thead>
                  <tr className="bg-gray-100 print:bg-transparent">
                    <th className="border border-black px-1 py-1 font-bold">दैनिक बचत छ?</th>
                    <th className="border border-black px-1 py-1 font-bold">बाल बचत छ?</th>
                    <th className="border border-black px-1 py-1 font-bold">आवधिक बचत छ?</th>
                    <th className="border border-black px-1 py-1 font-bold">अन्य बचत छ?</th>
                    <th className="border border-black px-1 py-1 font-bold">तिर्न बाँकी ऋण छ?</th>
                    <th className="border border-black px-1 py-1 font-bold">तिर्न बाँकी ब्याज</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-1 py-1">{r.HasDailySaving ? 'छ' : 'छैन'}</td>
                    <td className="border border-black px-1 py-1">{r.HasChildSaving ? 'छ' : 'छैन'}</td>
                    <td className="border border-black px-1 py-1">{r.HasFixedSaving ? 'छ' : 'छैन'}</td>
                    <td className="border border-black px-1 py-1">{r.HasOtherSaving ? 'छ' : 'छैन'}</td>
                    <td className="border border-black px-1 py-1">{r.HasRemainingLoan ? 'छ' : 'छैन'}</td>
                    <td className="border border-black px-1 py-1">{r.RemainingInterest ? `रु ${r.RemainingInterest}` : '—'}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse border border-black text-center text-[8.5pt] mt-1">
                <thead>
                  <tr className="bg-gray-100 print:bg-transparent">
                    <th className="border border-black px-2 py-1 font-bold">ऐच्छिक बचत कारोबार</th>
                    <th className="border border-black px-2 py-1 font-bold">अरुलाई धितो वा जमानी दिएको</th>
                    <th className="border border-black px-2 py-1 font-bold">विगतको ऋण कारोबारको अवस्था</th>
                    <th className="border border-black px-2 py-1 font-bold">अन्य अवस्था</th>
                    <th className="border border-black px-2 py-1 font-bold">कैफियत</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1">{r.HasOptSavingTrans ? 'भएको' : 'नभएको'}</td>
                    <td className="border border-black px-2 py-1">{r.HasGivenDhitoOrJamani ? 'दिएको' : 'नदिएको'}</td>
                    <td className="border border-black px-2 py-1">{r.ConditionOfOldLoan || '—'}</td>
                    <td className="border border-black px-2 py-1">{r.OtherCondition || '—'}</td>
                    <td className="border border-black px-2 py-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ८. ऋण विभागको सिफारिश */}
            <div className="mt-2.5">
              <p className="font-bold text-xs underline mb-1">८. ऋण विभागको सिफारिश:</p>
              <p className="text-justify text-[9pt] leading-relaxed">
                निजले ऋण मागपत्रमा प्रस्तुत गरेको विवरणहरू पूर्ण रुपमा ठिक छ, निजको संस्थागत कारोबारको विश्लेषण, धितो निरीक्षणबाट प्राप्त प्रतिवेदन लगायतका आधारमा निजको लागि रकम रु. <span className="font-bold underline">{r.Sifarish8LoanAmount ? `रू ${r.Sifarish8LoanAmount}` : '.....................'}</span> | (अक्षरेपी <span className="underline decoration-dotted">{r.Sifarish8LoanAmount ? convertToNepaliWords(r.Sifarish8LoanAmount) : '................................................'}</span>) रुपैयाँ ऋण मागपत्र सिफारिसको लागि पेश गर्दछु।
              </p>
              <div className="mt-4 flex items-center justify-between text-xs px-4">
                <div>
                  <span>मिति: </span>
                  <span className="underline font-medium">{r.Sifarish8LoanDate ? convertToNepaliNumber(r.Sifarish8LoanDate) : '.....................'}</span>
                </div>
                <div className="text-center">
                  <div className="w-44 border-b border-black pb-1 font-medium">{loanOfficer}</div>
                  <div className="text-[8pt] text-gray-700">(ऋण विभाग प्रमुख)</div>
                </div>
              </div>
            </div>

            {/* ९. ऋणको स्वीकृत एवं सिफारिश (व्यवस्थापक) */}
            <div className="mt-2.5">
              <p className="font-bold text-xs underline mb-1">९. ऋणको स्वीकृत एवं सिफारिश:</p>
              <p className="text-justify text-[9pt] leading-relaxed">
                ऋण मागकर्ता सदस्यबाट प्राप्त माग फारम, पेश गरिएका कागजात एवं ऋण विभागबाट प्राप्त सिफारिसको आधारमा निज सदस्यलाई उल्लेखित उद्देश्यमा परिचालन गर्ने गरि रु. <span className="font-bold underline">{r.Sifarish9LoanAmount ? `रू ${r.Sifarish9LoanAmount}` : '.....................'}</span> | (अक्षरेपी <span className="underline decoration-dotted">{r.Sifarish9LoanAmount ? convertToNepaliWords(r.Sifarish9LoanAmount) : '................................................'}</span>) ऋण मागपत्र स्वीकृति/सिफारिशको लागि ऋण उपसमितिमा पेश गर्दछु।
              </p>
              <div className="mt-4 flex items-center justify-between text-xs px-4">
                <div>
                  <span>मिति: </span>
                  <span className="underline font-medium">{r.Sifarish9LoanDate ? convertToNepaliNumber(r.Sifarish9LoanDate) : '.....................'}</span>
                </div>
                <div className="text-center">
                  <div className="w-44 border-b border-black pb-1 font-medium">{manager}</div>
                  <div className="text-[8pt] text-gray-700">(व्यवस्थापक)</div>
                </div>
              </div>
            </div>

            {/* १०. ऋण उप-समितिको स्वीकृति वा सिफारिश */}
            <div className="mt-2.5">
              <p className="font-bold text-xs underline mb-1">१०. ऋण उप-समितिको स्वीकृति वा सिफारिश:</p>
              <p className="text-justify text-[9pt] leading-relaxed">
                ऋण मागकर्ता सदस्यबाट प्राप्त माग फारम, पेश गरिएका कागजात एवं ऋण विभागबाट प्राप्त सिफारिसको आधारमा निज सदस्यलाई उल्लेखित उद्देश्यमा परिचालन गर्ने गरि ऋण उप-समितिको मिति <span className="font-semibold underline">{r.UpasamitiMeetingDate ? convertToNepaliNumber(r.UpasamitiMeetingDate) : '...............'}</span> को <span className="font-semibold underline">{r.UpasamitiMeetingNo ? convertToNepaliNumber(r.UpasamitiMeetingNo) : '.....'}</span> औं बैठकबाट रु. <span className="font-bold underline">{r.UpasamitiApprovedLoanAmount ? `रू ${r.UpasamitiApprovedLoanAmount}` : '.....................'}</span> | (अक्षरेपी <span className="underline decoration-dotted">{r.UpasamitiApprovedLoanAmount ? convertToNepaliWords(r.UpasamitiApprovedLoanAmount) : '................................................'}</span>) ऋण लगानीको लागि स्वीकृति / सिफारिश गरिएको छ। पूर्ण कागजात र प्रक्रिया पुरा गरि लगानी गर्नको लागि जानकारी गराइन्छ।
              </p>
              <div className="mt-4 flex items-center justify-between text-xs px-4">
                <div>
                  <span>मिति: </span>
                  <span className="underline font-medium">{r.UpasamitiMeetingDate ? convertToNepaliNumber(r.UpasamitiMeetingDate) : '.....................'}</span>
                </div>
                <div className="text-center">
                  <div className="w-44 border-b border-black pb-1 font-medium">{committeeHead}</div>
                  <div className="text-[8pt] text-gray-700">(ऋण उपसमिति संयोजक)</div>
                </div>
              </div>
            </div>

            {/* ११. संचालक समितिको स्वीकृति */}
            <div className="mt-2.5">
              <p className="font-bold text-xs underline mb-1">११. संचालक समितिको स्वीकृति:</p>
              <p className="text-justify text-[9pt] leading-relaxed">
                ऋण मागकर्ता सदस्यबाट प्राप्त माग फारम, पेश गरिएका कागजात एवं ऋण विभाग साथै ऋण उप-समितिबाट प्राप्त सिफारिसको आधारमा निज सदस्यलाई उल्लेखित उद्देश्यमा परिचालन गर्ने गरि संचालक समितिको मिति <span className="font-semibold underline">{r.SanchalakMeetingDate ? convertToNepaliNumber(r.SanchalakMeetingDate) : '...............'}</span> को <span className="font-semibold underline">{r.SanchalakMeetingNo ? convertToNepaliNumber(r.SanchalakMeetingNo) : '.....'}</span> औं बैठकबाट रु. <span className="font-bold underline">{r.SanchalakApprovedLoanAmount ? `रू ${r.SanchalakApprovedLoanAmount}` : '.....................'}</span> | (अक्षरेपी <span className="underline decoration-dotted">{r.SanchalakApprovedLoanAmount ? convertToNepaliWords(r.SanchalakApprovedLoanAmount) : '................................................'}</span>) ऋण लगानीको लागि स्वीकृत गरिएको छ।
              </p>
              <div className="mt-4 flex items-center justify-between text-xs px-4">
                <div>
                  <span>मिति: </span>
                  <span className="underline font-medium">{r.SanchalakMeetingDate ? convertToNepaliNumber(r.SanchalakMeetingDate) : '.....................'}</span>
                </div>
                <div className="text-center">
                  <div className="w-44 border-b border-black pb-1 font-medium">{president}</div>
                  <div className="text-[8pt] text-gray-700">(अध्यक्ष)</div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}

