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

const getUserListByIndex = async (indexId) => {
    if (!indexId) {
        return [];
    }

    const userList = await getDbData(indexId);

    if (!Array.isArray(userList)) {
        return [];
    }

    const usersData = await Promise.all(userList.map(id => getDbData(id)));
    return usersData.filter(Boolean);
};

module.exports = {
    getDbData,
    updateUserData,
    getUserListByIndex,
};
