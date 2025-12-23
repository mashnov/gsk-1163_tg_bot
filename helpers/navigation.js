const { getKeyboard } = require('../helpers/getters');

const { messageParams } = require('../const/dictionary');
const { botUsername } = require('../const/env');

const createNavigation = async (ctx, next) => {
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

    ctx.reply(messageText, { ...messageParams, ...getKeyboard(['Правила', 'Контакты']) });
}

module.exports = (bot) => {
    bot.start((ctx, next) => createNavigation(ctx, next));
};