export const convertToNepaliWords = (nepaliNumber) => {
    if (!nepaliNumber) return '';

    // Remove commas and spaces from Nepali number
    const cleanNumber = nepaliNumber.toString().replace(/[, ]/g, '');

    // Nepali digit mapping
    const nepaliDigits = {
        '०': 0, '१': 1, '२': 2, '३': 3, '४': 4,
        '५': 5, '६': 6, '७': 7, '८': 8, '९': 9
    };

    // Convert Nepali string to numerical value
    let numericalValue = 0;
    for (let char of cleanNumber) {
        if (nepaliDigits[char] !== undefined) {
            numericalValue = numericalValue * 10 + nepaliDigits[char];
        }
    }

    if (numericalValue === 0) return 'शून्य';

    const smallNumbers = [
        '', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ', 'दश',
        'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस', 'बीस',
        'एकाइस', 'बाइस', 'तेइस', 'चौबिस', 'पच्चिस', 'छब्बिस', 'सत्ताइस', 'अठ्ठाइस', 'उनन्तिस', 'तीस',
        'एकतिस', 'बत्तिस', 'तेत्तिस', 'चौँतिस', 'पैंतिस', 'छत्तिस', 'सैँतिस', 'अठ्तिस', 'उनन्चालीस', 'चालीस',
        'एकचालीस', 'बयालीस', 'तिर्चालिस', 'चवालीस', 'पैंतालीस', 'छयालीस', 'सच्चालीस', 'अठचालीस', 'उनन्चास', 'पचास',
        'एकाउन्न', 'बाउन्न', 'तिर्पौन', 'चवन्न', 'पचपन्न', 'छपन्न', 'सन्ताउन्न', 'अन्ठाउन्न', 'उनन्साठी', 'साठी',
        'एकसाठी', 'बयसाठी', 'तिरसाठी', 'चौंसाठी', 'पैंसाठी', 'छयसाठी', 'सरसठी', 'अठसाठी', 'उनन्सत्तरी', 'सत्तरी',
        'एकत्तर', 'बयत्तर', 'तिरेत्तर', 'चौत्तर', 'पचत्तर', 'छयत्तर', 'सरत्तर', 'अठत्तर', 'उन्ननअसी', 'असी',
        'एकासी', 'बयासी', 'तिर्यासी', 'चौरासी', 'पचासी', 'छयासी', 'सतासी', 'अठासी', 'उनान्नब्बे', 'नब्बे',
        'एकान्नब्बे', 'बयान्नब्बे', 'तिरान्नब्बे', 'चौरान्नब्बे', 'पन्चान्नब्बे', 'छयान्नब्बे', 'सन्तान्नब्बे', 'अन्ठान्नब्बे', 'उनान्सय'
    ];

    const units = ['', 'हजार', 'लाख', 'करोड'];

    // Convert numbers below 100
    const convertBelowHundred = (num) => {
        if (num <= 99) return smallNumbers[num];
        return smallNumbers[num]; // Your smallNumbers array already has all numbers up to 99
    };

    // Convert numbers below 1000
    const convertBelowThousand = (num) => {
        if (num === 0) return '';

        const hundred = Math.floor(num / 100);
        const remainder = num % 100;
        let result = '';

        if (hundred > 0) {
            result += smallNumbers[hundred] + ' सय';
        }
        if (remainder > 0) {
            result += (result ? ' ' : '') + convertBelowHundred(remainder);
        }
        return result;
    };

    if (numericalValue < 1000) {
        return convertBelowThousand(numericalValue);
    }

    // For numbers 1000 and above - use proper Indian numbering system grouping
    let result = '';
    let num = numericalValue;
    let unitIndex = 0;

    while (num > 0) {
        let chunk;

        if (unitIndex === 0) {
            // For units place (last 3 digits) - handle hundreds, tens, units
            chunk = num % 1000;
            if (chunk !== 0) {
                const chunkText = convertBelowThousand(chunk);
                result = chunkText + (result ? ' ' + result : '');
            }
            num = Math.floor(num / 1000);
            unitIndex++;
        } else {
            // For thousands, lakhs, crores (handle 2 digits at a time)
            chunk = num % 100;
            if (chunk !== 0) {
                const chunkText = convertBelowHundred(chunk) + ' ' + units[unitIndex];
                result = chunkText + (result ? ' ' + result : '');
            }
            num = Math.floor(num / 100);
            unitIndex++;
        }

        // Safety break to prevent infinite loops
        if (unitIndex > 10) break;
    }

    return result.trim();
}