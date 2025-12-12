const { sendMessage, removeMessage } = require('../helpers/message');
const { createUser } = require('../helpers/db');

const messageText =
    'Привет!\n' +
    'Это <b>Домовёнок</b> - бот нашего дома.\n\n' +
    'Я помогу тебе:\n' +
    '• Авторизоваться\n' +
    '• Найти нужный контакт\n' +
    '• Передать показания счётчиков\n' +
    '• Связаться с правлением или администратором\n';

const initAction = async (ctx, bot, needAnswer) => {
    if (needAnswer) {
        await ctx.answerCbQuery();
    }
    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            profile_start: 'Профиль',
            contact_start: 'Контакты',
            meter_start: 'Показания счетчиков',
            messages_start: 'Написать сообщение',
        },
    });

    await removeMessage(ctx);
    await createUser(ctx.from.id);
};

const closeAction = async (ctx, bot, needAnswer) => {
    if (needAnswer) {
        await ctx.answerCbQuery();
    }
    await removeMessage(ctx);
};

module.exports = (bot) => {
    bot.start((ctx) => initAction(ctx, bot));
    bot.command('start', async (ctx) => initAction(ctx, bot));
    bot.action('start', async (ctx) => initAction(ctx, bot, true));
    bot.command('close', async (ctx) => closeAction(ctx, bot));
    bot.action('close', async (ctx) => closeAction(ctx, bot, true));
};
