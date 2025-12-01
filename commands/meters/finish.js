const { Markup } = require('telegraf');
const { metersList, messageParams } = require('../../dictionary');

module.exports = async function finishStep(ctx, session) {
    if (session.lastMessageId) {
        try {
            await ctx.deleteMessage(session.lastMessageId);
        } catch (e) {
            console.log('Не удалось удалить старый вопрос:', e.message);
        }
    }

    const readings = session.readings;
    const apartmentText = `🏡 Номер квартиры: ${session.apartment}\n\n`;
    const metersText = metersList.map(metter => `${ metter.icon } ${ metter.label }: ${ readings[metter.key] }`).join('\n');

    const messageText = apartmentText + metersText;

    const messageKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Отправить', 'metersSend')],
        [Markup.button.callback('Заново', 'meters')],
        [Markup.button.callback('Выйти', 'start')]
    ]);

    await ctx.reply(messageText, { ...messageKeyboard, ...messageParams });
};
