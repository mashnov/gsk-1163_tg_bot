const { sendMessage } = require('../helpers/message');
const { getDbData } = require('../helpers/db');
const { userStatusList } = require('../const/db');

const guard = async (ctx, { privateChat, verify, admin }) => {
    const userData = await getDbData(ctx.from.id);
    const userStatus = userData?.userStatus;
    const isVerified = userStatus === userStatusList.verified;
    const isAdmin = userData?.userIsAdmin;
    const isPrivateChat = ctx.chat?.type === 'private';

    if (!isPrivateChat && privateChat) {
        const text = '🔒 Это действие доступно только в личном общении с ботом';
        await sendMessage(ctx, { text, silent: true, buttons: {} });
        return;
    }

    if (!isVerified && verify) {
        const text = '🔒 Это действие доступно только верифицированным пользователям';
        await sendMessage(ctx, { text, silent: true, buttons: {} });
        return;
    }

    if (!isAdmin && admin) {
        const text = '🔒 Это действие доступно только пользователям с правами администратора';
        await sendMessage(ctx, { text, silent: true, buttons: {} });
        return;
    }

    return true;
};

module.exports = {
    guard,
};