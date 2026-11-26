import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  User,
  MapPin,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber, formatNepaliCurrency } from '../../utils/NepaliConverter';
import modDate from '../../utils/modDate';
import { NepaliInput } from '@itzsa/nepali-input';
import { loanNaapiSakhaApi } from '../../api/loanNaapiSakha';
import { errorMessage } from '../../api/axios';

const getVal = (e) => {
  if (typeof e === 'string' || typeof e === 'number') return String(e);
  if (e?.target?.value !== undefined) return String(e.target.value);
  return '';
};

const validationSchema = Yup.object().shape({
  MemberNo: Yup.string().required('सदस्यता नं. आवश्यक छ'),
  LoanNo: Yup.string().required('ऋण नं. आवश्यक छ'),
  ChalaaniNo: Yup.string().required('चलानी नं. आवश्यक छ'),
});

export default function LoanNaapiSakhaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [enterprise, setEnterprise] = useState(null);

  const [initialData, setInitialData] = useState({
    MemberNo: '',
    LoanNo: '',
    EntryDate: modDate.getCurrentNepaliDate(),
    RegisterNo: '',
    ChalaaniNo: '',
    NaapiAddress: '',
    Map1: 'ट्रेस',
    Map2: 'वडा',
    LoanBhibhagPramukh: 'ऋण बिभाग प्रमुख',
    LandHolderPersonName1: '',
    LandHolderFatherName1: '',
    LandHolderGrandfatherName1: '',
    LandAddress1: '',
    LandWardNoBlockNo1: '',
    LandKittaNo1: '',
    LandArea1: '',
    LandHolderPersonName2: '',
    LandHolderFatherName2: '',
    LandHolderGrandfatherName2: '',
    LandAddress2: '',
    LandWardNoBlockNo2: '',
    LandKittaNo2: '',
    LandArea2: '',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const memRes = await loanNaapiSakhaApi.members();
        const memList = Array.isArray(memRes) ? memRes : memRes?.members || [];
        if (mounted) {
          setMembers(memList);
          if (memRes?.enterprise) setEnterprise(memRes.enterprise);
          if (!isEdit) {
            setInitialData((prev) => ({
              ...prev,
              RegisterNo: prev.RegisterNo || memRes?.enterprise?.RegisterNo || '',
              LoanBhibhagPramukh: memRes?.loanBhibhagPramukh || prev.LoanBhibhagPramukh,
            }));
          }
        }

        if (isEdit) {
          const res = await loanNaapiSakhaApi.get(id);
          const n = res.naapiApplication;
          if (mounted && n) {
            setEnterprise(res.enterprise || null);

            setInitialData({
              MemberNo: n.MemberNo || '',
              LoanNo: n.LoanNo || '',
              EntryDate: n.EntryDate || modDate.getCurrentNepaliDate(),
              RegisterNo: n.RegisterNo || res.enterprise?.RegisterNo || '',
              ChalaaniNo: n.ChalaaniNo || '',
              NaapiAddress: n.NaapiAddress || '',
              Map1: n.Map1 || 'ट्रेस',
              Map2: n.Map2 || 'वडा',
              LoanBhibhagPramukh: n.LoanBhibhagPramukh || 'ऋण बिभाग प्रमुख',
              LandHolderPersonName1: n.LandHolderPersonName1 || '',
              LandHolderFatherName1: n.LandHolderFatherName1 || '',
              LandHolderGrandfatherName1: n.LandHolderGrandfatherName1 || '',
              LandAddress1: n.LandAddress1 || '',
              LandWardNoBlockNo1: n.LandWardNoBlockNo1 || '',
              LandKittaNo1: n.LandKittaNo1 || '',
              LandArea1: n.LandArea1 || '',
              LandHolderPersonName2: n.LandHolderPersonName2 || '',
              LandHolderFatherName2: n.LandHolderFatherName2 || '',
              LandHolderGrandfatherName2: n.LandHolderGrandfatherName2 || '',
              LandAddress2: n.LandAddress2 || '',
              LandWardNoBlockNo2: n.LandWardNoBlockNo2 || '',
              LandKittaNo2: n.LandKittaNo2 || '',
              LandArea2: n.LandArea2 || '',
            });

            if (n.MemberNo) {
              const lList = await loanNaapiSakhaApi.loansForMember(n.MemberNo);
              if (mounted) setLoans(lList.loans || []);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial form data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  const handleMemberChange = async (memberNo, setValues, currentValues) => {
    setValues({
      ...currentValues,
      MemberNo: memberNo,
      LoanNo: '',
    });
    setLoans([]);

    if (!memberNo) return;

    try {
      const res = await loanNaapiSakhaApi.loansForMember(memberNo);
      setLoans(res.loans || []);
    } catch (err) {
      console.error('Failed to load member loans:', err);
    }
  };

  const handleLoanChange = async (loanNo, memberNo, setValues, currentValues) => {
    setValues({
      ...currentValues,
      LoanNo: loanNo,
    });
    if (!loanNo || !memberNo) return;

    try {
      const ctx = await loanNaapiSakhaApi.context(memberNo, loanNo);
      setEnterprise(ctx.enterprise);

      // Check धितोको प्रकार (DhitoType) for जग्गा in dhitojamanidetail
      const jaggaDhitos = (ctx.dhitos || []).filter((d) =>
        (d.DhitoType || '').trim().includes('जग्गा')
      );

      const landFields = {};
      if (jaggaDhitos.length > 0) {
        [0, 1].forEach((idx) => {
          const d = jaggaDhitos[idx];
          const n = idx + 1;
          if (d) {
            landFields[`LandHolderPersonName${n}`] = d.DhitoPerson || '';
            landFields[`LandHolderFatherName${n}`] = d.DhitoFather || '';
            landFields[`LandHolderGrandfatherName${n}`] = d.DhitoSpouse || '';
            landFields[`LandAddress${n}`] = [d.DhitoVDCMUN, d.DhitoDistrict].filter(Boolean).join(', ');
            landFields[`LandWardNoBlockNo${n}`] = [d.DhitoWardNo, d.DhitoBlockNo].filter(Boolean).join(' / ');
            landFields[`LandKittaNo${n}`] = d.DhitoKittaNo || '';
            landFields[`LandArea${n}`] = d.DhitoArea || '';
          }
        });
      }

      setValues({
        ...currentValues,
        ...landFields,
        LoanNo: loanNo,
        RegisterNo: currentValues.RegisterNo || ctx.enterprise?.RegisterNo || '',
        LoanBhibhagPramukh: ctx.loanBhibhagPramukh || currentValues.LoanBhibhagPramukh || 'ऋण बिभाग प्रमुख',
      });
    } catch (err) {
      console.error('Failed to load loan context:', err);
    }
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = { ...values };
      const res = await loanNaapiSakhaApi.save(payload, isEdit ? id : null);
      const targetId = isEdit ? id : res.id;
      navigate(`/loan/naapi-saakha/${targetId}`, {
        state: {
          message: isEdit
            ? 'नापी शाखा निवेदन सफलतापूर्वक अद्यावधिक गरियो।'
            : 'नयाँ नापी शाखा निवेदन दर्ता भयो र स्वीकृतिका लागि पठाइयो।',
        },
      });
    } catch (err) {
      alert(errorMessage(err, 'फारम सेभ गर्न असफल भयो।'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <PageHeader
        title={isEdit ? 'नापी शाखा निवेदन सम्पादन' : 'नयाँ नापी शाखा निवेदन (Naapi Sakha Application)'}
        subtitle="जग्गा नक्सा उपलब्ध गराइदिनुहुन नापी कार्यालयलाई पठाउने निवेदन"
      >
        <Link
          to={isEdit ? `/loan/naapi-saakha/${id}` : '/loan/naapi-saakha'}
          className="btn-secondary"
        >
          <ArrowLeft className="size-4" /> फर्कनुहोस्
        </Link>
      </PageHeader>

      <Formik
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, setValues, setFieldValue }) => {
          const orgName = enterprise?.CompanyName || enterprise?.companyname || 'सहकारी संस्था लि.';
          const orgAddr = [
            enterprise?.munvdc || enterprise?.VDCMUN,
            enterprise?.wardno ? `- ${convertToNepaliNumber(enterprise.wardno)}` : '',
            enterprise?.district ? `, ${enterprise.district}` : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <Form className="space-y-6">
              {/* 1. Member, Loan & Dispatch Info */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-semibold text-slate-800">
                  <User className="size-4 text-brand-600" />
                  सदस्य, ऋण तथा चलानी विवरण
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      सदस्य नं. / नाम <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="MemberNo"
                      value={values.MemberNo}
                      disabled={isEdit}
                      onChange={(e) => handleMemberChange(e.target.value, setValues, values)}
                      className="w-full rounded-md border border-slate-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                    >
                      <option value="">-- सदस्य छान्नुहोस् --</option>
                      {members.map((m) => (
                        <option key={m.MemberNo} value={m.MemberNo}>
                          {m.MemberNo} - {m.FullName}
                        </option>
                      ))}
                    </select>
                    {touched.MemberNo && errors.MemberNo && (
                      <p className="mt-1 text-xs text-red-500">{errors.MemberNo}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ऋण नं. <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="LoanNo"
                      value={values.LoanNo}
                      disabled={isEdit || !values.MemberNo}
                      onChange={(e) => handleLoanChange(e.target.value, values.MemberNo, setValues, values)}
                      className="w-full rounded-md border border-slate-200 p-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-slate-50"
                    >
                      <option value="">-- ऋण नं. छान्नुहोस् --</option>
                      {loans.map((l) => (
                        <option key={l.LoanNo} value={l.LoanNo}>
                          {l.LoanNo} ({l.LoanPurpose || 'ऋण'}) - रु. {formatNepaliCurrency(l.LoanAmount) || l.LoanAmount}
                        </option>
                      ))}
                    </select>
                    {touched.LoanNo && errors.LoanNo && (
                      <p className="mt-1 text-xs text-red-500">{errors.LoanNo}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      मिति (वि.सं.) <span className="text-red-500">*</span>
                    </label>
                    <NepaliCalendar
                      value={values.EntryDate}
                      onChange={(date) => setFieldValue('EntryDate', date)}
                      width={180}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      चलानी नं. <span className="text-red-500">*</span>
                    </label>
                    <NepaliInput
                      type="text"
                      name="ChalaaniNo"
                      value={values.ChalaaniNo}
                      onChange={handleChange}
                      placeholder="चलानी नं. राख्नुहोस्"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    {touched.ChalaaniNo && errors.ChalaaniNo && (
                      <p className="mt-1 text-xs text-red-500">{errors.ChalaaniNo}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      नापी कार्यालयको ठेगाना
                    </label>
                    <NepaliInput
                      value={values.NaapiAddress}
                      onChange={(e) => setFieldValue('NaapiAddress', getVal(e))}
                      placeholder="जस्तै: भक्तपुर / काभ्रेपलाञ्चोक"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ऋण विभाग प्रमुख
                    </label>
                    <NepaliInput
                      value={values.LoanBhibhagPramukh}
                      onChange={(e) => setFieldValue('LoanBhibhagPramukh', getVal(e))}
                      placeholder="ऋण बिभाग प्रमुख"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      नक्सा १ (जस्तै: ट्रेस)
                    </label>
                    <NepaliInput
                      value={values.Map1}
                      onChange={(e) => setFieldValue('Map1', getVal(e))}
                      placeholder="ट्रेस"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      नक्सा २ (जस्तै: वडा)
                    </label>
                    <NepaliInput
                      value={values.Map2}
                      onChange={(e) => setFieldValue('Map2', getVal(e))}
                      placeholder="वडा"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Land Details Table (क. & ख.) */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-semibold text-slate-800">
                  <MapPin className="size-4 text-brand-600" />
                  तपसिल (जग्गाको विवरण)
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse border border-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700">
                        <th className="border border-slate-200 px-2 py-2 w-10 text-center">क्र. स</th>
                        <th className="border border-slate-200 px-2 py-2">जग्गा धनीको नामथर र ठेगाना</th>
                        <th className="border border-slate-200 px-2 py-2">बाबुको नामथर</th>
                        <th className="border border-slate-200 px-2 py-2">पति/बाजेको नामथर</th>
                        <th className="border border-slate-200 px-2 py-2">जग्गाको ठेगाना</th>
                        <th className="border border-slate-200 px-2 py-2 w-24">वडा नं./ब्लक नं.</th>
                        <th className="border border-slate-200 px-2 py-2 w-24">कित्ता नं.</th>
                        <th className="border border-slate-200 px-2 py-2 w-24">क्षेत्रफल</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2].map((rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="border border-slate-200 px-2 py-2 text-center font-bold">
                            {rowIdx === 1 ? 'क.' : 'ख.'}
                          </td>
                          <td className="border border-slate-200 p-1">
                            <textarea
                              rows={3}
                              name={`LandHolderPersonName${rowIdx}`}
                              value={values[`LandHolderPersonName${rowIdx}`]}
                              onChange={handleChange}
                              className="w-full rounded border border-slate-200 p-1.5 text-xs focus:border-brand-500 focus:outline-none"
                            />
                          </td>
                          <td className="border border-slate-200 p-1">
                            <textarea
                              rows={3}
                              name={`LandHolderFatherName${rowIdx}`}
                              value={values[`LandHolderFatherName${rowIdx}`]}
                              onChange={handleChange}
                              className="w-full rounded border border-slate-200 p-1.5 text-xs focus:border-brand-500 focus:outline-none"
                            />
                          </td>
                          <td className="border border-slate-200 p-1">
                            <textarea
                              rows={3}
                              name={`LandHolderGrandfatherName${rowIdx}`}
                              value={values[`LandHolderGrandfatherName${rowIdx}`]}
                              onChange={handleChange}
                              className="w-full rounded border border-slate-200 p-1.5 text-xs focus:border-brand-500 focus:outline-none"
                            />
                          </td>
                          <td className="border border-slate-200 p-1">
                            <textarea
                              rows={3}
                              name={`LandAddress${rowIdx}`}
                              value={values[`LandAddress${rowIdx}`]}
                              onChange={handleChange}
                              className="w-full rounded border border-slate-200 p-1.5 text-xs focus:border-brand-500 focus:outline-none"
                            />
                          </td>
                          <td className="border border-slate-200 p-1">
                            <textarea
                              rows={3}
                              name={`LandWardNoBlockNo${rowIdx}`}
                              value={values[`LandWardNoBlockNo${rowIdx}`]}
                              onChange={handleChange}
                              className="w-full rounded border border-slate-200 p-1.5 text-xs focus:border-brand-500 focus:outline-none"
                            />
                          </td>
                          <td className="border border-slate-200 p-1">
                            <textarea
                              rows={3}
                              name={`LandKittaNo${rowIdx}`}
                              value={values[`LandKittaNo${rowIdx}`]}
                              onChange={handleChange}
                              className="w-full rounded border border-slate-200 p-1.5 text-xs focus:border-brand-500 focus:outline-none"
                            />
                          </td>
                          <td className="border border-slate-200 p-1">
                            <textarea
                              rows={3}
                              name={`LandArea${rowIdx}`}
                              value={values[`LandArea${rowIdx}`]}
                              onChange={handleChange}
                              className="w-full rounded border border-slate-200 p-1.5 text-xs focus:border-brand-500 focus:outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Live Document Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <FileText className="size-4 text-brand-600" />
                  कागजात पूर्वदृश्य (Live Document Preview)
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-6 text-xs leading-relaxed text-slate-800 space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <div>दर्ता नं.: <span className="font-bold">{values.RegisterNo ? convertToNepaliNumber(values.RegisterNo) : '........'}</span></div>
                      <div>चलानी नं.: <span className="font-bold">{values.ChalaaniNo || '........'}</span></div>
                    </div>
                    <div>मिति: <span className="font-bold">{convertToNepaliNumber(values.EntryDate) || '........'}</span></div>
                  </div>
                  <div>
                    <div>श्रीमान कार्यालय प्रमुख ज्यु,</div>
                    <div>नापी कार्यालय,</div>
                    <div className="font-bold">{values.NaapiAddress || '................'}</div>
                  </div>
                  <div className="text-center font-bold underline text-sm">बिषय: जग्गा नक्सा उपलब्ध गराइदिनुहुन |</div>
                  <p>महोदय,</p>
                  <p className="indent-8 text-justify">
                    उपर्युक्त सम्बन्धमा यस <span className="font-bold">{orgName}{orgAddr ? `, ${orgAddr}` : ''}</span>, लाई तपसिलमा उल्लेखित कित्ता जग्गाको{' '}
                    <span className="font-bold underline">{values.Map1 || 'ट्रेस'}</span> नक्सा र{' '}
                    <span className="font-bold underline">{values.Map2 || 'वडा'}</span> नक्सा उपलब्ध गराइदिनुहुन अनुरोध गर्दछौ |
                  </p>
                </div>
              </div>

              {/* Submit Bar */}
              <div className="flex items-center justify-end gap-3">
                <Link
                  to={isEdit ? `/loan/naapi-saakha/${id}` : '/loan/naapi-saakha'}
                  className="btn-secondary"
                >
                  रद्द गर्नुहोस्
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> सुरक्षित हुँदैछ...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> {isEdit ? 'अद्यावधिक गर्नुहोस्' : 'दर्ता गर्नुहोस्'}
                    </>
                  )}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
