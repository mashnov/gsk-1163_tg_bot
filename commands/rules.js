const { sendLocalFileMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { setStatisticsData } = require('../helpers/db');
const { guard } = require('../helpers/guard');

const { homeOption, closeOption, moduleNames } = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.rules,
    keywords: [/правила/i, /ghfdbkf/i, /rule/i, /кгду/i],
};

const initAction = async (ctx, { isHearsAction } = {}) => {
    await commandAnswer(ctx);
    await setStatisticsData(isHearsAction ? 'rules-hears' : 'rules-start');
    const isGuardPassed = await guard(ctx, { publicChat: isHearsAction });

    if (!isGuardPassed) {
        return;
    }

    const messageText =
        '📚 <b>Правила</b>\n\n' +
        'Данные правила установлены с целью поддержания комфортной, безопасной и уважительной атмосферы общения для всех участников.\n\n' +
        '<b>Запрещается:</b>\n' +
        '<blockquote>• Распространение персональных данных;\n' +
        '• Размещение рекламы, пригласительных ссылок, акций, а также любого вида спама;\n' +
        '• Призывы, обсуждение или пропаганда незаконной деятельности;\n' +
        '• Оскорбления, агрессия, травля, проявление неуважения по отношению к участникам;\n' +
        '• Умышленная дезинформация, распространение ложных сведений, провокации конфликтов.</blockquote>\n\n' +
        '<b>Режим тишины:</b>\n' +
        '<blockquote>• Просим участников соблюдать правила тишины и уважать личное время других;\n' +
        '• Активное общение в чате рекомендуется с 09:00 до 22:00;\n' +
        '• В период с 22:00 до 09:00 просьба воздерживаться от сообщений, не требующих срочного внимания.</blockquote>\n\n' +
        '<b>Меры:</b>\n' +
        '<blockquote>• За нарушение правил администрация вправе вынести предупреждение;\n' +
        '• В зависимости от характера нарушения может быть применена временная блокировка (до 24 часов)</blockquote>\n\n';

    const isPrivateChat = ctx.chat?.type === 'private';

    await sendLocalFileMessage(ctx, {
        text: messageText,
        fileType: 'photo',
        filePath: `./assets/rules/preview.jpg`,
        buttons: {
            ...(isPrivateChat ? homeOption : {}),
            ...(!isPrivateChat ? closeOption : {}),
        },
    });

    if (isPrivateChat) {
        await removeMessage(ctx);
    }
};

module.exports = (bot) => {
    bot.hears(moduleParam.keywords, (ctx) => initAction(ctx, { isHearsAction: true }));
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
};
