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
};

const commandNames = {
    rules: 'rules:start',
    contact: 'contact:start',
    verification: 'verification:start',
    messages: 'messages:start',
    meter: 'meter:start',
    profiles: 'profiles:start',
    unblock: 'unblock:start',
    backup: 'backup:start',
    weather: 'weather:start',
};

const backOption = { start: '⬅️ Назад' };
const homeOption = { start: '🏠 На главную' };
const closeOption = { close: 'Закрыть' };

module.exports = {
    messageParams,
    commandNames,
    moduleNames,
    backOption,
    homeOption,
    closeOption,
};