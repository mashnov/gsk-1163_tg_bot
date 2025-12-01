const { Markup } = require('telegraf');
const { sessions } = require('./state');
const { metersList, messageParams } = require('../../dictionary');

module.exports = async function meterValueStep(ctx, session) {
    if (session.lastMessageId) {
        await ctx.deleteMessage(session.lastMessageId);
    }

    const currentMeter = metersList[session.index];
    const messageText = `${currentMeter.icon} Введите показания счетчика: ${currentMeter.label}`
    const messageKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Заново', 'meters')],
        [Markup.button.callback('Выйти', 'start')]
    ])

    const message = await ctx.reply(messageText, { ...messageKeyboard, ...messageParams });
    const userId = ctx.from.id;

    session.lastMessageId = message.message_id;
    sessions.set(userId, session);
};
