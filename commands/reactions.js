const { setMessageReaction } = require('../helpers/telegraf');
const { getUserData } = require('../helpers/db');

const { homeChatId } = require('../const/env');
const { userStatusList } = require("../const/db");

const messageHandler = async (ctx, next) => {
    if (ctx.from?.is_bot) {
        return next();
    }

    if (ctx.chat?.id !== homeChatId) {
        return next();
    }

    if ((ctx.message?.text ?? ctx.message?.caption ?? "").startsWith('/')) {
        return next();
    }

    const userData = await getUserData({ from: ctx.from });
    const isUnverified = userData?.userStatus === userStatusList.unverified || !userData?.userStatus;

    if (isUnverified) {
        await setMessageReaction(ctx, {
            chatId: ctx.chat.id,
            messageId: ctx.message.message_id,
            emoji: '👀',
        });
    }

    return next();
};

module.exports = (bot) => {
    bot.on('text', (ctx, next) => messageHandler(ctx, next));
    bot.on('photo', (ctx, next) => messageHandler(ctx, next));
    bot.on('video', (ctx, next) => messageHandler(ctx, next));
    bot.on('document', (ctx, next) => messageHandler(ctx, next));
};
