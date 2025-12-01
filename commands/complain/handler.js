const { Markup } = require('telegraf');
const { complains } = require('./state');
const { messageParams, adminId} = require('../../dictionary');
const { getUserName } = require('../../helpers');

module.exports = async function handleComplainMessage(ctx, next) {
    const userId = ctx.from.id;
    const message_id = complains.get(userId);

    if (!message_id) {
        return next();
    }

    await ctx.deleteMessage(message_id);

    const msg = ctx.message;

    if (!msg.forward_from) {
        const messageText = '❗ Пожалуйста, перешлите сообщение!';
        const messageKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Выйти', 'start')]
        ]);

        await ctx.reply(messageText, { ...messageKeyboard, ...messageParams });
        return;
    }

    const senderMessage = '✅ Жалоба на сообщение отправлена!';
    const recipientMessage =
        `⚠️ Новая жалоба\n\n` +
        `От: ${getUserName(ctx.from)}\n` +
        `На: ${getUserName(ctx.message.forward_from)}\n\n` +
        `Текст: ${ctx.message.text}\n\n`;

    const senderKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Закрыть', 'start')]
    ]);

    await ctx.reply(senderMessage, { ...senderKeyboard, ...messageParams });
    await ctx.telegram.sendMessage(adminId, recipientMessage, messageParams);

    complains.delete(userId);
};
