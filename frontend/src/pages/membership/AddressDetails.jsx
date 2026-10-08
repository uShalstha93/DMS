import { useEffect, useState } from 'react';
import { NepaliInput } from '@itzsa/nepali-input';
import FormField, { StepTitle, bindField } from '../../components/FormField';
import { addressApi } from '../../api/members';

// Form field names for each address block
const PERMANENT = { province: 'province', district: 'district', munVDC: 'munVDC', wardNo: 'wardNo', tole: 'tole' };
const CURRENT = { province: 'tmpProvince', district: 'tmpDistrict', munVDC: 'tmpMunVDC', wardNo: 'tmpWardNo', tole: 'tmpTole' };
const KEYS = Object.keys(PERMANENT);
const LABELS = { province: 'प्रदेश', district: 'जिल्ला', munVDC: 'न.पा./गा.पा.', wardNo: 'वडा नं.', tole: 'टोल' };

// Province -> district -> municipality options, reloaded whenever the parent choice changes
function useAddressOptions(province, district) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [munvdcs, setMunvdcs] = useState([]);

  useEffect(() => {
    addressApi.provinces().then(setProvinces).catch((e) => console.error('Error getting provinces:', e));
  }, []);

  useEffect(() => {
    if (!province) { setDistricts([]); return; }
    let alive = true;
    addressApi.districts(province).then((d) => alive && setDistricts(d)).catch((e) => console.error(e));
    return () => { alive = false; };
  }, [province]);

  useEffect(() => {
    if (!district) { setMunvdcs([]); return; }
    let alive = true;
    addressApi.munvdcs(district).then((d) => alive && setMunvdcs(d)).catch((e) => console.error(e));
    return () => { alive = false; };
  }, [district]);

  return { provinces, districts, munvdcs };
}

function AddressBlock({ names, values, errors, touched, handleChange, setFieldValue, readOnly }) {
  const { provinces, districts, munvdcs } = useAddressOptions(values[names.province], values[names.district]);
  const f = { touched, errors };
  const bind = bindField(touched, errors);
  const clear = (...keys) => keys.forEach((k) => setFieldValue(names[k], '', false));

  // "Same as permanent": show the copied values instead of inputs
  if (readOnly) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {KEYS.map((k) => (
          <div key={k}>
            <p className="label">{LABELS[k]}</p>
            <div className="field min-h-[38px] bg-paper text-slate-700">{values[names[k]] || '—'}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <FormField label={LABELS.province} name={names.province} {...f}>
        <select {...bind(names.province)} value={values[names.province]}
          onChange={(e) => { handleChange(e); clear('district', 'munVDC'); }}>
          <option value="">-- छान्नुहोस् --</option>
          {provinces.map((p) => <option key={p.NProvince} value={p.NProvince}>{p.NProvince}</option>)}
        </select>
      </FormField>

      <FormField label={LABELS.district} name={names.district} {...f}>
        <select {...bind(names.district)} value={values[names.district]} disabled={!values[names.province]}
          onChange={(e) => { handleChange(e); clear('munVDC'); }}>
          <option value="">-- छान्नुहोस् --</option>
          {districts.map((d) => <option key={d.NDistrict} value={d.NDistrict}>{d.NDistrict}</option>)}
        </select>
      </FormField>

      <FormField label={LABELS.munVDC} name={names.munVDC} {...f}>
        <select {...bind(names.munVDC)} value={values[names.munVDC]} disabled={!values[names.district]} onChange={handleChange}>
          <option value="">-- छान्नुहोस् --</option>
          {munvdcs.map((m) => <option key={m.GNameNepali} value={m.GNameNepali}>{m.GNameNepali}</option>)}
        </select>
      </FormField>

      <FormField label={LABELS.wardNo} name={names.wardNo} {...f}>
        <NepaliInput {...bind(names.wardNo)} type="text" placeholder="वडा नं." value={values[names.wardNo]} onChange={handleChange} />
      </FormField>

      <FormField label={LABELS.tole} name={names.tole} {...f}>
        <NepaliInput {...bind(names.tole)} type="text" placeholder="टोल" value={values[names.tole]} onChange={handleChange} />
      </FormField>
    </div>
  );
}

export default function AddressDetails(props) {
  const { values, setFieldValue } = props;
  const [same, setSame] = useState(false);

  // While "same as permanent" is ticked, keep the current address in step with the permanent one
  useEffect(() => {
    if (!same) return;
    KEYS.forEach((k) => setFieldValue(CURRENT[k], values[PERMANENT[k]], false));
  }, [same, values.province, values.district, values.munVDC, values.wardNo, values.tole, setFieldValue]);

  const toggleSame = (e) => {
    setSame(e.target.checked);
    if (!e.target.checked) KEYS.forEach((k) => setFieldValue(CURRENT[k], '', false));
  };

  return (
    <section>
      <StepTitle>ठेगाना विवरण</StepTitle>

      <h3 className="mb-3 font-medium">स्थायी ठेगाना</h3>
      <AddressBlock names={PERMANENT} {...props} />

      <div className="mb-3 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
        <h3 className="font-medium">हालको ठेगाना</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-ledger" checked={same} onChange={toggleSame} />
          स्थायी ठेगाना जस्तै
        </label>
      </div>
      <AddressBlock names={CURRENT} {...props} readOnly={same} />
    </section>
  );
}
