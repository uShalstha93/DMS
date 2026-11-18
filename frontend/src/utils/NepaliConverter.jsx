const nepaliNumbers = {
    '0': '०',
    '1': '१',
    '2': '२',
    '3': '३',
    '4': '४',
    '5': '५',
    '6': '६',
    '7': '७',
    '8': '८',
    '9': '९'
};

// Convert English numbers to Nepali numbers
export const convertToNepaliNumber = (number) => {
    if (number === null || number === undefined) return '';

    const numberString = number.toString();
    let nepaliNumber = '';

    for (let i = 0; i < numberString.length; i++) {
        const char = numberString[i];
        nepaliNumber += nepaliNumbers[char] || char;
    }

    return nepaliNumber;
};

// Convert entire text with numbers to Nepali numbers
export const convertTextToNepaliNumbers = (text) => {
    if (!text) return '';

    return text.toString().replace(/[0-9]/g, (match) => {
        return nepaliNumbers[match] || match;
    });
};

// Formats a number (whether in Nepali digits or English digits) into Nepali currency format with commas
export const formatNepaliCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const nepToEng = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
    const cleanStr = String(val).replace(/[, ]/g, '').replace(/[०-९]/g, (d) => nepToEng[d] || d);
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return convertToNepaliNumber(val);
    return convertToNepaliNumber(num.toLocaleString('en-IN'));
};