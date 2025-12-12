const emptyUser = {
    userId: undefined,
    userName: undefined,
    userRole: undefined,
    userStatus: undefined,
    createdAt: undefined,
    updatedAt: undefined,
}

const userStatusList = {
    unverified: 'unverified',
    pending: 'pending',
    verified: 'verified',
};

const userStatusText = {
    unverified: 'Не верефицоровн',
    pending: 'Ожидает проверки',
    verified: 'Проверен',
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
};


module.exports = {
    emptyUser,
    userStatusList,
    userStatusText,
    userRoleList,
    userRoleText,
};