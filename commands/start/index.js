const { sendMessage} = require('../../helpers');

const messageText =
    'Привет!\n' +
    'Это <b>Домовёнок</b> - бот нашего дома.\n\n' +
    'Я помогу тебе:\n' +
    '• Авторизоваться\n' +
    '• Найти нужный контакт\n' +
    '• Передать показания счётчиков\n' +
    '• Связаться с правлением или администратором\n';

const messageKeyboard = {
    profile_start: 'Авторизация',
    contact_start: 'Полезные телефоны',
    meter_start: 'Показания счетчиков',
    message_start: 'Написать сообщение',
};

const initAction = async (ctx, bot, needAnswer) => {
    if (needAnswer) {
        await ctx.answerCbQuery();
    }
    await sendMessage(ctx, {
        text: messageText,
        buttons: messageKeyboard
    });
};

module.exports = (bot) => {
    bot.start((ctx) => initAction(ctx, bot));
    bot.command('start', async (ctx) => initAction(ctx, bot));
    bot.action('start', async (ctx) => initAction(ctx, bot, true));
};
