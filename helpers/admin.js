const { stringify } = require('csv-stringify/sync');

const { getUserIndex, getUserData } = require('../helpers/db');

const { userRoleList, userRoleText } = require('../const/db');

const getCsvFile = (rowList, columns) => {
    return stringify(rowList, {
        header: true,
        bom: true,
        delimiter: ';',
        columns,
    });
};

const getVcfFile = (rowList) => {
    let content = '';

    for (const profile of rowList) {
        content +=
            'BEGIN:VCARD\r\n' +
            'VERSION:3.0\r\n' +
            `UID:${profile.room}-${profile.name}\r\n` +
            `FN:КВ ${profile.room} ${profile.name}\r\n` +
            `N:КВ ${profile.room};${profile.name};;;\r\n` +
            `TEL;TYPE=CELL:${profile.phone}\r\n` +
            'CATEGORIES:ЖСК1163\r\n' +
            'END:VCARD\r\n'
        ;
    }

    return content;
};

const getCsvFromBd = async () => {
    const userList = Object.keys(userRoleList);

    const rowList = await userList.reduce(async (accPromise, listKey) => {
        const acc = await accPromise;
        const role = userRoleText[listKey];
        const userIdList = await getUserIndex(listKey);

        for (const accountId of userIdList) {
            const userData = await getUserData({ id: accountId });

            if (userData.roomNumber) {
                acc.push({
                    room: userData.roomNumber,
                    name: userData.residentName,
                    phone: userData.phoneNumber,
                    role,
                });
            }
        }

        return acc;
    }, Promise.resolve([]));

    const sortedList = rowList.sort((a, b) => Number(a.room) - Number(b.room));

    const headers = {
        room: 'Квартира',
        name: 'ФИО',
        phone: 'Телефон',
        role: 'Статус',
    };

    return getCsvFile(sortedList, headers);
};

const getVcfFromBd = async () => {
    const userList = Object.keys(userRoleList);
    const rowList = await userList.reduce(async (accPromise, listKey) => {
        const acc = await accPromise;
        const userIdList = await getUserIndex(listKey);

        for (const accountId of userIdList) {
            const userData = await getUserData({ id: accountId });

            if (userData.roomNumber) {
                acc.push({
                    room: userData.roomNumber,
                    name: userData.residentName,
                    phone: userData.phoneNumber,
                });
            }
        }

        return acc;
    }, Promise.resolve([]));

    const sortedList = rowList.sort((a, b) => Number(a.room) - Number(b.room));

    return getVcfFile(sortedList);
};

module.exports = {
    getCsvFromBd,
    getVcfFromBd,
};