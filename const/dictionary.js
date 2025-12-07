const messageParams = {
    parse_mode: 'HTML',
    disable_web_page_preview: true
};

const cancelOption = { start: 'Выйти' };
const closeOption = { close: 'Закрыть' };

// todo: get accounts ex 1008899653
const accountIds = {
    chairman: '8410500310',
    accountant: '8410500310',
    admin: '8410500310',
};

module.exports = {
    messageParams,
    accountIds,
    cancelOption,
    closeOption,
};