const { Markup } = require('telegraf');
const { complains } = require('./state');
const { messageParams } = require('../../dictionary');

module.exports = async function startComplain(ctx) {
    const messageText = 'Перешлите мне сообщение, на которое хотите пожаловаться';
    const messageKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Выйти', 'start')]
    ])

    const message = await ctx.reply(messageText, { ...messageKeyboard, ...messageParams });
    const userId = ctx.from.id;

    complains.set(userId, message.message_id);
};
