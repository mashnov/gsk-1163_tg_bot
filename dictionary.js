const messageParams = {
    parse_mode: 'HTML',
    disable_web_page_preview: true
};

const metersList = [
    { icon: '💧', key: 'kitchenCold', label: 'Холодная вода (кухня)' },
    { icon: '🔥', key: 'kitchenHot', label: 'Горячая вода (кухня)' },
    { icon: '💧', key: 'toiletCold', label: 'Холодная вода (туалет)' },
    { icon: '🔥', key: 'toiletHot', label: 'Горячая вода (туалет)' },
];

// const accountantId = '1008899653';
const accountantId = '8410500310';
const adminId = '8410500310';

module.exports = {
    messageParams,
    metersList,
    accountantId,
    adminId,
};