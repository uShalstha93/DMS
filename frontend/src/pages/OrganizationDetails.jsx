import { useEffect, useState, useRef } from 'react';
import { Building2, Upload, Trash2, CheckCircle2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { organizationApi } from '../api/organization';
import { addressApi } from '../api/members';
import { errorMessage } from '../api/axios';

const IMG_URL = import.meta.env.VITE_IMG_URL || '/uploads';

export default function OrganizationDetails() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    companyname: '',
    province: '',
    district: '',
    munvdc: '',
    wardno: '',
    tole: '',
    contactno: '',
    panno: '',
    registrationdate: '',
    email: '',
  });

  const [existingLogo, setExistingLogo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  // Address cascade dropdowns
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  const fileInputRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    let alive = true;
    Promise.all([
      organizationApi.get(),
      addressApi.provinces().catch(() => []),
    ])
      .then(([orgData, provList]) => {
        if (!alive) return;
        if (provList?.length) setProvinces(provList);
        if (orgData) {
          setForm({
            companyname: orgData.companyname || '',
            province: orgData.province || '',
            district: orgData.district || '',
            munvdc: orgData.munvdc || '',
            wardno: orgData.wardno || '',
            tole: orgData.tole || '',
            contactno: orgData.contactno || '',
            panno: orgData.panno || '',
            registrationdate: orgData.registrationdate || '',
            email: orgData.email || '',
          });
          if (orgData.logo) {
            setExistingLogo(orgData.logo);
          }
        }
      })
      .catch((err) => {
        if (alive) {
          setMessage({
            type: 'error',
            text: errorMessage(err, 'Failed to load organization details'),
          });
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // Cascade: province -> districts
  useEffect(() => {
    if (!form.province) {
      setDistricts([]);
      return;
    }
    let alive = true;
    addressApi
      .districts(form.province)
      .then((d) => {
        if (alive) setDistricts(d || []);
      })
      .catch((e) => console.error(e));
    return () => {
      alive = false;
    };
  }, [form.province]);

  // Cascade: district -> municipalities
  useEffect(() => {
    if (!form.district) {
      setMunicipalities([]);
      return;
    }
    let alive = true;
    addressApi
      .municipalities(form.province, form.district)
      .then((m) => {
        if (alive) setMunicipalities(m || []);
      })
      .catch((e) => console.error(e));
    return () => {
      alive = false;
    };
  }, [form.province, form.district]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Clear dependent fields on cascade change
      if (name === 'province') {
        updated.district = '';
        updated.munvdc = '';
      } else if (name === 'district') {
        updated.munvdc = '';
      }
      return updated;
    });
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Please select a valid image file (PNG or JPG)' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Logo image size must be under 2MB' });
      return;
    }

    setLogoFile(file);
    setRemoveLogo(false);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyname.trim()) {
      setMessage({ type: 'error', text: 'Please enter the company name' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('companyname', form.companyname.trim());
      formData.append('province', form.province || '');
      formData.append('district', form.district || '');
      formData.append('munvdc', form.munvdc || '');
      formData.append('wardno', form.wardno || '');
      formData.append('tole', form.tole || '');
      formData.append('contactno', form.contactno || '');
      formData.append('panno', form.panno || '');
      formData.append('registrationdate', form.registrationdate || '');
      formData.append('email', form.email || '');

      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (removeLogo) {
        formData.append('remove_logo', 'true');
      }

      const res = await organizationApi.save(formData);
      setMessage({
        type: 'success',
        text: res.message || 'Organization details saved successfully',
      });

      if (res.organization) {
        setExistingLogo(res.organization.logo || null);
        setLogoFile(null);
        setLogoPreview(null);
        setRemoveLogo(false);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: errorMessage(err, 'Could not save organization details. Please try again.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const currentDisplayLogo =
    logoPreview ||
    (!removeLogo && existingLogo ? `${IMG_URL}/organization/logo/${existingLogo}` : null);

  const fullAddress = [
    form.tole,
    form.wardno ? `वडा नं. ${form.wardno}` : null,
    form.munvdc,
    form.district,
    form.province,
  ]
    .filter(Boolean)
    .join(', ');

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading organization details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl pb-12">
      <PageHeader
        title="Organization Details"
        subtitle="Configure institution identity, registered address, PAN/VAT credentials, and official logo."
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Save Organization Details</span>
            </>
          )}
        </button>
      </PageHeader>

      {message.text && (
        <div
          role="alert"
          className={`mb-6 flex items-center gap-3 rounded-lg border p-4 text-sm font-medium ${message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
            }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Details (Left 2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Identity Panel */}
            <div className="panel p-6">
              <h2 className="flex items-center gap-2 border-b border-rule pb-3 font-semibold text-ink">
                <Building2 className="h-5 w-5 text-ledger" />
                <span>Basic Identity & Registration</span>
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="companyname" className="label">
                    Company / Organization Name <span className="text-stamp">*</span>
                  </label>
                  <input
                    id="companyname"
                    name="companyname"
                    type="text"
                    required
                    value={form.companyname}
                    onChange={handleChange}
                    placeholder="e.g. Savings & Credit Co-operative Ltd."
                    className="field font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="panno" className="label">
                    PAN / VAT Number
                  </label>
                  <input
                    id="panno"
                    name="panno"
                    type="text"
                    value={form.panno}
                    onChange={handleChange}
                    placeholder="e.g. 600123456"
                    className="field tabular-nums"
                  />
                </div>

                <div>
                  <label htmlFor="registrationdate" className="label">
                    Registration Date
                  </label>
                  <input
                    id="registrationdate"
                    name="registrationdate"
                    type="text"
                    value={form.registrationdate}
                    onChange={handleChange}
                    placeholder="e.g. 2075-01-15 or 2018-04-28"
                    className="field tabular-nums"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="label">
                    Official Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g. info@dmsfinance.org.np"
                    className="field"
                  />
                </div>

                <div>
                  <label htmlFor="contactno" className="label">
                    Contact Phone / Mobile
                  </label>
                  <input
                    id="contactno"
                    name="contactno"
                    type="tel"
                    value={form.contactno}
                    onChange={handleChange}
                    placeholder="e.g. 01-4412345, 9851000000"
                    className="field tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Registered Address Panel */}
            <div className="panel p-6">
              <h2 className="flex items-center gap-2 border-b border-rule pb-3 font-semibold text-ink">
                <span>Registered Office Address</span>
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="province" className="label">
                    Province (प्रदेश)
                  </label>
                  <select
                    id="province"
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    className="field"
                  >
                    <option value="">Select Province</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="district" className="label">
                    District (जिल्ला)
                  </label>
                  <select
                    id="district"
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    disabled={!form.province}
                    className="field disabled:bg-paper"
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="munvdc" className="label">
                    Municipality / Palika (न.पा. / गा.पा.)
                  </label>
                  <select
                    id="munvdc"
                    name="munvdc"
                    value={form.munvdc}
                    onChange={handleChange}
                    disabled={!form.district}
                    className="field disabled:bg-paper"
                  >
                    <option value="">Select Municipality</option>
                    {municipalities.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.type || 'स्थानीय तह'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="wardno" className="label">
                    Ward Number (वडा नं.)
                  </label>
                  <input
                    id="wardno"
                    name="wardno"
                    type="text"
                    value={form.wardno}
                    onChange={handleChange}
                    placeholder="e.g. 10"
                    className="field tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="tole" className="label">
                    Tole / Street Name (टोल / सडक)
                  </label>
                  <input
                    id="tole"
                    name="tole"
                    type="text"
                    value={form.tole}
                    onChange={handleChange}
                    placeholder="e.g. Baneshwor, Shantinagar"
                    className="field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Logo & Preview */}
          <div className="space-y-6">
            {/* Logo Upload Panel */}
            <div className="panel p-6">
              <h2 className="flex items-center gap-2 border-b border-rule pb-3 font-semibold text-ink">
                <Upload className="h-5 w-5 text-ledger" />
                <span>Official Organization Logo</span>
              </h2>

              <div className="mt-4 flex flex-col items-center">
                {/* Logo Display Box */}
                <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-rule bg-paper p-3 transition-colors hover:border-ledger">
                  {currentDisplayLogo ? (
                    <img
                      src={currentDisplayLogo}
                      alt={form.companyname || 'Organization Logo'}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Building2 className="mx-auto h-12 w-12 stroke-[1.25]" />
                      <p className="mt-2 text-xs">No logo uploaded yet</p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoSelect}
                  className="hidden"
                />

                <div className="mt-4 flex w-full gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary flex-1"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{currentDisplayLogo ? 'Change Logo' : 'Upload Logo'}</span>
                  </button>

                  {currentDisplayLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="btn-secondary text-stamp hover:bg-stamp-tint"
                      title="Remove current logo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="mt-2 text-center text-xs text-slate-400">
                  Recommended: High-resolution PNG or JPG, max 2MB.
                </p>
              </div>
            </div>

            {/* Document Header Preview Card */}
            <div className="panel overflow-hidden">
              <div className="border-b border-rule bg-paper px-4 py-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <Eye className="h-4 w-4 text-ledger" />
                  <span>Document Header Preview</span>
                </h3>
              </div>

              <div className="p-5 text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded border border-rule bg-paper">
                  {currentDisplayLogo ? (
                    <img
                      src={currentDisplayLogo}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Building2 className="h-7 w-7 text-slate-400" />
                  )}
                </div>

                <h4 className="font-serif text-base font-semibold leading-snug text-ink">
                  {form.companyname || 'Organization Name'}
                </h4>

                <p className="mt-1 text-xs text-slate-600">
                  {fullAddress || 'Registered Office Address'}
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  {form.contactno && <span>फोन: {form.contactno}</span>}
                  {form.email && <span>इमेल: {form.email}</span>}
                  {form.panno && <span>स्थायी लेखा नं: {form.panno}</span>}
                </div>

                <div className="mt-4 border-t border-dashed border-rule pt-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Official Header on Loan Agreements & Receipts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
