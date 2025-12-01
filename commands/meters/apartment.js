const { Markup } = require('telegraf');
const { sessions } = require('./state');
const { messageParams } = require('../../dictionary');

module.exports = async function apartmentValueStep(ctx) {
    const messageText = '🏡 Укажите номер вашей квартиры';
    const messageKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Выйти', 'start')]
    ]);

    const message = await ctx.reply(messageText, { ...messageKeyboard, ...messageParams });
    const userId = ctx.from.id;
    const session = {
        step: 'apartment',
        index: 0,
        apartment: null,
        readings: {},
        lastMessageId: message.message_id,
    };
    sessions.set(userId, session);
};
