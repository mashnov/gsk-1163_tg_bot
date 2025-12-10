const { sessions } = require('../state/sessions');
const { emptySession } = require('../const/sessions');

const initStore = (userId, action) => {
    const session = { ...emptySession };
    session.action = action;
    clearStore(userId);
    sessions.set(userId, session);
};

const getSession = (userId) => {
    return sessions.get(userId);
};

const clearStore = (userId) => {
    sessions.delete(userId);
};

module.exports = {
    initStore,
    getSession,
};
