// Utility function to calculate age

import NepaliDate from "nepali-date-converter";

export const calculateAgeFromNepaliDate = (nepaliDob) => {
  if (!nepaliDob) return null;

  try {
    const dob = new NepaliDate(nepaliDob);
    const today = new Date();

    const birthDate = dob.toJsDate();

    //Calclulate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age < 0 ? 0 : age;
  } catch (error) {
    console.error(`Error converting Nepali date: ${nepaliDob}`, error);
    return null;
  }
}

// export const calculateAge = (dob) => {
//   if (!dob) return null;

//   const birthDate = new Date(dob);
//   const today = new Date();

//   let age = today.getFullYear() - birthDate.getFullYear();
//   const monthDiff = today.getMonth() - birthDate.getMonth();

//   // Adjust age if birthday hasn't occurred yet this year
//   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//     age--;
//   }

//   return age;
// };