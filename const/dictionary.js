const messageParams = {
    parse_mode: 'HTML',
    disable_web_page_preview: true
};

const backOption = { start: '⬅️ Назад' };
const homeOption = { start: '🏠 На главную' };
const closeOption = { close: 'Закрыть' };

// todo: get accounts ex 1008899653
const accountIds = {
    chairman: '8410500310',
    accountant: '8410500310',
    admin: '8410500310',
};

const accountList = {
    chairman: 'chairman',
    accountant: 'accountant',
    admin: 'admin',
};

module.exports = {
    messageParams,
    accountIds,
    accountList,
    backOption,
    homeOption,
    closeOption,
};