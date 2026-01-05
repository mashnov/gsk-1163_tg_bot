const Holidays = require('date-holidays');
const holidays = new Holidays('RU');

const getHolidays = (actionType) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0')

    const filter = {
        'year': `${year}`,
        'month': `${year}-${month}`,
        'today': `${year}-${month}-${day}`,
    };

    return holidays.getHolidays(year).filter(holiday => holiday.date.startsWith(filter[actionType]))
};

module.exports = {
    getHolidays,
};