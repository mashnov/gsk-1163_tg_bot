const { sendMessage, removeMessage, commandAnswer} = require('../helpers/telegraf');
const { setStatisticsData } = require('../helpers/db');
const { guard } = require('../helpers/guard');

const { hearsIsEnabled, botUsername } = require('../const/env');

const moduleParam = {
    keywords: [/домовенок/i, /бот/i],
};

const createNavigation = async (ctx, { noRemove, next, isHearsAction } = {}) => {
    await setStatisticsData(isHearsAction ? 'navigation-hears' : 'navigation-start');

    const isPrivateChat = ctx.chat?.type === 'private';

    if (isPrivateChat) {
        return next();
    }

    const messageText = `Я Домовёнок - <a href="https://t.me/${botUsername}">бот</a> нашего дома`;

    await sendMessage(ctx, { text: messageText, buttons: {} });

    if (!noRemove) {
        await removeMessage(ctx);
    }
}

const hearsHandler = async (ctx) => {
    const isGuardPassed = await guard(ctx, { publicChat: true });

    if (!isGuardPassed) {
        await commandAnswer(ctx);
        return;
    }

    if (hearsIsEnabled.navigation) {
        await createNavigation(ctx, { noRemove: true, isHearsAction: false });
    }
}

module.exports = (bot) => {
    bot.hears(moduleParam.keywords, (ctx) => hearsHandler(ctx));
    bot.start((ctx, next) => createNavigation(ctx, { next }));
};