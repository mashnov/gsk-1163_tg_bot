const { Markup } = require('telegraf');
const { messageParams } = require('../../dictionary');

const messageText =
    'Привет!\n' +
    'Меня зовут <b>Домовёнок</b>, я бот нашего дома.\n\n' +
    'Я помогу тебе:\n' +
    '• найти нужный контакт,\n' +
    '• передать показания счётчиков,\n' +
    '• пожаловаться на чьё-то сообщение - я разберусь и сообщу тебе результат.\n\n' +
    'А если ты что-то производишь или предлагаешь услуги и живёшь в нашем доме - можем обсудить небольшую рекламу для жителей.';

const messageKeyboard = Markup.inlineKeyboard([
    [ Markup.button.callback('Полезные телефоны и ссылки', 'contacts') ],
    [ Markup.button.callback('Передать показания счетчиков', 'meters') ],
    [ Markup.button.callback('Пожаловаться на сообщение', 'complain') ]
])

module.exports = (bot) => {
    bot.start((ctx) => {
        ctx.reply(messageText, { ...messageKeyboard, ...messageParams });
    });
    bot.command('start', async (ctx) => {
        ctx.reply(messageText, { ...messageKeyboard, ...messageParams });
    });
    bot.action('start', async (ctx) => {
        await ctx.answerCbQuery();
        ctx.reply(messageText, { ...messageKeyboard, ...messageParams });
    });
};
