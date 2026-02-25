const { sendLocalFileMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { fetchHoroscopeData } = require('../helpers/horoscope');
const { setStatisticsData } = require('../helpers/db');
const { guard } = require('../helpers/guard');

const { homeOption, moduleNames} = require('../const/dictionary');
const { horoscopeTitleMapper } = require('../const/horoscope');

const moduleParam = {
    name: moduleNames.horoscope,
    keywords: [/гороскоп/i],
    sendTime: [6],
    item: 'item',
}

const initAction = async (ctx) => {
    await commandAnswer(ctx);
    await setStatisticsData('horoscope-start');

    const isGuardPassed = await guard(ctx, { privateChat: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        return;
    }

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

    await sendLocalFileMessage(ctx, {
        text: '💫 Гороскоп',
        fileType: 'photo',
        filePath: `./assets/horoscope/preview.jpg`,
        buttons: {
            ...buttons,
            ...homeOption,
        },
    });
    await removeMessage(ctx);
};

const getHoroscopeMessage = async (ctx, { horoscopeType } = {}) => {
    await commandAnswer(ctx);
    await setStatisticsData(`horoscope-get:${horoscopeType}`);
    const isGuardPassed = await guard(ctx, { unBlocked: true, privateChat: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        return;
    }

    const response = await fetchHoroscopeData();
    const horoList = Object.keys(horoscopeTitleMapper);
    const horoFilteredList = horoList.filter(horoItem => horoItem === horoscopeType || !horoscopeType);

    let messageText = '';

    for (const horoItem of horoFilteredList) {
        const horoTitle = horoscopeTitleMapper[horoItem];
        const horoText = response?.horo?.[horoItem]?.today;
        messageText += `\n\n<b>${horoTitle}</b>`;
        messageText += `\n<blockquote>${horoText}</blockquote>`;
    }

    await sendLocalFileMessage(ctx, {
        text: messageText,
        fileType: 'photo',
        filePath: `./assets/horoscope/${horoscopeType}.jpg`,
        buttons: {
            ...{ [moduleParam.name]: '⬅️ Назад' },
            ...homeOption,

        },
    });

    await removeMessage(ctx);
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, actionName, horoscopeType] = data.split(':');

    if (action === moduleParam.name && actionName === moduleParam.item) {
        await getHoroscopeMessage(ctx, { horoscopeType });
    }

    return next();
};

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};
