const { Markup } = require('telegraf');
const { messageParams } = require('../../dictionary');

module.exports = (bot) => {
    bot.command('profile', (ctx) => {
        const messageText = `Твой ID: ${ctx.from.id}`;

        const messageKeyboard = Markup.inlineKeyboard([
            [ Markup.button.callback('Закрыть', 'start') ],
        ])

        ctx.reply(messageText, { ...messageKeyboard, ...messageParams });
    });
};
