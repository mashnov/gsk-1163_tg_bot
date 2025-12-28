const { setMessageReaction } = require('../helpers/telegraf');
const { getUserData } = require('../helpers/db');

const { homeChatId } = require('../const/env');
const { userStatusList } = require("../const/db");

const messageHandler = async (ctx, next) => {
    console.log({
        homeChatId,
        chatId: ctx.chat?.id,
        isBot: ctx.from?.is_bot,
        isCommand: ctx.message.text.startsWith('/'),
    })

    if (ctx.from?.is_bot) {
        return next();
    }

    if (ctx.chat?.id !== homeChatId) {
        return next();
    }

    if (ctx.message.text.startsWith('/')) {
        return next();
    }

    const userData = await getUserData(ctx.from.id);
    const isUnverified = userData?.userStatus === userStatusList.undefined || !userData?.userStatus;

    if (!isUnverified) {
        return next();
    }

    await setMessageReaction(ctx, {
        chatId: ctx.chat.id,
        messageId: ctx.message.message_id,
        emoji: '⚠️',
    });

    return next();
};

module.exports = (bot) => {
    bot.on('text', (ctx, next) => messageHandler(ctx, next));
    bot.on('photo', (ctx, next) => messageHandler(ctx, next));
    bot.on('video', (ctx, next) => messageHandler(ctx, next));
    bot.on('document', (ctx, next) => messageHandler(ctx, next));
};
