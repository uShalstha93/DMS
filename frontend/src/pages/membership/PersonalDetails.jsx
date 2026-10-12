import { useEffect, useState } from 'react';
import { NepaliInput } from '@itzsa/nepali-input';
import NepaliCalendar from '../../utils/NepaliCalendar';
import FormField, { StepTitle, bindField } from '../../components/FormField';
import { addressApi } from '../../api/members';

export default function PersonalDetails({ values, errors, touched, handleChange, setFieldValue }) {
  const [districts, setDistricts] = useState([]);
  const f = { touched, errors };
  const bind = bindField(touched, errors);
  const setDate = (name) => (date) => setFieldValue(name, date || '');

  const CNepaliInput = `!text-[14px] h-10`;

  // Every district (for "citizenship issued district")
  useEffect(() => {
    addressApi.districts().then(setDistricts).catch((e) => console.error('Error getting districts:', e));
  }, []);

  return (
    <section>
      <StepTitle>१. व्यक्तिगत विवरण</StepTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="पुरा नाम" name="fullName" required {...f}>
          <NepaliInput {...bind('fullName')} mode="unicode" placeholder="पुरा नाम" value={values.fullName}
            onChange={handleChange} className={`${bind('address').className} ${CNepaliInput}`} />
        </FormField>
        <FormField label="पुरा नाम (अंग्रेजीमा)" name="fullNameEng" required {...f}>
          <input {...bind('fullNameEng')} type="text" placeholder="Full name in English" value={values.fullNameEng} onChange={handleChange} />
        </FormField>
        <FormField label="लिङ्ग" name="gender" required {...f}>
          <select {...bind('gender')} value={values.gender} onChange={handleChange}>
            <option value="">-- छान्नुहोस् --</option>
            <option value="पुरुष">पुरुष</option>
            <option value="महिला">महिला</option>
            <option value="अन्य">अन्य</option>
          </select>
        </FormField>
        <FormField label="जन्म मिति" name="dob" required {...f}>
          <NepaliCalendar name="dob" value={values.dob} onChange={setDate('dob')} placeholder="YYYY/MM/DD" width="100%" />
        </FormField>

        <FormField label="मोबाइल नम्बर" name="mobileNo" required {...f}>
          <NepaliInput {...bind('mobileNo')} type="text" placeholder="मोबाइल नम्बर" value={values.mobileNo}
            onChange={handleChange} className={`${bind('mobileNo').className} ${CNepaliInput}`} />
        </FormField>
        <FormField label="इमेल" name="email" {...f}>
          <input {...bind('email')} type="text" placeholder="name@example.com" value={values.email} onChange={handleChange} />
        </FormField>
        <FormField label="नागरिकता नं." name="citizenshipNo" required {...f}>
          <NepaliInput {...bind('citizenshipNo')} type="text" placeholder="नागरिकता नं." value={values.citizenshipNo}
            onChange={handleChange} className={`${bind('citizenshipNo').className} ${CNepaliInput}`} />
        </FormField>
        <FormField label="नागरिकता जारी जिल्ला" name="citIssuedDistrict" {...f}>
          <select {...bind('citIssuedDistrict')} value={values.citIssuedDistrict} onChange={handleChange}>
            <option value="">-- छान्नुहोस् --</option>
            {values.citIssuedDistrict && !districts.includes(values.citIssuedDistrict) && (
              <option value={values.citIssuedDistrict}>{values.citIssuedDistrict}</option>
            )}
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>

        <FormField label="नागरिकता जारी मिति" name="citIssuedDate" {...f}>
          <NepaliCalendar name="citIssuedDate" value={values.citIssuedDate} onChange={setDate('citIssuedDate')} placeholder="YYYY/MM/DD" width="100%" />
        </FormField>
        <FormField label="पासपोर्ट नं." name="passportNo" {...f}>
          <NepaliInput {...bind('passportNo')} type="text" placeholder="पासपोर्ट नं." value={values.passportNo}
            onChange={handleChange} className={`${bind('passportNo').className} ${CNepaliInput}`} />
        </FormField>
        <FormField label="पान नं." name="panNo" {...f}>
          <NepaliInput {...bind('panNo')} type="text" placeholder="पान नं." value={values.panNo}
            onChange={handleChange} className={`${bind('panNo').className} ${CNepaliInput}`} />
        </FormField>
      </div>
    </section>
  );
}
