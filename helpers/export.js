const { stringify } = require('csv-stringify/sync');

const { getUserIndex, getUserData } = require('../helpers/db');

const { userStatusList, userStatusText } = require('../const/db');

const getCsvFile = (rowList) => {
    return stringify(rowList, {
        header: true,
        bom: true,
        delimiter: ";",
    });
};

const getCsvFromBd = async () => {
    const userList = Object.keys(userStatusList);

    const rowList = await userList.reduce(async (accPromise, listKey) => {
        const acc = await accPromise;
        const role = userStatusText[listKey];
        const userIdList = await getUserIndex(listKey);

        for (const accountId of userIdList) {
            const userData = await getUserData(accountId)
            acc.push({
                room: userData.roomNumber,
                name: userData.residentName,
                phone: userData.phoneNumber,
                role,
            });
        }

        return acc;
    }, Promise.resolve([]));

    const sortedList = rowList.sort((a, b) => Number(a.room) - Number(b.room));

    return getCsvFile(sortedList);
};

module.exports = {
    getCsvFromBd,
};