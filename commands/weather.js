const cron = require('node-cron');

const { sendMessage, removeMessage} = require('../helpers/message');

const { homeOption, closeOption, moduleNames} = require('../const/dictionary');
const { homeChatId, homeTimeZone, homeLatitude, homeLongitude } = require('../const/env');

const moduleParam = {
    name: moduleNames.weather,
    start: 'start',
    startH: '8',
    startM: '00',
    serviceUrl: `https://api.open-meteo.com/v1/forecast?latitude=${homeLatitude}&longitude=${homeLongitude}&daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max&timezone=${encodeURIComponent(homeTimeZone)}`,
}

const getWeatherMessage = async (bot, { needRemove, needAnswer, needButtons }) => {
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

    const isPrivateChat = bot.chat?.type === 'private';

    await sendMessage(bot, {
        accountId: isPrivateChat ? undefined : homeChatId,
        text: messageText,
        buttons: isPrivateChat ? homeOption : needButtons ? closeOption : {},
    });

    if (needRemove) {
        await removeMessage(bot);
    }

    if (needAnswer) {
        await ctx.answerCbQuery();
    }
};

const initAction = (bot) => {
    cron.schedule(
        `${moduleParam.startM} ${moduleParam.startH} * * *`,
        async () => getWeatherMessage(bot, {}),
        { timezone: homeTimeZone },
    );
}

module.exports = (bot) => {
    initAction(bot);
    bot.command(`${moduleParam.name}:${moduleParam.start}`, async (ctx) => getWeatherMessage(ctx, { needRemove: true, needButtons: true, needAnswer: true }));
    bot.action(`${moduleParam.name}:${moduleParam.start}`, async (ctx) => getWeatherMessage(ctx, { needRemove: true, needButtons: true }));
    bot.hears('погода', async (ctx) => getWeatherMessage(ctx, { needRemove: true, needButtons: true, }));
    bot.hears('Погода', async (ctx) => getWeatherMessage(ctx, { needRemove: true, needButtons: true, }));
};