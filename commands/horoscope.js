const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { fetchHoroscopeData } = require('../helpers/horoscope');
const { guard } = require('../helpers/guard');

const { homeOption, moduleNames} = require('../const/dictionary');
const { horoscopeTitleMapper } = require('../const/horoscope');

const moduleParam = {
    name: moduleNames.horoscope,
    item: 'item',
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

const getHoroscopeMessage = async (ctx, { horoName } = {}) => {
    const isGuardPassed = await guard(ctx, { unBlocked: true, privateChat: true  });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const response = await fetchHoroscopeData();

    const horoList = Object.keys(horoscopeTitleMapper);
    const horoFilteredList = horoList.filter(horoItem => horoItem === horoName);

    for (const horoItem of horoFilteredList) {
        const horoTitle = horoscopeTitleMapper[horoItem];
        const horoText = response?.horo?.[horoItem]?.today;
        const messageText = horoTitle + '\n\n' + horoText;

        await sendMessage(ctx, {
            text: messageText,
            buttons: { [moduleParam.name] : '⬅️ Назад' },
        });
    }

    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, actionName, horoName] = data.split(':');

    if (action === moduleParam.name && actionName === moduleParam.item) {
        await getHoroscopeMessage(ctx, { horoName });
    }

    return next();
};

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};
