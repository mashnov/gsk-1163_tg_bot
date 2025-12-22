const { db } = require('../state/db');
const { emptyUser } = require('../const/db.js');

const getDbData = async (id) => {
    if (!id) {
        return;
    }

    return db.get(String(id));
};

const setDbData = async (id, data) => {
    if (!id) {
        return;
    }

    return db.set(String(id), data);
};

// USER DATA
const createUserData = async (accountId) => {
    if (!accountId) {
        return;
    }

    const originalData = await getDbData(accountId);

    if (originalData) {
        return originalData;
    }

    const createdAt = new Date().toISOString();
    const userData = {
        ...emptyUser,
        accountId: accountId,
        createdAt: createdAt,
        updatedAt: createdAt,
    };

    await setDbData(accountId, userData);
    return await getUserData(accountId);
};

const getUserData = async (accountId) => {
    return await createUserData(accountId);
};

const setUserData = async (accountId, patchData) => {
    if (!accountId) {
        return;
    }

    const originalData = { ...await getUserData(accountId) };

    const userData = {
        ...originalData,
        ...patchData,
        updatedAt: new Date().toISOString(),
    };

    if (patchData.userStatus) {
        await setUserIndex(accountId, { userStatus: patchData.userStatus });
    }

    return setDbData(accountId, userData);
};

// USER INDEX
const createUserIndex = async (indexId) => {
    if (!indexId) {
        return;
    }

    const userList = await getDbData(indexId);

    if (userList) {
        return userList;
    }

    await setDbData(indexId, []);
    return await getUserIndex(indexId);
};

const getUserIndex = async (indexId) => {
    return await createUserIndex(indexId);
};

const addUserToIndex = async (accountId, indexId) => {
    if (!indexId) {
        return;
    }
    const list = await getDbData(indexId) ?? [];
    const uniqueList = [...new Set([...list, String(accountId)])];
    return setDbData(indexId, uniqueList);
};

const removeUserFromIndex = async (accountId, indexId) => {
    if (!indexId) {
        return;
    }
    const list = (await getDbData(indexId)) ?? [];
    const filteredList = list.filter(id => id !== String(accountId));
    return setDbData(indexId, filteredList);
};

const setUserIndex = async (accountId, { userStatus }) => {
    const userData = await getDbData(accountId);
    await createUserIndex(userData?.userStatus);
    await createUserIndex(userStatus);
    await removeUserFromIndex(accountId, userData?.userStatus);
    await addUserToIndex(accountId, userStatus);
};

const getUserListByIndex = async (userIdList) => {
    if (!Array.isArray(userIdList) || !userIdList) {
        return [];
    }

    const usersData = await Promise.all(userIdList.map(id => getDbData(id)));
    return usersData.filter(Boolean);
};

// VERIFICATION INDEX
const createVerificationIndex = async () => {
    const verificationIndex = await getDbData('verificationIndex');

    if (verificationIndex) {
        return verificationIndex;
    }

    return setDbData('verificationIndex', {});
};

const getVerificationIndexItem = async (accountId = []) => {
    const verificationIndex = await getDbData('verificationIndex');
    return verificationIndex[accountId] || [];
};

const setVerificationIndexItem = async (accountId, messageList = []) => {
    if (!accountId) {
        return;
    }
    const verificationIndex = { ...await createVerificationIndex() };

    verificationIndex[accountId] = messageList;

    return setDbData('verificationIndex', verificationIndex);
};


module.exports = {
    getUserData,
    setUserData,
    getUserIndex,
    getUserListByIndex,
    getVerificationIndexItem,
    setVerificationIndexItem,
};
