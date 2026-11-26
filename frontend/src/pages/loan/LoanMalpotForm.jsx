import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  User,
  MapPin,
  UserCheck,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import NepaliCalendar from '../../utils/NepaliCalendar';
import { convertToNepaliNumber, formatNepaliCurrency } from '../../utils/NepaliConverter';
import { convertToNepaliWords } from '../../utils/NumberToNepaliWordConverter';
import modDate from '../../utils/modDate';
import { NepaliInput } from '@itzsa/nepali-input';
import { loanMalpotApi } from '../../api/loanMalpot';
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

export default function LoanMalpotForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const currentUser = useSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [enterprise, setEnterprise] = useState(null);

  const defaultStaff = currentUser?.nepaliName || currentUser?.name || '';

  const [initialData, setInitialData] = useState({
    MemberNo: '',
    LoanNo: '',
    EntryDate: modDate.getCurrentNepaliDate(),
    RegisterNo: '',
    ChalaaniNo: '',
    MalpotAddress: '',
    BorrowerName: '',
    SpouseName: '',
    LoanAmount: '',
    LoanAmountWords: '',
    StaffName: defaultStaff,
    LandHolderPersonNameAndAddress1: '',
    LandHolderFatherName1: '',
    LandHolderGrandfatherName1: '',
    LandAddress1: '',
    LandWardNoBlockNo1: '',
    LandKittaNo1: '',
    LandArea1: '',
    LandHolderPersonNameAndAddress2: '',
    LandHolderFatherName2: '',
    LandHolderGrandfatherName2: '',
    LandAddress2: '',
    LandWardNoBlockNo2: '',
    LandKittaNo2: '',
    LandArea2: '',
    PratinidhiName: '',
    PratinidhiAddress: '',
    PratinidhiCitNo: '',
    PratinidhiCitIssuedDateAndPlace: '',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const memRes = await loanMalpotApi.members();
        const memList = Array.isArray(memRes) ? memRes : memRes?.members || [];
        if (mounted) {
          setMembers(memList);
          if (memRes?.enterprise) {
            setEnterprise(memRes.enterprise);
            if (!isEdit && memRes.enterprise.RegisterNo) {
              setInitialData((prev) => ({
                ...prev,
                RegisterNo: prev.RegisterNo || memRes.enterprise.RegisterNo,
              }));
            }
          }
        }

        if (isEdit) {
          const res = await loanMalpotApi.get(id);
          const m = res.malpotApplication;
          if (mounted && m) {
            setEnterprise(res.enterprise || null);
            setSelectedMember(res.member || null);
            setSelectedLoan(res.loan || null);

            setInitialData({
              MemberNo: m.MemberNo || '',
              LoanNo: m.LoanNo || '',
              EntryDate: m.EntryDate || modDate.getCurrentNepaliDate(),
              RegisterNo: m.RegisterNo || res.enterprise?.RegisterNo || '',
              ChalaaniNo: m.ChalaaniNo || '',
              MalpotAddress: m.MalpotAddress || '',
              BorrowerName: m.BorrowerName || res.member?.FullName || '',
              SpouseName: m.SpouseName || res.member?.SpouseName || '',
              LoanAmount: m.LoanAmount || res.loan?.LoanAmount || '',
              LoanAmountWords: m.LoanAmountWords || (m.LoanAmount ? convertToNepaliWords(m.LoanAmount) : ''),
              StaffName: m.StaffName || defaultStaff,
              LandHolderPersonNameAndAddress1: m.LandHolderPersonNameAndAddress1 || '',
              LandHolderFatherName1: m.LandHolderFatherName1 || '',
              LandHolderGrandfatherName1: m.LandHolderGrandfatherName1 || '',
              LandAddress1: m.LandAddress1 || '',
              LandWardNoBlockNo1: m.LandWardNoBlockNo1 || '',
              LandKittaNo1: m.LandKittaNo1 || '',
              LandArea1: m.LandArea1 || '',
              LandHolderPersonNameAndAddress2: m.LandHolderPersonNameAndAddress2 || '',
              LandHolderFatherName2: m.LandHolderFatherName2 || '',
              LandHolderGrandfatherName2: m.LandHolderGrandfatherName2 || '',
              LandAddress2: m.LandAddress2 || '',
              LandWardNoBlockNo2: m.LandWardNoBlockNo2 || '',
              LandKittaNo2: m.LandKittaNo2 || '',
              LandArea2: m.LandArea2 || '',
              PratinidhiName: m.PratinidhiName || '',
              PratinidhiAddress: m.PratinidhiAddress || '',
              PratinidhiCitNo: m.PratinidhiCitNo || '',
              PratinidhiCitIssuedDateAndPlace: m.PratinidhiCitIssuedDateAndPlace || '',
            });

            if (m.MemberNo) {
              const lList = await loanMalpotApi.loansForMember(m.MemberNo);
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
  }, [id, isEdit, defaultStaff]);

  const handleMemberChange = async (memberNo, setValues, currentValues) => {
    setValues({
      ...currentValues,
      MemberNo: memberNo,
      LoanNo: '',
      BorrowerName: '',
      SpouseName: '',
      LoanAmount: '',
      LoanAmountWords: '',
    });
    setLoans([]);
    setSelectedMember(null);
    setSelectedLoan(null);

    if (!memberNo) return;

    try {
      const res = await loanMalpotApi.loansForMember(memberNo);
      setLoans(res.loans || []);
      if (res.member) {
        setSelectedMember(res.member);
        setValues((prev) => ({
          ...prev,
          MemberNo: memberNo,
          LoanNo: '',
          BorrowerName: res.member.FullName || '',
          SpouseName: res.member.SpouseName || '',
        }));
      }
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
      const ctx = await loanMalpotApi.context(memberNo, loanNo);
      setEnterprise(ctx.enterprise);
      setSelectedMember(ctx.member);
      setSelectedLoan(ctx.loan);

      const mem = ctx.member || {};
      const ln = ctx.loan || {};
      const amt = ln.LoanAmount || '';
      const words = amt ? convertToNepaliWords(amt) : '';

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
            landFields[`LandHolderPersonNameAndAddress${n}`] = d.DhitoPerson || '';
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
        BorrowerName: mem.FullName || currentValues.BorrowerName,
        SpouseName: mem.SpouseName || currentValues.SpouseName,
        LoanAmount: amt || currentValues.LoanAmount,
        LoanAmountWords: words || currentValues.LoanAmountWords,
      });
    } catch (err) {
      console.error('Failed to load loan context:', err);
    }
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = { ...values };
      const res = await loanMalpotApi.save(payload, isEdit ? id : null);
      const targetId = isEdit ? id : res.id;
      navigate(`/loan/malpot-application/${targetId}`, {
        state: {
          message: isEdit
            ? 'मालपोत निवेदन सफलतापूर्वक अद्यावधिक गरियो।'
            : 'नयाँ मालपोत निवेदन दर्ता भयो र स्वीकृतिका लागि पठाइयो।',
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
        title={isEdit ? 'मालपोत निवेदन सम्पादन' : 'नयाँ मालपोत निवेदन (Malpot Application)'}
        subtitle="दृष्टिबन्धक पास सम्बन्धमा मालपोत कार्यालयलाई पठाउने निवेदन"
      >
        <Link
          to={isEdit ? `/loan/malpot-application/${id}` : '/loan/malpot-application'}
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
                  ऋणी, ऋण तथा चलानी विवरण
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
                      श्री मालपोत कार्यालयको ठेगाना
                    </label>
                    <NepaliInput
                      value={values.MalpotAddress}
                      onChange={(e) => setFieldValue('MalpotAddress', getVal(e))}
                      placeholder="जस्तै: भक्तपुर / काभ्रेपलाञ्चोक"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      संस्था प्रतिनिधि (कर्मचारीको नाम)
                    </label>
                    <NepaliInput
                      value={values.StaffName}
                      onChange={(e) => setFieldValue('StaffName', getVal(e))}
                      placeholder="प्रतिनिधि कर्मचारीको नाम"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ऋणीको नाम
                    </label>
                    <NepaliInput
                      type="text"
                      name="BorrowerName"
                      value={values.BorrowerName}
                      onChange={handleChange}
                      className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      श्रीमान/श्रीमतीको नाम
                    </label>
                    <NepaliInput
                      type="text"
                      name="SpouseName"
                      value={values.SpouseName}
                      onChange={handleChange}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      ऋण रकम (रु.)
                    </label>
                    <NepaliInput
                      type="text"
                      name="LoanAmount"
                      value={values.LoanAmount}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFieldValue('LoanAmount', v);
                        setFieldValue('LoanAmountWords', v ? convertToNepaliWords(v) : '');
                      }}
                      className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm h-9 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Land Details Table (क. & ख.) */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-semibold text-slate-800">
                  <MapPin className="size-4 text-brand-600" />
                  दृष्टिबन्धक पास गरिने जग्गाको विवरण
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
                              name={`LandHolderPersonNameAndAddress${rowIdx}`}
                              value={values[`LandHolderPersonNameAndAddress${rowIdx}`]}
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

              {/* 3. Pratinidhi Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-semibold text-slate-800">
                  <UserCheck className="size-4 text-brand-600" />
                  प्रतिनिधिको विवरण
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">नाम</label>
                    <NepaliInput
                      value={values.PratinidhiName}
                      onChange={(e) => setFieldValue('PratinidhiName', getVal(e))}
                      placeholder="नाम राख्नुहोस्"
                      className="w-full rounded-md border border-slate-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ठेगाना</label>
                    <NepaliInput
                      value={values.PratinidhiAddress}
                      onChange={(e) => setFieldValue('PratinidhiAddress', getVal(e))}
                      placeholder="ठेगाना राख्नुहोस्"
                      className="w-full rounded-md border border-slate-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">ना प्र. नं.</label>
                    <input
                      type="text"
                      name="PratinidhiCitNo"
                      value={values.PratinidhiCitNo}
                      onChange={handleChange}
                      placeholder="नागरिकता नं. राख्नुहोस्"
                      className="w-full rounded-md border border-slate-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">जारी मिति र जिल्ला</label>
                    <NepaliInput
                      value={values.PratinidhiCitIssuedDateAndPlace}
                      onChange={(e) => setFieldValue('PratinidhiCitIssuedDateAndPlace', getVal(e))}
                      placeholder="मिति / जिल्ला"
                      className="w-full rounded-md border border-slate-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Live Document Preview */}
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
                    <div>श्री मालपोत कार्यालय,</div>
                    <div className="font-bold">{values.MalpotAddress || '................'}</div>
                  </div>
                  <div className="text-center font-bold underline text-sm">बिषय: दृष्टिबन्धक पास सम्बन्धमा |</div>
                  <p>महोदय,</p>
                  <p className="indent-8 text-justify">
                    उपर्युक्त सम्बन्धमा यस <span className="font-bold">{orgName}{orgAddr ? `, ${orgAddr}` : ''}</span> का शेयर सदस्य नं.{' '}
                    <span className="font-bold underline">{values.MemberNo || '........'}</span> भएका शेयर सदस्य श्री{' '}
                    <span className="font-bold underline">{values.BorrowerName || selectedMember?.FullName || '................'}</span> ले यस संस्थाबाट रु.{' '}
                    <span className="font-bold underline">
                      {values.LoanAmount ? formatNepaliCurrency(values.LoanAmount) : '............'}
                    </span>{' '}
                    (अक्षरेपी रु. <span className="font-bold underline">{values.LoanAmountWords || '........................'}</span> मात्र) ऋण माग गर्नु भएको हुदा उक्त ऋणका लागि निजको र निजको श्रीमान/श्रीमती{' '}
                    <span className="font-bold underline">{values.SpouseName || selectedMember?.SpouseName || '................'}</span> को नाममा रहेको तपसिलको जग्गा दृष्टिबन्धक पास गरि सो को जानकारी समेत पठाइ दिनुहुन अनुरोध गर्दछौ | यस संस्थाबाट निम्न विवरण भएका प्रतिनिधि श्री{' '}
                    <span className="font-bold underline">{values.StaffName || '................'}</span> लाई संस्थाको छाप सहित पठाइएको व्यहोरा अनुरोध छ |
                  </p>
                </div>
              </div>

              {/* Submit Bar */}
              <div className="flex items-center justify-end gap-3">
                <Link
                  to={isEdit ? `/loan/malpot-application/${id}` : '/loan/malpot-application'}
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
