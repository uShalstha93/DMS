import React, { useState, useEffect, useRef } from 'react';
import modDate from './modDate';
import './NepaliCalendar.css';

const NepaliCalendar = ({
    value,
    onChange,
    width = 100,
    placeholder = "YYYY/MM/DD",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [nepaliDate, setNepaliDate] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [calendarDays, setCalendarDays] = useState([]);
    const [popupPosition, setPopupPosition] = useState('bottom');
    const [selectedMonthName, setSelectedMonthName] = useState('');
    const calendarRef = useRef(null);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Month names mapping
    const monthNames = [
        'वैशाख', 'जेठ', 'असार ', 'साउन',
        'भदौ', 'असोज', 'कात्तिक', 'मंसिर',
        'पुस', 'माघ', 'फागुन', 'चैत'
    ];

    // Month name to number mapping
    const monthNameToNumber = {
        'वैशाख': '01',
        'जेठ': '02',
        'असार ': '03',
        'साउन': '04',
        'भदौ': '05',
        'असोज': '06',
        'कात्तिक': '07',
        'मंसिर': '08',
        'पुस': '09',
        'माघ': '10',
        'फागुन': '11',
        'चैत': '12'
    };

    // Initialize with current date or provided value
    useEffect(() => {
        const initializeDate = () => {
            if (value && modDate.isValidNepaliDate(value)) {
                setNepaliDate(value);
                parseDate(value);
            } else {
                const currentNepali = modDate.getCurrentNepaliDate();
                setNepaliDate(currentNepali);
                parseDate(currentNepali);
                if (onChange) {
                    onChange(currentNepali);
                }
            }
        };

        initializeDate();
    }, [value]);

    const calculatePopupPosition = () => {
        if (!inputRef.current || !containerRef.current) return 'bottom';

        const inputRect = inputRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;
        const calendarHeight = 350; // Approximate calendar height

        // If there's not enough space below but enough space above, open above
        if (spaceBelow < calendarHeight && spaceAbove > calendarHeight) {
            return 'top';
        }

        // Default to bottom
        return 'bottom';
    };

    const handleFocus = () => {
        const position = calculatePopupPosition();
        setPopupPosition(position);
        setIsOpen(true);
        parseDate(nepaliDate);
    };

    const parseDate = (dateStr) => {
        if (dateStr && dateStr.length === 10) {
            try {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(5, 7);
                const day = dateStr.substring(8, 10);
                setSelectedYear(year);
                setSelectedMonth(month);
                setSelectedDay(day);
                // Set month name
                const monthNum = parseInt(month);
                if (monthNum >= 1 && monthNum <= 12) {
                    setSelectedMonthName(monthNames[monthNum - 1]);
                }
                generateCalendar(year, month, day);
            } catch (error) {
                console.error('Error parsing date:', error);
            }
        }
    };

    const generateCalendar = (year, month, selectedDay) => {
        try {
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);

            // Get first day of the month in English date
            const firstDayEng = modDate.nepToEng(`${year}/${month}/01`);
            const startingDay = modDate.getDayOfWeek(firstDayEng); // 1 = Sunday

            const daysInMonth = modDate.getMasanta(yearNum, monthNum);
            const days = [];

            // Add empty cells for days before the 1st
            for (let i = 1; i < startingDay; i++) {
                days.push({ day: '', isEmpty: true });
            }

            // Add days of the month
            for (let i = 1; i <= daysInMonth; i++) {
                days.push({
                    day: i,
                    isSelected: i === parseInt(selectedDay || 0),
                    isEmpty: false
                });
            }

            setCalendarDays(days);
        } catch (error) {
            console.error('Error generating calendar:', error);
            setCalendarDays([]);
        }
    };

    const handleInputChange = (e) => {
        let value = e.target.value.replace(/[^0-9/]/g, '');

        // Auto-format as user types: YYYY/MM/DD
        if (value.length === 4 && !value.includes('/')) {
            value = value + '/';
        } else if (value.length === 7 && value.split('/').length === 2) {
            value = value + '/';
        }

        // Validate year
        if (value.length >= 4) {
            const year = value.substring(0, 4);
            const yearNum = parseInt(year);
            if (yearNum < 2050 || yearNum > 2099) {
                const currentYear = modDate.getNepaliYear(new Date());
                value = currentYear + value.substring(4);
            }
            setSelectedYear(year);
        }

        // Validate month
        if (value.length >= 7) {
            const month = value.substring(5, 7);
            const monthNum = parseInt(month);
            if (monthNum < 1 || monthNum > 12) {
                const currentMonth = modDate.getNepaliMonth(new Date());
                const formattedMonth = currentMonth.toString().padStart(2, '0');
                value = value.substring(0, 5) + formattedMonth + value.substring(7);
            } else {
                // Update month name when month number changes
                setSelectedMonthName(monthNames[monthNum - 1]);
            }
            setSelectedMonth(month);
        }

        // Validate day
        if (value.length === 10) {
            const day = value.substring(8, 10);
            const dayNum = parseInt(day);
            const yearNum = parseInt(value.substring(0, 4));
            const monthNum = parseInt(value.substring(5, 7));
            const daysInMonth = modDate.getMasanta(yearNum, monthNum);

            if (dayNum < 1 || dayNum > daysInMonth) {
                const currentDay = modDate.getNepaliDay(new Date());
                const formattedDay = currentDay.toString().padStart(2, '0');
                value = value.substring(0, 8) + formattedDay;
            }
            setSelectedDay(day);
        }

        setNepaliDate(value);
        if (value.length === 10 && onChange) {
            onChange(value);
            parseDate(value);
        }
    };

    const handleDayClick = (day) => {
        if (day.isEmpty) return;

        const formattedMonth = selectedMonth.padStart(2, '0');
        const formattedDay = day.day.toString().padStart(2, '0');
        const newDate = `${selectedYear}/${formattedMonth}/${formattedDay}`;

        setNepaliDate(newDate);
        setSelectedDay(day.day.toString());

        if (onChange) {
            onChange(newDate);
        }

        setIsOpen(false);

        // Update calendar with selected day
        generateCalendar(selectedYear, selectedMonth, day.day.toString());
    };

    const handleYearChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length <= 4) {
            setSelectedYear(value);
            if (value.length === 4) {
                const yearNum = parseInt(value);
                if (yearNum >= 2050 && yearNum <= 2099) {
                    generateCalendar(value, selectedMonth, selectedDay);
                }
            }
        }
    };

    const handleMonthChange = (e) => {
        const value = e.target.value;
        // Check if input is numeric
        if (/^\d+$/.test(value)) {
            // Handle numeric input (for backward compatibility)
            const monthNum = parseInt(value);
            if (monthNum >= 1 && monthNum <= 12) {
                const formattedMonth = monthNum.toString().padStart(2, '0');
                setSelectedMonth(formattedMonth);
                setSelectedMonthName(monthNames[monthNum - 1]);
                if (selectedYear && selectedYear.length === 4) {
                    generateCalendar(selectedYear, formattedMonth, selectedDay);
                }
            }
        } else {
            // Handle text input (month name)
            const matchedMonth = Object.keys(monthNameToNumber).find(name =>
                name.toLowerCase().startsWith(value.toLowerCase())
            );

            if (matchedMonth) {
                const monthNum = monthNameToNumber[matchedMonth];
                setSelectedMonth(monthNum);
                setSelectedMonthName(matchedMonth);
                if (selectedYear && selectedYear.length === 4) {
                    generateCalendar(selectedYear, monthNum, selectedDay);
                }
            } else if (value === '') {
                setSelectedMonthName('');
                setSelectedMonth('');
            }
        }
    };

    const incrementYear = () => {
        let yearNum = parseInt(selectedYear || '2050');
        if (yearNum < 2099) {
            yearNum++;
            const newYear = yearNum.toString();
            setSelectedYear(newYear);
            generateCalendar(newYear, selectedMonth, selectedDay);
        }
    };

    const decrementYear = () => {
        let yearNum = parseInt(selectedYear || '2050');
        if (yearNum > 2050) {
            yearNum--;
            const newYear = yearNum.toString();
            setSelectedYear(newYear);
            generateCalendar(newYear, selectedMonth, selectedDay);
        }
    };

    const incrementMonth = () => {
        let monthNum = parseInt(selectedMonth || '01');
        if (monthNum < 12) {
            monthNum++;
        } else {
            monthNum = 1;
            incrementYear();
        }
        const newMonth = monthNum.toString().padStart(2, '0');
        setSelectedMonth(newMonth);
        setSelectedMonthName(monthNames[monthNum - 1]);
        generateCalendar(selectedYear, newMonth, selectedDay);
    };

    const decrementMonth = () => {
        let monthNum = parseInt(selectedMonth || '01');
        if (monthNum > 1) {
            monthNum--;
        } else {
            monthNum = 12;
            decrementYear();
        }
        const newMonth = monthNum.toString().padStart(2, '0');
        setSelectedMonth(newMonth);
        setSelectedMonthName(monthNames[monthNum - 1]);
        generateCalendar(selectedYear, newMonth, selectedDay);
    };

    const handleClickOutside = (event) => {
        if (
            calendarRef.current &&
            !calendarRef.current.contains(event.target) &&
            inputRef.current &&
            !inputRef.current.contains(event.target)
        ) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Update position on window resize
    useEffect(() => {
        const handleResize = () => {
            if (isOpen) {
                const position = calculatePopupPosition();
                setPopupPosition(position);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen]);

    // Week day headers
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className="nepali-calendar-container" ref={containerRef}>
            <div className="input-container" style={{ width: `${width}px` }}>
                <input
                    ref={inputRef}
                    type="text"
                    className="nepali-date-input"
                    value={nepaliDate}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    maxLength="10"
                    disabled={disabled}
                    onFocus={handleFocus}
                />
            </div>

            {isOpen && (
                <div
                    ref={calendarRef}
                    className={`calendar-popup ${popupPosition === 'top' ? 'calendar-popup-top' : 'calendar-popup-bottom'}`}
                    style={{
                        [popupPosition === 'top' ? 'bottom' : 'top']: '100%',
                        right: '0'
                    }}
                >
                    <div className="calendar-header">
                        <div className="year-control">
                            <input
                                type="text"
                                className="year-input"
                                value={selectedYear}
                                onChange={handleYearChange}
                                maxLength="4"
                            />
                            <div className="year-buttons">
                                <button className="year-btn up" onClick={incrementYear} type="button">▲</button>
                                <button className="year-btn down" onClick={decrementYear} type="button">▼</button>
                            </div>
                        </div>

                        <div className="month-control">
                            <input
                                type="text"
                                className="month-input"
                                value={selectedMonthName}
                                onChange={handleMonthChange}
                                placeholder="Month"
                            />
                            <div className="month-buttons">
                                <button className="month-btn up" onClick={incrementMonth} type="button">▲</button>
                                <button className="month-btn down" onClick={decrementMonth} type="button">▼</button>
                            </div>
                        </div>
                    </div>

                    <div className="week-days">
                        {weekDays.map((day, index) => (
                            <div key={index} className={`week-day ${day === 'Sa' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="calendar-grid">
                        {calendarDays.map((dayObj, index) => {
                            const isSaturday = !dayObj.isEmpty && (index % 7 === 6);
                            return (
                                <button
                                    key={index}
                                    className={`calendar-day ${dayObj.isEmpty ? 'empty' : ''} ${dayObj.isSelected ? 'selected' : ''} ${isSaturday ? 'saturday-day' : ''}`}
                                    onClick={() => handleDayClick(dayObj)}
                                    disabled={dayObj.isEmpty}
                                    type="button"
                                >
                                    {dayObj.day || ''}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NepaliCalendar;