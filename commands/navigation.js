const { getKeyboard } = require('../helpers/getters');
const { removeMessage } = require('../helpers/telegraf');

const { messageParams } = require('../const/dictionary');
const { botUsername } = require('../const/env');

const moduleParam = {
    keywords: ['домовенок', 'Домовенок', 'бот', 'Бот'],
    buttons: ['Правила', 'Контакты', 'Погода'],
};

const createNavigation = async (ctx, { next, remove }) => {
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

    if (remove) {
        await removeMessage(ctx);
    }
}

module.exports = (bot) => {
    bot.start((ctx, next) => createNavigation(ctx, { next }));
    bot.hears(moduleParam.keywords, (ctx) => createNavigation(ctx, { remove: true }));
};