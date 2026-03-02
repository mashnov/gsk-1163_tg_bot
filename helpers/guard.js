const { sendMessage } = require('./telegraf');
const { getUserData } = require('../helpers/db');

const { superUserId } = require('../const/env');
const { closeOption } = require('../const/dictionary');
const { userRoleList } = require('../const/db');

const guard = async (ctx, { privateChat, publicChat, verify, admin, blocked, unBlocked }) => {
    const isPrivateChat = ctx.chat?.type === 'private';

    if (!isPrivateChat && privateChat) {
        const text = '🔒 Это действие доступно только в личном общении с ботом';
        await sendMessage(ctx, { text, silent: true, buttons: closeOption });
        return;
    }

    const userData = await getUserData({ from: ctx.from });
    const isUnverified = userData?.userStatus === userRoleList.unverified || !userData?.userStatus;
    const isBlocked = [userRoleList.blocked, userRoleList.restricted].includes(userData?.userStatus);
    const isAdmin = [userRoleList.admin, userRoleList.accountant, userRoleList.chairman].includes(userData?.userStatus);
    const isSuperUser = superUserId === ctx?.from?.id;

    if (isPrivateChat && publicChat) {
        const text = '🔒 Это действие доступно только в чате';
        await sendMessage(ctx, { text, silent: true, buttons: closeOption });
        return;
    }

    if (isUnverified && verify) {
        const text = '🔒 Это действие доступно только верифицированным пользователям';
        await sendMessage(ctx, { text, silent: true, buttons: closeOption });
        return;
    }

    if (isBlocked && unBlocked) {
        const text = '🔒 Это действие недоступно заблокированным пользователям';
        await sendMessage(ctx, { text, silent: true, buttons: closeOption });
        return;
    }

    if (!isBlocked && blocked) {
        const text = '🔒 Это действие доступно только заблокированным пользователям';
        await sendMessage(ctx, { text, silent: true, buttons: closeOption });
        return;
    }

    if (!(isAdmin || isSuperUser) && (admin)) {
        const text = '🔒 Это действие доступно только пользователям с правами администратора';
        await sendMessage(ctx, { text, silent: true, buttons: closeOption });
        return;
    }

    return true;
};

module.exports = {
    guard,
};