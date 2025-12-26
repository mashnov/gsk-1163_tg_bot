const cron = require('node-cron');

const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { parseXml } = require('../helpers/xmlParser');
const { guard } = require('../helpers/guard');

const { homeOption, closeOption, moduleNames} = require('../const/dictionary');
const { homeChatId, homeTimeZone } = require('../const/env');

const moduleParam = {
    name: moduleNames.horoscope,
    keywords: ['гороскоп', 'Гороскоп'],
    item: 'item',
    startH: '8',
    startM: '30',
    serviceUrl: `https://ignio.com/r/export/utf/xml/daily/com.xml`,
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
        [`${moduleParam.name}:${moduleParam.item}:aries`]: '♈ Овен',
        [`${moduleParam.name}:${moduleParam.item}:taurus`]: '♉ Телец',
        [`${moduleParam.name}:${moduleParam.item}:gemini`]: '♊ Близнецы',
        [`${moduleParam.name}:${moduleParam.item}:cancer`]: '♋ Рак',
        [`${moduleParam.name}:${moduleParam.item}:leo`]: '♌ Лев',
        [`${moduleParam.name}:${moduleParam.item}:virgo`]: '♍ Дева',
        [`${moduleParam.name}:${moduleParam.item}:libra`]: '♎ Весы',
        [`${moduleParam.name}:${moduleParam.item}:scorpio`]: '♏ Скорпион',
        [`${moduleParam.name}:${moduleParam.item}:sagittarius`]: '♐ Стрелец',
        [`${moduleParam.name}:${moduleParam.item}:capricorn`]: '♑ Козерог',
        [`${moduleParam.name}:${moduleParam.item}:aquarius`]: '♒ Водолей',
        [`${moduleParam.name}:${moduleParam.item}:pisces`]: '♓ Рыбы',
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

    const serviceResponse = await fetch(moduleParam.serviceUrl);
    const serviceData = await serviceResponse.text();
    const response = await parseXml(serviceData);

    const horoItems = {
        aries: '♈ Овен',
        taurus: '♉ Телец',
        gemini: '♊ Близнецы',
        cancer: '♋ Рак',
        leo: '♌ Лев',
        virgo: '♍ Дева',
        libra: '♎ Весы',
        scorpio: '♏ Скорпион',
        sagittarius: '♐ Стрелец',
        capricorn: '♑ Козерог',
        aquarius: '♒ Водолей',
        pisces: '♓ Рыбы',
    }

    const isPrivateChat = isCronAction ? false : ctx.chat?.type === 'private';
    const horoList = Object.keys(horoItems);
    const horoFilteredList = !isPrivateChat ? horoList : horoList.filter(horoItem => horoItem === horoName);

    for (const horoItem of horoFilteredList) {
        const horoTitle = horoItems[horoItem];
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
