const { sendMessage, removeMessage } = require('../helpers/message');
const { backOption } = require('../const/dictionary');

const moduleActionName = 'rules';

const messageText =
    '<b>Уважаемые участники чата!</b>\n\n'+
    'В целях поддержания порядка и сохранения атмосферы взаимного уважения администрацией группы установлены правила общения и предусмотрены меры ответственности за их нарушение. В отдельных случаях к участникам могут применяться меры блокировки.\n\n' +
    '<b>Блокировка может быть применена, в том числе, в следующих ситуациях:</b>\n' +
    '❗распространение персональных данных других участников;\n' +
    '❗размещение рекламных, пригласительных материалов, акций и иного спама;\n' +
    '❗️призывы к противоправным действиям;\n' +
    '❗️проявление неуважения, оскорблений или агрессии в адрес членов сообщества;\n' +
    '❗️умышленные попытки дезинформации или провокации паники.\n\n' +
    'Срок блокировки определяется администрацией в зависимости от характера и тяжести нарушения и может составлять от 24 часов до бессрочного исключения из чата.\n\n' +
    '<b>Просим всех участников соблюдать корректность и уважительное отношение друг к другу.</b>';

const initAction = async (ctx, bot, needAnswer) => {
    if (needAnswer) {
        await ctx.answerCbQuery();
    }

    const buttons = { ...backOption };

    await sendMessage(ctx, {
        text: messageText,
        buttons
    });

    await removeMessage(ctx);
};

module.exports = (bot) => {
    bot.command(`${moduleActionName}_start`, async (ctx) => initAction(ctx, bot));
    bot.action(`${moduleActionName}_start`, async (ctx) => initAction(ctx, bot, true));
};
