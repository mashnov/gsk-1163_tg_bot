const emptyUser = {
    userId: undefined,
    userName: undefined,
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
    unverified: 'Не верефицоровн 🔴',
    pending: 'Ожидает проверки 🟡',
    verified: 'Проверен 🟢',
};

module.exports = {
    emptyUser,
    userStatusList,
    userStatusText,
};