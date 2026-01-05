const cron = require('node-cron');

const { sendMessage, removeMessage, commandAnswer} = require('../helpers/telegraf');
const { getHolidays } = require('../helpers/holidays');
const { getFormattedDate } = require('../helpers/getters');
const { guard } = require('../helpers/guard');

const { moduleNames, homeOption, closeOption} = require('../const/dictionary');
const { homeChatId, homeTimeZone } = require('../const/env');

const moduleParam = {
    name: moduleNames.holiday,
    today: 'today',
    month: 'month',
    year: 'year',
    sendTime: [20],
}

const initAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const messageText =
        '🎉 Праздники' +
        '\n\nВыберите интересующий Вас пункт меню';

    const buttons = {
        [`${moduleParam.name}:${moduleParam.today}`]: 'Сегодня',
        [`${moduleParam.name}:${moduleParam.month}`]: 'В этом месяце',
        [`${moduleParam.name}:${moduleParam.year}`]: 'В этом году',
    };

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            ...buttons,
            ...homeOption,
        },
    });
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, actionType] = data.split(':');

    if (action === moduleParam.name) {
        await getHolidayMessage(ctx, { actionType });
    }

    return next();
};

const getHolidayMessage = async (ctx, { actionType, isCronAction }) => {
    const isGuardPassed = isCronAction || await guard(ctx, { unBlocked: true, privateChat: true  });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const holidayList = getHolidays(actionType);

    if (!holidayList.length && isCronAction) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const isPrivateChat = ctx.chat?.type === 'private';

    const holidayTitle = {
        [moduleParam.today]: '🎉 Сегодня:',
        [moduleParam.month]: '🎉 Праздники в этом месяце:',
        [moduleParam.year]: '🎉 Праздники в этом году:',
    };

    const emptyMessage = {
        [moduleParam.today]: '🎉 Праздников сегодня нет',
        [moduleParam.month]: '🎉 Праздников в этом месяце нет',
        [moduleParam.year]: '🎉 Праздников в этом году нет',
    };

    let messageText = holidayTitle[actionType];

    for (const holiday of holidayList) {
        messageText += `\n\n${getFormattedDate(holiday.date, true)}`;
        messageText += `\n${holiday.name}`;
    }

    await sendMessage(ctx, {
        text: holidayList.length ? messageText : emptyMessage[actionType],
        accountId: isPrivateChat ? undefined : homeChatId,
        buttons: {
            ...(isPrivateChat ? { [moduleParam.name]: '⬅️ Назад' } : {}),
            ...(isPrivateChat ? homeOption : {}),
            ...(!isPrivateChat && !isCronAction ? closeOption : {}),
        }
    });

    if (!isCronAction) {
        await removeMessage(ctx);
    }
    await commandAnswer(ctx);
};

const cronAction = (bot) => {
    cron.schedule(
        `20 ${moduleParam.sendTime} * * *`,
        async () => getHolidayMessage(bot, { actionType: moduleParam.today, isCronAction: true }),
        { timezone: homeTimeZone },
    );
};

module.exports = (bot) => {
    cronAction(bot);
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};