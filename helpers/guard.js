const { sendMessage } = require('./telegraf');
const { getUserData } = require('../helpers/db');

const { superUserId } = require('../const/env');
const { closeOption } = require('../const/dictionary');
const { userStatusList } = require('../const/db');

const guard = async (ctx, { privateChat, publicChat, verify, admin, blocked, unBlocked, superUser }) => {
    if (ctx.from.id !== Number(superUserId) && superUser) {
        const text = '🔒 Это действие доступно только root пользователю';
        await sendMessage(ctx, { text, silent: true, buttons: closeOption });
        return;
    }

    const isPrivateChat = ctx.chat?.type === 'private';

    if (!isPrivateChat && privateChat) {
        const text = '🔒 Это действие доступно только в личном общении с ботом';
        await sendMessage(ctx, { text, silent: true, buttons: closeOption });
        return;
    }

    const userData = await getUserData(ctx.from.id);
    const isUnverified = userData?.userStatus === userStatusList.undefined || !userData?.userStatus;
    const isBlocked = [userStatusList.blocked, userStatusList.restricted].includes(userData?.userStatus);
    const isAdmin = [userStatusList.admin, userStatusList.accountant, userStatusList.chairman].includes(userData?.userStatus);

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

    if (!isAdmin && admin) {
        const text = '🔒 Это действие доступно только пользователям с правами администратора';
        await sendMessage(ctx, { text, silent: true, buttons: closeOption });
        return;
    }

    return true;
};

module.exports = {
    guard,
};