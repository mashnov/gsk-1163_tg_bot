const emptyUser = {
    userId: undefined,
    userName: undefined,
    userNickname: undefined,
    userStatus: undefined,
    createdAt: undefined,
    updatedAt: undefined,
}

const userStatus = {
    unverified: 'unverified',
    pending: 'pending',
    verified: 'verified',
};

module.exports = {
    emptyUser,
    userStatus,
};