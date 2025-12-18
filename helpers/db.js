const { db } = require('../state/db');
const { emptyUser, userStatusList } = require('../const/db.js');

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
        userStatus: userStatusList.unverified,
        createdAt: createdAt,
        updatedAt: createdAt,
    };

    await updateUserIndex(accountId, { userStatus: userStatusList.unverified });

    return setDbData(accountId, userData);
};

const updateUserData = async (accountId, patchData) => {
    if (!accountId) {
        return;
    }

    await createUserData(accountId);

    const originalData = await getDbData(accountId);

    const userData = {
        ...originalData,
        ...patchData,
        updatedAt: new Date().toISOString(),
    };

    if (patchData.userStatus) {
        await updateUserIndex(accountId, { userStatus: patchData.userStatus });
    }

    if (patchData.userRole) {
        await updateUserIndex(accountId, { userRole: patchData.userRole });
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

    return setDbData(indexId, []);
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

const updateUserIndex = async (accountId, { userStatus, userRole }) => {
    const indexId = userStatus || userRole;
    const userData = await getDbData(accountId);
    const currentIndexId = userStatus ? userData?.userStatus : userData?.userRole;
    await createUserIndex(currentIndexId);
    await createUserIndex(indexId);
    await removeUserFromIndex(accountId, currentIndexId);
    await addUserToIndex(accountId, indexId);
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
    const verificationIndex = { ...(await createVerificationIndex()) };

    verificationIndex[accountId] = messageList;

    return setDbData('verificationIndex', verificationIndex);
};


module.exports = {
    getDbData,
    updateUserData,
    getUserListByIndex,
    getVerificationIndexItem,
    setVerificationIndexItem,
};
