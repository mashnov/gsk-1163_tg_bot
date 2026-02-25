const { db } = require('../state/db');
const { emptyUser, userStatusList } = require('../const/db.js');

const { getUserName } = require('../helpers/getters');

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
const createUserData = async (accountId, userName) => {
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
        userStatus: userStatusList.unverified,
        accountId: accountId,
        createdAt: createdAt,
        userName,
    };

    await setDbData(accountId, userData);
    await setUserIndex(accountId, { userStatus: userStatusList.unverified });
    return await getUserData({ id: accountId });
};

const getUserData = async ({ id, from }) => {
    const accountId = from?.id ?? id;
    const userName = getUserName(from || { id });
    return await createUserData(accountId, userName);
};

const setUserData = async (accountId, patchData) => {
    if (!accountId) {
        return;
    }

    const originalData = { ...await getUserData({ id: accountId }) };

    const userData = {
        ...originalData,
        ...patchData,
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

// STATISTICS
const createStatisticsData = async () => {
    const statisticsData = await getDbData('statistics');

    if (statisticsData) {
        return statisticsData;
    }

    await setDbData('statistics', {});
    return await getStatisticsData();
};


const getStatisticsData = async (isToday) => {
    const statisticsData = await createStatisticsData();
    const [statisticsKey] = new Date().toISOString().split('T');
    const todayDate = statisticsData[statisticsKey] || {};

    return isToday ? todayDate : statisticsData;
};

const setStatisticsData = async (name = '') => {
    const [statisticsKey] = new Date().toISOString().split('T');
    const statisticsList = await getStatisticsData();

    if (!statisticsList[statisticsKey]) {
        statisticsList[statisticsKey] = {};
    }

    statisticsList[statisticsKey][name] = Number(statisticsList[statisticsKey][name] || '0') + 1;

    return setDbData('statistics', statisticsList);
};

module.exports = {
    getUserData,
    setUserData,
    getUserIndex,
    getUserListByIndex,
    getVerificationIndexItem,
    setVerificationIndexItem,
    setStatisticsData,
    getStatisticsData,
};
