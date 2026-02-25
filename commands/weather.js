const cron = require('node-cron');

const { sendLocalFileMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { fetchWeatherData, windUnitTransformer, getWeatherImage } = require('../helpers/weather');
const { setStatisticsData } = require('../helpers/db');
const { guard } = require('../helpers/guard');

const { cronIsEnabled, homeChatId, homeTimeZone } = require('../const/env');
const { homeOption, closeOption, moduleNames} = require('../const/dictionary');
const { weatherCodeDetails } = require('../const/weather');

const moduleParam = {
    name: moduleNames.weather,
    keywords: [/погода/i, /gjujlf/i, /weather/i, /цуферук/i],
    sendTime: [8, 16],
}

const initAction = async (ctx, { isCronAction, isHearsAction } = {}) => {
    await commandAnswer(ctx);
    const isGuardPassed = isCronAction || await guard(ctx, { unBlocked: true, publicChat: isHearsAction });

    if (!isCronAction) {
        await setStatisticsData(isHearsAction ? 'weather-hears' : 'weather-start');
    }

    if (!isGuardPassed) {
        return;
    }

    const isPrivateChat = ctx.chat?.type === 'private';
    const serviceData = await fetchWeatherData();

    const currentWeather = serviceData?.current ?? {}
    const hourlyWeather = serviceData?.hourly ?? {}

    const currentWeatherCode = currentWeather?.weather_code;
    const currentTemperature = currentWeather?.temperature_2m;

    const weatherDetails = weatherCodeDetails[currentWeatherCode];
    const windSpeed = windUnitTransformer(currentWeather?.wind_speed_10m);

    let messageText =
        `\n${weatherDetails.icon} ${weatherDetails.text}` +
        `\n\n🌡 Температура воздуха: ${currentTemperature ?? '-'} °С` +
        `\n💧 Влажность воздуха: ${currentWeather?.relative_humidity_2m ?? '-'} %` +
        `\n☁️ Облачность: ${currentWeather?.cloud_cover ?? '-'} %` +
        `\n💨 Скорость ветра: ${windSpeed ?? '-'} м/с` +
        `\n☔️ Количество осадков: ${hourlyWeather?.precipitation?.[0] ?? '-'} мм` +
        `\n🌂 Вероятность осадков: ${hourlyWeather?.precipitation_probability?.[0] ?? '-'} %`;

    if (!isPrivateChat && isCronAction) {
        messageText += '\n\n<blockquote>Информация публикуется автоматически в 08:00 и 16:00 ежедневно</blockquote>';
    }

    await sendLocalFileMessage(ctx, {
        text: messageText,
        accountId: isPrivateChat ? undefined : homeChatId,
        fileType: 'photo',
        filePath: getWeatherImage(currentWeatherCode, currentTemperature),
        buttons: {
            ...(isPrivateChat ? homeOption : {}),
            ...(!isPrivateChat && !isCronAction ? closeOption : {}),
        },
    });

    if (isPrivateChat) {
        await removeMessage(ctx);
    }
};

const cronAction = (bot) => {
    if (cronIsEnabled.weather) {
        cron.schedule(
            `0 ${moduleParam.sendTime} * * *`,
            async () => initAction(bot, { isCronAction: true }),
            { timezone: homeTimeZone },
        );
    }
};

module.exports = (bot) => {
    cronAction(bot);
    bot.hears(moduleParam.keywords, (ctx) => initAction(ctx, { isHearsAction: true }));
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
};