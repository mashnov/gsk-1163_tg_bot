const { db } = require('../state/db');
const { emptyUser, userStatus } = require('../const/db.js');

const getUserData = async (userId) => {
    return db.get(String(userId));
};

const setUserData = async (userId, userData) => {
    return db.set(String(userId), userData);
};

const updateUserData = async (userId, patchData) => {
    const originalData = await getUserData(userId);
    const userData = {
        ...originalData,
        ...patchData,
    };
    userData.updatedAt = new Date().toISOString();
    return setUserData(userId, patchData);
}

const createUser = async (userId) => {
    const originalData = await getUserData(userId);

    if (originalData) {
        return originalData;
    }

    const createdAt = new Date().toISOString();
    const userData = { ...emptyUser };
    userData.userId = userId;
    userData.userStatus = userStatus.unverified;
    userData.createdAt = createdAt;
    userData.updatedAt = createdAt;
    return setUserData(userId, userData);
}

const getUserStatus = async (userId) => {
    const userData = await getUserData(userId);
    return userData?.userStatus || userStatus.unverified;
}

module.exports = {
    createUser,
    updateUserData,
    getUserStatus,
};
