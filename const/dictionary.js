const messageParams = {
    parse_mode: 'HTML',
    disable_web_page_preview: true
};

const backOption = { start: '⬅️ Назад' };
const homeOption = { start: '🏠 На главную' };
const closeOption = { close: 'Закрыть' };

module.exports = {
    messageParams,
    backOption,
    homeOption,
    closeOption,
};