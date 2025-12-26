const cron = require('node-cron');

const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { guard } = require('../helpers/guard');

const { homeOption, closeOption, moduleNames} = require('../const/dictionary');
const { homeChatId, homeTimeZone, homeLatitude, homeLongitude } = require('../const/env');

const moduleParam = {
    name: moduleNames.weather,
    keywords: ['погода', 'Погода'],
    sendTime: [8, 14, 20],
    serviceUrl: `https://api.open-meteo.com/v1/forecast?latitude=${homeLatitude}&longitude=${homeLongitude}&daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max&timezone=${encodeURIComponent(homeTimeZone)}`,
}

const getWeatherMessage = async (ctx, { needRemove, needButtons, isCronAction }) => {
    const isGuardPassed = isCronAction || await guard(ctx, { unBlocked: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const isPrivateChat = isCronAction ? false : ctx.chat?.type === 'private';
    const serviceResponse = await fetch(moduleParam.serviceUrl);
    const serviceData = await serviceResponse.json();

    const minTemperature = ((serviceData?.daily?.temperature_2m_min) || [])[0]
    const maxTemperature = ((serviceData?.daily?.temperature_2m_max) || [])[0]
    const precipitation = ((serviceData?.daily?.precipitation_probability_max) || [])[0]

    let messageText =
        '🌤️ Прогноз погоды' +
        `\n\nМинимальная температура: ${minTemperature}°C` +
        `\nМаксимальная температура: ${maxTemperature}°C` +
        `\nВероятность осадков: до ${precipitation}%`;

    if (!isPrivateChat) {
        messageText += '\n\nПрогноз публикуется автоматически в 08:00, 14:00 и 20:00 ежедневно';
    }

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

const hearsHandler = async (ctx) => {
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
        async () => getWeatherMessage(bot, { isCronAction: true }),
        { timezone: homeTimeZone },
    );
}

module.exports = (bot) => {
    cronAction(bot);
    bot.command(moduleParam.name, (ctx) => getWeatherMessage(ctx, { needRemove: true, needButtons: true }));
    bot.action(moduleParam.name, (ctx) => getWeatherMessage(ctx, { needRemove: true, needButtons: true }));
    bot.hears(moduleParam.keywords, (ctx) => hearsHandler(ctx));
};