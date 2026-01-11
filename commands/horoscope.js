const cron = require('node-cron');

const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { fetchHoroscopeData } = require('../helpers/horoscope');
const { setStatistics } = require('../helpers/db');
const { guard } = require('../helpers/guard');

const { cronIsEnabled, hearsIsEnabled, homeChatId, homeTimeZone } = require('../const/env');
const { homeOption, moduleNames, closeOption} = require('../const/dictionary');
const { horoscopeTitleMapper } = require('../const/horoscope');

const moduleParam = {
    name: moduleNames.horoscope,
    keywords: [/гороскоп/i],
    sendTime: [6],
    item: 'item',
}

const initAction = async (ctx) => {
    setStatistics('horoscope-start');

    const isGuardPassed = await guard(ctx, { privateChat: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const messageText =
        '💫 Гороскоп' +
        '\n\nВыберите интересующий Вас пункт меню';

    const buttons = {
        [`${moduleParam.name}:${moduleParam.item}:aries`]: horoscopeTitleMapper['aries'],
        [`${moduleParam.name}:${moduleParam.item}:taurus`]: horoscopeTitleMapper['taurus'],
        [`${moduleParam.name}:${moduleParam.item}:gemini`]: horoscopeTitleMapper['gemini'],
        [`${moduleParam.name}:${moduleParam.item}:cancer`]: horoscopeTitleMapper['cancer'],
        [`${moduleParam.name}:${moduleParam.item}:leo`]: horoscopeTitleMapper['leo'],
        [`${moduleParam.name}:${moduleParam.item}:virgo`]: horoscopeTitleMapper['virgo'],
        [`${moduleParam.name}:${moduleParam.item}:libra`]: horoscopeTitleMapper['libra'],
        [`${moduleParam.name}:${moduleParam.item}:scorpio`]: horoscopeTitleMapper['scorpio'],
        [`${moduleParam.name}:${moduleParam.item}:sagittarius`]: horoscopeTitleMapper['sagittarius'],
        [`${moduleParam.name}:${moduleParam.item}:capricorn`]: horoscopeTitleMapper['capricorn'],
        [`${moduleParam.name}:${moduleParam.item}:aquarius`]: horoscopeTitleMapper['aquarius'],
        [`${moduleParam.name}:${moduleParam.item}:pisces`]: horoscopeTitleMapper['pisces'],
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

const getHoroscopeMessage = async (ctx, { isCronAction, horoscopeType, noRemove, isHearsAction } = {}) => {
    if (!isCronAction) {
        setStatistics(isHearsAction ? 'horoscope-hears' : `horoscope-get:${horoscopeType}`);
    }

    const isGuardPassed = isCronAction || await guard(ctx, { unBlocked: true });

    if (!isGuardPassed) {
        if (!noRemove) {
            await removeMessage(ctx);
        }
        await commandAnswer(ctx);
        return;
    }

    const response = await fetchHoroscopeData();
    const isPrivateChat = ctx.chat?.type === 'private';

    const horoList = Object.keys(horoscopeTitleMapper);
    const horoFilteredList = horoList.filter(horoItem => horoItem === horoscopeType || !horoscopeType);

    let messageText = '';

    for (const horoItem of horoFilteredList) {
        const horoTitle = horoscopeTitleMapper[horoItem];
        const horoText = response?.horo?.[horoItem]?.today;
        messageText += `\n\n${horoTitle}`;
        messageText += `\n\n${horoText}`;
    }

    if (!isPrivateChat && isCronAction) {
        messageText += '\n\n<blockquote>Информация публикуется автоматически в 06:00 ежедневно</blockquote>';
    }

    await sendMessage(ctx, {
        text: messageText,
        accountId: isPrivateChat ? undefined : homeChatId,
        buttons: {
            ...(isPrivateChat ? { [moduleParam.name]: '⬅️ Назад' } : {}),
            ...(isPrivateChat ? homeOption : {}),
            ...(!isPrivateChat && !isCronAction ? closeOption : {}),
        },
    });

    if (!isCronAction && !noRemove) {
        await removeMessage(ctx);
    }
    await commandAnswer(ctx);
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, actionName, horoscopeType] = data.split(':');

    if (action === moduleParam.name && actionName === moduleParam.item) {
        await getHoroscopeMessage(ctx, { horoscopeType });
    }

    return next();
};

const cronAction = (bot) => {
    if (cronIsEnabled.horoscope) {
        cron.schedule(
            `0 ${moduleParam.sendTime} * * *`,
            async () => getHoroscopeMessage(bot, { isCronAction: true }),
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

    if (hearsIsEnabled.horoscope) {
        await getHoroscopeMessage(ctx, { noRemove: true, isHearsAction: true });
    }
};

module.exports = (bot) => {
    cronAction(bot);
    bot.hears(moduleParam.keywords, (ctx) => hearsHandler(ctx));
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};
