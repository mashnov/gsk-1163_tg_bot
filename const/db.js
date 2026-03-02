const emptyUser = {
    accountId: undefined,
    residentName: undefined,
    userName: undefined,
    roomNumber: undefined,
    phoneNumber: undefined,
    userStatus: undefined,
};

const userRoleList = {
    chairman: 'chairman',
    accountant: 'accountant',
    admin: 'admin',
    resident: 'resident',
    pending: 'pending',
    restricted: 'restricted',
    blocked: 'blocked',
    unverified: 'unverified',
};

const userRoleText = {
    chairman: 'Председатель',
    accountant: 'Бухгалтер',
    admin: 'Администратор',
    resident: 'Житель',
    pending: 'Ожидает проверки',
    restricted: 'Ограничен',
    blocked: 'Заблокирован',
    unverified: 'Не верифицирован',
};

module.exports = {
    emptyUser,
    userRoleList,
    userRoleText,
};