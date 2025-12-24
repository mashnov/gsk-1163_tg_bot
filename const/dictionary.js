const messageParams = {
    parse_mode: 'HTML',
    disable_web_page_preview: true
};

const moduleNames = {
    contact: 'contact',
    messages: 'messages',
    meter: 'meter',
    profiles: 'profiles',
    rules: 'rules',
    verification: 'verification',
    unblock: 'unblock',
    backup: 'backup',
    weather: 'weather',
    horoscope: 'horoscope',
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