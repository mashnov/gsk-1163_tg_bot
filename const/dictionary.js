const messageParams = {
    parse_mode: 'HTML',
    disable_web_page_preview: true
};

const moduleNames = {
    start: 'start',
    contact: 'contact',
    messages: 'messages',
    meter: 'meter',
    profiles: 'profiles',
    rules: 'rules',
    verification: 'verification',
    admin: 'admin',
    export: 'export',
    unblock: 'unblock',
    unverified: 'unverified',
    weather: 'weather',
    horoscope: 'horoscope',
    milkman: 'milkman',
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