// Form field (camelCase)  ->  column in the memberdetail table
export const FIELDS = {
  fullName: 'FullName', fullNameEng: 'FullNameEng', gender: 'Gender', dob: 'DOB', mobileNo: 'MobileNo',
  maritalStatus: 'MaritalStatus', email: 'Email', citizenshipNo: 'CitizenshipNo',
  citIssuedDistrict: 'CitIssuedDistrict', citIssuedDate: 'CitIssuedDate', passportNo: 'PassportNo', panNo: 'PanNo',
  province: 'Province', district: 'District', munVDC: 'MUNVDC', wardNo: 'WardNo', tole: 'Tole',
  tmpProvince: 'TmpProvince', tmpDistrict: 'TmpDistrict', tmpMunVDC: 'TmpMUNVDC', tmpWardNo: 'TmpWardNo', tmpTole: 'TmpTole',
  fatherName: 'FatherName', motherName: 'MotherName', grandFatherName: 'GrandfatherName',
  spouseName: 'SpouseName', fatherInLawName: 'FatherInLaw',
  lat: 'Latitude', lng: 'Longitude',
};

// Fields that must be filled
const REQUIRED = {
  fullName: 'Enter the full name',
  fullNameEng: 'Enter the name in English',
  gender: 'Choose the gender',
  dob: 'Enter the date of birth',
  mobileNo: 'Enter the mobile number',
  citizenshipNo: 'Enter the citizenship number',
  province: 'Choose the province',
  district: 'Choose the district',
  munVDC: 'Choose the municipality',
  wardNo: 'Enter the ward number',
};

// Column sizes in the table (everything else is 100)
const MAX = { fullName: 255, fullNameEng: 255, maritalStatus: 255, fatherInLawName: 255, lat: 255, lng: 255, mobileNo: 20, panNo: 20 };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE = /^[0-9०-९+\-\s]{7,20}$/; // English or Nepali digits

export function clean(body = {}) {
  const v = {};
  for (const key of Object.keys(FIELDS)) v[key] = typeof body[key] === 'string' ? body[key].trim() : '';
  return v;
}

export function validate(v) {
  const errors = {};
  for (const [key, message] of Object.entries(REQUIRED)) if (!v[key]) errors[key] = message;
  for (const key of Object.keys(FIELDS)) {
    const max = MAX[key] ?? 100;
    if (v[key].length > max && !errors[key]) errors[key] = `Use at most ${max} characters`;
  }
  if (v.mobileNo && !errors.mobileNo && !MOBILE.test(v.mobileNo)) errors.mobileNo = 'Enter a valid mobile number';
  if (v.email && !errors.email && !EMAIL.test(v.email)) errors.email = 'Enter a valid email';
  for (const [key, limit] of [['lat', 90], ['lng', 180]]) {
    if (v[key] && !errors[key]) {
      const n = Number(v[key]);
      if (!Number.isFinite(n) || Math.abs(n) > limit) errors[key] = 'Enter a valid number';
    }
  }
  return errors;
}

// Member number = branch code + running 5-digit number, e.g. 00200007
export const nextMemberNo = (branchCode, lastNumber) => `${branchCode}${String(lastNumber + 1).padStart(5, '0')}`;

// Editing: needs membership.edit. Once a member is approved, only an approver may still change it.
export function canEditMember(user, member) {
  return user.permissions.includes('membership.edit') &&
    (member.ApprovedStatus !== 1 || user.permissions.includes('membership.approve'));
}
