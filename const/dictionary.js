const messageParams = {
    parse_mode: 'HTML',
    disable_web_page_preview: true
};

const moduleNames = {
    contact: 'contact',
    debtors: 'debtors',
    messages: 'messages',
    meter: 'meter',
    profiles: 'profiles',
    rules: 'rules',
    verification: 'verification',
    complaint: 'complaint',
    anonymous: 'anonymous',
    backup: 'backup',
    export: 'export',
    unblock: 'unblock',
    unverified: 'unverified',
    weather: 'weather',
    horoscope: 'horoscope',
    holiday: 'holiday',
};

const backOption = { start: '⬅️ Назад' };
const homeOption = { start: '🏠 На главную' };
const closeOption = { close: 'Закрыть' };

module.exports = {
    messageParams,
    moduleNames,
    backOption,
    homeOption,
    closeOption,
};