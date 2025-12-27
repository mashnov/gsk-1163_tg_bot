const cron = require('node-cron');

const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { fetchHoroscopeData } = require('../helpers/horoscope');
const { guard } = require('../helpers/guard');

const { homeOption, closeOption, moduleNames} = require('../const/dictionary');
const { homeChatId, homeTimeZone } = require('../const/env');
const { horoscopeTitleMapper } = require('../const/horoscope');

const moduleParam = {
    name: moduleNames.horoscope,
    keywords: ['гороскоп', 'Гороскоп'],
    item: 'item',
    startH: '8',
    startM: '30',
}

const initAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const messageText =
        '💫 Гороскоп' +
        '\n\nВыберите интересующий вас знак';

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

const getHoroscopeMessage = async (ctx, { needRemove, needButtons, horoName, isCronAction } = {}) => {
    const isGuardPassed = isCronAction || await guard(ctx, { unBlocked: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const response = await fetchHoroscopeData();

    const isPrivateChat = isCronAction ? false : ctx.chat?.type === 'private';
    const horoList = Object.keys(horoscopeTitleMapper);
    const horoFilteredList = !isPrivateChat ? horoList : horoList.filter(horoItem => horoItem === horoName);

    for (const horoItem of horoFilteredList) {
        const horoTitle = horoscopeTitleMapper[horoItem];
        const horoText = response?.horo?.[horoItem]?.today;
        const messageText = horoTitle + '\n\n' + horoText;

        await sendMessage(ctx, {
            accountId: isPrivateChat ? undefined : homeChatId,
            text: messageText,
            buttons: {
                ...(isPrivateChat ? { [moduleParam.name] : '⬅️ Назад' } : {}),
                ...(!isPrivateChat && needButtons ? closeOption : {}),
            },
        });
    }

    if (needRemove) {
        await removeMessage(ctx);
    }
    await commandAnswer(ctx);
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, actionName, horoName] = data.split(':');

    if (action === moduleParam.name && actionName === moduleParam.item) {
        await getHoroscopeMessage(ctx, { needRemove: true, needAnswer: true, horoName });
    }

    return next();
};

const cronAction = (bot) => {
    cron.schedule(
        `${moduleParam.startM} ${moduleParam.startH} * * *`,
        async () => getHoroscopeMessage(bot, { isCronAction: true }),
        { timezone: homeTimeZone },
    );
}

module.exports = (bot) => {
    cronAction(bot);
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};
