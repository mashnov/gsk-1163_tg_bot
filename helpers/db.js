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

const createUserData = async (userId) => {
    if (!userId) {
        return;
    }

    const originalData = await getDbData(userId);

    if (originalData) {
        return originalData;
    }

    const createdAt = new Date().toISOString();
    const userData = {
        ...emptyUser,
        userId: userId,
        userStatus: userStatusList.unverified,
        createdAt: createdAt,
        updatedAt: createdAt,
    };

    await updateUserIndex(userId, { userStatus: userStatusList.unverified });

    return setDbData(userId, userData);
}

const updateUserData = async (userId, patchData) => {
    if (!userId) {
        return;
    }

    await createUserData(userId);

    const originalData = await getDbData(userId);

    const userData = {
        ...originalData,
        ...patchData,
        updatedAt: new Date().toISOString(),
    };

    if (patchData.userStatus) {
        await updateUserIndex(userId, { userStatus: patchData.userStatus });
    }

    if (patchData.userRole) {
        await updateUserIndex(userId, { userRole: patchData.userRole });
    }

    return setDbData(userId, userData);
}

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

const addUserToIndex = async (userId, indexId) => {
    if (!indexId) {
        return;
    }
    const list = await getDbData(indexId) ?? [];
    const uniqueList = [...new Set([...list, String(userId)])];
    return setDbData(indexId, uniqueList);
};

const removeUserFromIndex = async (userId, indexId) => {
    if (!indexId) {
        return;
    }
    const list = (await getDbData(indexId)) ?? [];
    const filteredList = list.filter(id => id !== String(userId));
    return setDbData(indexId, filteredList);
};

const updateUserIndex = async (userId, { userStatus, userRole }) => {
    const indexId = userStatus || userRole;
    const userData = await getDbData(userId);
    const currentIndexId = userStatus ? userData?.userStatus : userData?.userRole;
    await createUserIndex(currentIndexId);
    await createUserIndex(indexId);
    await removeUserFromIndex(userId, currentIndexId);
    await addUserToIndex(userId, indexId);
};

const getUserListByIndex = async (indexId) => {
    if (!indexId) {
        return [];
    }

    const userList = await getDbData(indexId);

    for (const userId of userList) {
        const userData = await getDbData(userId);
        console.log(userData);
    }
}

module.exports = {
    getDbData,
    updateUserData,
    getUserListByIndex,
};
