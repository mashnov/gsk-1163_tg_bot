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

const createUser = async (userId) => {
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

    await createUser(userId);

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

const getUserStatus = async (userId) => {
    if (!userId) {
        return;
    }

    const userData = await getDbData(userId);
    return userData?.userStatus;
}

const getUserRole = async (userId) => {
    if (!userId) {
        return;
    }

    const userData = await getDbData(userId);
    return userData?.userRole;
}

const getUserIsAdmin = async (userId) => {
    if (!userId) {
        return;
    }

    const userData = await getDbData(userId);
    return userData?.userIsAdmin;
}

const getUserUpdateDate = async (userId) => {
    if (!userId) {
        return;
    }

    const userData = await getDbData(userId);
    return userData?.updatedAt;
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
    const currentIndexId = userStatus ? await getUserStatus(userId) : await getUserRole(userId);
    await createUserIndex(currentIndexId);
    await createUserIndex(indexId);
    await removeUserFromIndex(userId, currentIndexId);
    await addUserToIndex(userId, indexId);
};

module.exports = {
    updateUserData,
    getUserStatus,
    getUserUpdateDate,
    getUserRole,
    getUserIsAdmin,
};
