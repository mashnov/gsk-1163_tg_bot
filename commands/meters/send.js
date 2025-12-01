const { Markup } = require('telegraf');
const { sessions } = require('./state');
const { metersList, messageParams, accountantId} = require('../../dictionary');
const { getUserName } = require('../../helpers');

module.exports = async function sendStep(ctx) {
    const userId = ctx.from.id;
    const session = sessions.get(userId);

    const headerText =
        `〽️ Новые показания\n\n` +
        `Квартира: ${session.apartment}\n` +
        `Отправитель: ${getUserName(ctx.from)}\n\n`;

    const bodyText = metersList.map(metter => `${ metter.icon } ${ metter.label }: ${ session.readings[metter.key] }`).join('\n');

    const messageText = headerText + bodyText;

    const messageKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Закрыть', 'start')]
    ])

    const messageOptions = { ...messageKeyboard, ...messageParams };

    await ctx.telegram.sendMessage(accountantId, messageText, messageOptions);
    await ctx.reply('✅ Успешно отправлено', messageOptions);

    sessions.delete(userId);
};
