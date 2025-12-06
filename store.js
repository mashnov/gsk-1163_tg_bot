const sessions = new Map();

const emptySession = {
    action: undefined,
    messageId: undefined,
    stepIndex: 0,
}

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
    clearStore,
};
