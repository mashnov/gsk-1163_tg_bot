const { sessions } = require('../state/sessions');

const initStore = ({ accountId, chatId, moduleName }) => {
    clearStore(accountId);
    sessions.set(accountId, {
        moduleName,
        chatId,
        accountId,
        stepIndex: 0,
        stepMessageId: undefined,
    });
};

const getSession = (accountId) => {
    return sessions.get(accountId);
};

const clearStore = (accountId) => {
    sessions.delete(accountId);
};

module.exports = {
    initStore,
    getSession,
};
