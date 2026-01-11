const cron = require('node-cron');

const { sendMessage, removeMessage, commandAnswer} = require('../helpers/telegraf');
const { getFormattedDate } = require('../helpers/getters');
const { getHolidays } = require('../helpers/holidays');
const { setStatistics } = require('../helpers/db');
const { guard } = require('../helpers/guard');

const { cronIsEnabled, hearsIsEnabled, homeChatId, homeTimeZone } = require('../const/env');
const { moduleNames, homeOption, closeOption} = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.holiday,
    keywords: [/праздник/i,],
    sendTime: [10],
    today: 'today',
    month: 'month',
    year: 'year',
}

const initAction = async (ctx) => {
    setStatistics('holiday-start');

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

const getHolidayMessage = async (ctx, { actionType, isCronAction, noRemove, isHearsAction } = {}) => {
    if (!isCronAction && actionType) {
        setStatistics(isHearsAction ? 'holiday-hears' : `holiday-get:${actionType}`);
    }

    const isGuardPassed = isCronAction || await guard(ctx, { unBlocked: true });

    if (!isGuardPassed) {
        if (!noRemove) {
            await removeMessage(ctx);
        }
        await commandAnswer(ctx);
        return;
    }

    const holidayList = getHolidays(actionType);

    if (!holidayList.length && isCronAction) {
        if (!noRemove) {
            await removeMessage(ctx);
        }
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

    if (!isPrivateChat && isCronAction) {
        messageText += '\n\n<blockquote>Информация публикуется автоматически в 10:00 в праздничные дни</blockquote>';
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

    if (!isCronAction && !noRemove) {
        await removeMessage(ctx);
    }
    await commandAnswer(ctx);
};

const cronAction = (bot) => {
    if (cronIsEnabled.holiday) {
        cron.schedule(
            `0 ${moduleParam.sendTime} * * *`,
            async () => getHolidayMessage(bot, { actionType: moduleParam.today, isCronAction: true }),
            { timezone: homeTimeZone },
        );
    }
};

const hearsHandler = async (ctx) => {
    const isGuardPassed = await guard(ctx, { publicChat: true });

    if (!isGuardPassed) {
        await commandAnswer(ctx);
        return;
    }

    if (hearsIsEnabled.holiday) {
        await getHolidayMessage(ctx, { actionType: moduleParam.month, noRemove: true, isHearsAction: true });
    }
};

module.exports = (bot) => {
    cronAction(bot);
    bot.hears(moduleParam.keywords, (ctx) => hearsHandler(ctx));
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};