import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { loanRulesApi } from '../../api/loanRules';
import { errorMessage } from '../../api/axios';
import { convertToNepaliNumber } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';

export default function LoanRulesPrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loanRulesApi.get(id)
      .then(setData)
      .catch((e) => setError(errorMessage(e, 'विवरण प्राप्त गर्न सकिएन')))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4 text-sm text-slate-500">लोड हुँदैछ...</p>;
  if (error || !data) return <p className="p-4 text-sm text-stamp">{error || 'डाटा फेला परेन।'}</p>;

  const { rule, member: m, enterprise: ent } = data;
  const loanWords = rule.LoanAmount ? convertToNepaliWords(rule.LoanAmount) : '';

  return (
    <>
      {/* Top action bar - Hidden when printing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/loan/rules/${id}`} className="btn-secondary">
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
              <span>{convertToNepaliNumber(rule.EntryDate) || rule.EntryDate}</span>
            </div>

            {/* Title */}
            <div className="text-center font-bold text-base border-b border-black pb-1 mb-5">
              ऋण लिने सदस्यले पालना गर्नुपर्ने सर्तहरु:
            </div>

            {/* 14 Clauses */}
            <div className="text-[13px] leading-relaxed text-justify space-y-2.5">
              <p>
                १. ऋणी सदस्यले ऋण लिदा तमसुकमा लेखिएको बमोजिम मासिक ब्याज र किस्ता वापत रु.{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(rule.LoanAmount) || rule.LoanAmount}
                </span>{' '}
                | (अक्षरेपी{' '}
                <span className="font-bold underline px-1">
                  {loanWords || '………………………………………………'}
                </span>{' '}
                मात्र) तोकिएको समयमा भुक्तानी गर्नु पर्ने छ |
              </p>
              <p>२. तपाईले लिनु भएको ऋणको किस्ता र ब्याज हरेक किस्ताको समय अवधि भित्र बुझाउनु पर्छ |</p>
              <p>३. ऋणको ब्याजदर संस्थाको संचालक समितिले परिबर्तित वित्तिय बजार अनुसार ब्याजदर परिवर्तन गरे, परिबर्तित ब्याजदर अनुसार ऋणीले ऋणको ब्याज भुक्तानी गर्नु पर्ने छ |</p>
              <p>४. ऋणीले लिएको ऋण, प्रयोजन अनुसार लगानी गर्नु पर्ने छ र बेला-बेलामा ऋणको सदुपयोग र प्रगति/प्रतिफलको जानकारी संस्थामा जानकारी गराउनु पर्ने छ |</p>
              <p>५. शेयर सदस्यले मासिक बचत नियमित रुपमा गरेको हुनुपर्ने छ |</p>
              <p>६. संस्थाले तोके अनुसारको समय भित्र किस्ता तिरेमा निर्धारित ब्याज लाग्ने छ तर नियमित नबुझाएमा समितिले तोकेको ब्याज र हर्जाना लाग्ने छ |</p>
              <p>७. कथमकदाचित आफुले लिएको ऋण लगानी गरेको परियोजनामा कुनै दुर्घटना, प्राकृतिक प्रकोप, अन्य कुनै बिपत्ति, आदिले असफल भएमा तत्काल संस्थामा जानकारी गराएमा हर्जाना छुट हुनेछ |</p>
              <p>
                ८. एउटा शिर्षकमा ऋण लिएर अर्को शिर्षकमा लगानी गरेमा थप{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(rule.AdditionalIntRate) || rule.AdditionalIntRate || '……'}
                </span>
                % ले अतिरिक्त ब्याज शुल्क लाग्ने छ |
              </p>
              <p>९. यदि किस्ता र ब्याज नियमित नआएमा तपाई ऋणीलाई पठाउने स्मरण-पत्र, ताकेता-पत्र, चिठी, टेलिफोन, घरदैलो, पत्रपत्रिकामा प्रकाशन, आदि लाग्ने शुल्क ऋणी आफै स्वयमले व्यहोर्नु पर्नेछ |</p>
              <p>१०. ऋणीले कुनै एक किस्ता नतिर्दा संस्थाको नियमानुसार तिर्न बाकी सबै ऋणलाई कर्जा जोखिम ब्यबस्थामा गणना गरि ऋणीलाई संरक्षित पुंजी फिर्ता कोष वितरण गरिने छैन |</p>
              <p>११. ऋण लिएपछी नियमित नतिरी भाका नाघेमा संस्थाको साधारणसभाको प्रतिवेदनमा, खराब कर्जाको सुचिमा, पत्रपत्रिकामा, बुलेटिन, आदिमा ऋण र तीनपुस्ते विवरण सहित ऋणीको कालो सुचिमा नाम प्रकाशन गरि प्रचलित कानुन बमोजिम संस्थाले कारबाही गर्ने छ |</p>
              <p>
                १२. आज मिति{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(rule.VisitDate) || rule.VisitDate}
                </span>{' '}
                मा म स्वयम् ऋणी आफै संस्थामा उपस्थित भइ ऋणको सम्पूर्ण परामर्श लिई उल्लेखित सर्तहरु पालना गर्दछु भनि एक प्रति बुझी लिई सहिछाप गरिदिए |
              </p>
              <p>
                १३. बजार दर अनुसार संचालक समितिले ब्याजदर{' '}
                <span className="font-bold underline px-1">
                  {convertToNepaliNumber(rule.ChangeIntRate) || rule.ChangeIntRate || '……'}
                </span>
                % सम्म हेरफेर गर्न सक्छ |
              </p>
              <p>१४. यो सहकारी सबै सदस्यको साझा संस्था हो, यसको नीति नियमको पालना गरि आफ्नो मान, इज्जत, प्रतिष्ठा र संस्थाको छविलाई उच्च राख्न सहयोगको अपेक्षा गर्दछौ |</p>
            </div>
          </div>

          {/* Bottom Counseling and Signatures */}
          <div className="mt-4 pt-4 border-t border-black/40">
            <p className="font-bold underline text-sm mb-4">परामर्शमा उपस्थित हुनेको विवरण:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className='flex flex-col'>
                <span>१. नाम थर: <strong className="underline ml-2">{m?.FullName || '—'}</strong></span>
                <span className='mt-5'>दस्तखत: ________________________</span>
              </div>
              <div className='flex flex-col'>
                <span>२. नाम थर: <strong className="underline ml-2">{rule.Person2 || '—'}</strong></span>
                <span className='mt-5'>दस्तखत: ________________________</span>
              </div>
            </div>
            {/* <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between items-center">
                <span>१. नाम थर: <strong className="underline ml-2">{m?.FullName || '—'}</strong></span>
                <span>दस्तखत: ________________________</span>
              </div>
              <div className="flex justify-between items-center">
                <span>२. नाम थर: <strong className="underline ml-2">{rule.Person2 || '—'}</strong></span>
                <span>दस्तखत: ________________________</span>
              </div>
            </div> */}

            {/* Staff Sign */}
            <div className="text-right pt-2 mt-2">
              <p className="mb-4">दस्तखत: _________________</p>
              <p className="font-bold text-sm">{rule.StaffName || 'कर्मचारीको नाम'}</p>
              <p className="text-xs">{rule.StaffPost || 'पद'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

