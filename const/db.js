const emptyUser = {
    userId: undefined,
    userName: undefined,
    userRole: undefined,
    userStatus: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    roomNumber: undefined,
    phoneNumber: undefined,
    userIsAdmin: false,
}

const userStatusList = {
    unverified: 'unverified',
    pending: 'pending',
    verified: 'verified',
};

const userStatusText = {
    verified: 'Проверен',
    pending: 'Ожидает проверки',
    unverified: 'Не верефицоровн',
    undefined: 'Не верефицоровн',
};

const userRoleList = {
    chairman: 'chairman',
    accountant: 'accountant',
    admin: 'admin',
    resident: 'resident',
};

const userRoleText = {
    chairman: 'Председатель',
    accountant: 'Бухгалтер',
    admin: 'Администратор',
    resident: 'Житель',
    undefined: 'Не назначена',
};


module.exports = {
    emptyUser,
    userStatusList,
    userStatusText,
    userRoleList,
    userRoleText,
};