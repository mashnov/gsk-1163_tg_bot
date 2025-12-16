const { sessions } = require('../state/sessions');
const { emptySession } = require('../const/sessions');

const initStore = (accountId, action) => {
    const session = { ...emptySession };
    session.action = action;
    clearStore(accountId);
    sessions.set(accountId, session);
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
