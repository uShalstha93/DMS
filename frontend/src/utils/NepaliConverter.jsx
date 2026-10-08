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