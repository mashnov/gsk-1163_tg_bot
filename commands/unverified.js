const cron = require('node-cron');

const { setMessageReaction, sendMessage, commandAnswer } = require('../helpers/telegraf');
const { getUserData, getUserIndex} = require('../helpers/db');

const { homeChatId, homeTimeZone} = require('../const/env');
const { userStatusList} = require('../const/db');
const { closeOption, moduleNames } = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.unverified,
    notification: 'notification',
    sendTime: [12, 20],
};

const messageHandler = async (ctx, next) => {
    if (ctx.from?.is_bot) {
        return next();
    }

    if (ctx.chat?.id !== homeChatId) {
        return next();
    }

    if ((ctx.message?.text ?? ctx.message?.caption ?? '').startsWith('/')) {
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

const sendNotifications = async (ctx, { accountId, isCronAction } = {}) => {
    const text =
        '🔒 Напоминание о верификации' +
        '\n\nПожалуйста, пройдите верификацию, чтобы получить доступ к передаче показний счетчиков и другим возможностям бота.';

    const buttons = {
        [moduleNames.verification]: '🪪 Верификация',
        ...closeOption,
    };

    await sendMessage(ctx, { text, accountId, buttons });

    if (isCronAction) {
        await commandAnswer(ctx, 'Запрос отправлен');
    }
};

const unverifiedListHandler = async (ctx) => {
    const accountIdList = await getUserIndex(userStatusList.unverified);

    for (const accountId of accountIdList) {
        await sendNotifications(ctx, { accountId, isCronAction: true });
    }
};

const callbackHandler = async (ctx) => {
    const data = ctx.callbackQuery.data;
    const [action, actionName, accountId] = data.split(':');

    if (action === moduleParam.name && actionName === moduleParam.notification) {
        await sendNotifications(ctx, { accountId });
    }
};

const cronAction = (bot) => {
    cron.schedule(
        `0 ${moduleParam.sendTime} * * *`,
        async () => unverifiedListHandler(bot),
        { timezone: homeTimeZone },
    );
};

module.exports = (bot) => {
    cronAction(bot);
    bot.on('text', (ctx, next) => messageHandler(ctx, next));
    bot.on('photo', (ctx, next) => messageHandler(ctx, next));
    bot.on('video', (ctx, next) => messageHandler(ctx, next));
    bot.on('document', (ctx, next) => messageHandler(ctx, next));
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};
