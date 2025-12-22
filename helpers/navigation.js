const { getKeyboard } = require('./getters');

const createNavigation = async (ctx, next) => {
    const isPrivateChat = ctx.chat?.type === 'private';

    if (isPrivateChat) {
        return next();
    }

    ctx.reply('Домовенок активирован', getKeyboard(['Правила', 'Контакты']));
}

module.exports = (bot) => {
    bot.start((ctx, next) => createNavigation(ctx, next));
};