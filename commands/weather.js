const cron = require('node-cron');

const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { guard } = require('../helpers/guard');

const { homeOption, closeOption, moduleNames} = require('../const/dictionary');
const { homeChatId, homeTimeZone, homeLatitude, homeLongitude } = require('../const/env');

const moduleParam = {
    name: moduleNames.weather,
    keywords: ['погода', 'Погода'],
    sendTime: [8, 14, 21],
    serviceUrl: `https://api.open-meteo.com/v1/forecast?latitude=${homeLatitude}&longitude=${homeLongitude}&daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max&timezone=${encodeURIComponent(homeTimeZone)}`,
}

const getWeatherMessage = async (ctx, { needRemove, needButtons }) => {
    const serviceResponse = await fetch(moduleParam.serviceUrl);
    const serviceData = await serviceResponse.json();

    const minTemperature = ((serviceData?.daily?.temperature_2m_min) || [])[0]
    const maxTemperature = ((serviceData?.daily?.temperature_2m_max) || [])[0]
    const precipitation = ((serviceData?.daily?.precipitation_probability_max) || [])[0]

    const messageText =
        '🌤️ Погода на сегодня' +
        `\n\n Минимальная температура: ${minTemperature}°C` +
        `\n Максимальная температура: ${maxTemperature}°C` +
        `\n Вероятность осадков: до ${precipitation}%`

    const isPrivateChat = ctx.chat?.type === 'private';

    await sendMessage(ctx, {
        accountId: isPrivateChat ? undefined : homeChatId,
        text: messageText,
        buttons: isPrivateChat ? homeOption : needButtons ? closeOption : {},
    });

    if (needRemove) {
        await removeMessage(ctx);
    }
    await commandAnswer(ctx);
};

const hearsCallBackHandler = async (ctx) => {
    const isGuardPassed = await guard(ctx, { publicChat: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    await getWeatherMessage(ctx, { needRemove: true, needButtons: true, });
}

const cronAction = (bot) => {
    cron.schedule(
        `0 ${moduleParam.sendTime} * * *`,
        async () => getWeatherMessage(bot, {}),
        { timezone: homeTimeZone },
    );
}

module.exports = (bot) => {
    cronAction(bot);
    bot.command(moduleParam.name, (ctx) => getWeatherMessage(ctx, { needRemove: true, needButtons: true }));
    bot.action(moduleParam.name, (ctx) => getWeatherMessage(ctx, { needRemove: true, needButtons: true }));
    bot.hears(moduleParam.keywords, (ctx) => hearsCallBackHandler(ctx));
};