const { getKeyboard } = require('../helpers/getters');
const { removeMessage, commandAnswer} = require('../helpers/telegraf');
const {guard} = require('../helpers/guard');

const { messageParams } = require('../const/dictionary');
const { botUsername } = require('../const/env');

const moduleParam = {
    keywords: ['домовенок', 'меню', 'бот'],
    buttons: [],
};

const createNavigation = async (ctx, { needRemove, next } = {}) => {
    const isPrivateChat = ctx.chat?.type === 'private';

    if (isPrivateChat) {
        return next();
    }

    const messageText =
        '<b>Привет!</b>\n' +
        'Я <b>Домовёнок</b> - бот нашего дома.\n\n' +
        'Я помогу тебе:\n' +
        '• найти нужный контакт\n' +
        '• ознакомиться с правилами чата\n\n' +
        `<b>Еще больше возможностей в личной <a href="https://t.me/${botUsername}">переписке со мной</a></b>`;

    ctx.reply(messageText, { ...messageParams, ...getKeyboard(moduleParam.buttons) });

    if (needRemove) {
        await removeMessage(ctx);
    }
}

const hearsHandler = async (ctx) => {
    const isGuardPassed = await guard(ctx, { publicChat: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    await createNavigation(ctx, { needRemove: true });
}

module.exports = (bot) => {
    bot.hears(moduleParam.keywords, (ctx) => hearsHandler(ctx));
    bot.start((ctx, next) => createNavigation(ctx, { next }));
};