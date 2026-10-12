// Form field name  ->  column name in the memberdetail table
export const MEMBER_FIELDS = [
  ['fullName', 'FullName'], ['fullNameEng', 'FullNameEng'], ['gender', 'Gender'], ['dob', 'DOB'], ['mobileNo', 'MobileNo'],
  ['maritalStatus', 'MaritalStatus'], ['email', 'Email'], ['citizenshipNo', 'CitizenshipNo'],
  ['citIssuedDistrict', 'CitIssuedDistrict'], ['citIssuedDate', 'CitIssuedDate'], ['passportNo', 'PassportNo'], ['panNo', 'PanNo'],
  ['province', 'Province'], ['district', 'District'], ['munVDC', 'MUNVDC'], ['wardNo', 'WardNo'], ['tole', 'Tole'],
  ['tmpProvince', 'TmpProvince'], ['tmpDistrict', 'TmpDistrict'], ['tmpMunVDC', 'TmpMUNVDC'], ['tmpWardNo', 'TmpWardNo'], ['tmpTole', 'TmpTole'],
  ['fatherName', 'FatherName'], ['motherName', 'MotherName'], ['grandFatherName', 'GrandfatherName'],
  ['spouseName', 'SpouseName'], ['fatherInLawName', 'FatherInLaw'],
  ['lat', 'Latitude'], ['lng', 'Longitude'],
];

// An empty form
export const blankValues = () => ({
  ...Object.fromEntries(MEMBER_FIELDS.map(([field]) => [field, ''])),
  photoIm: null,
  signIm: null,
});

// A saved member -> form values (used when editing)
export const toFormValues = (member) => ({
  ...Object.fromEntries(MEMBER_FIELDS.map(([field, column]) => [field, member[column] ?? ''])),
  photoIm: null, // stays null unless a new photo is chosen
  signIm: null,
});
