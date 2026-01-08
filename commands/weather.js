const cron = require('node-cron');

const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { fetchWeatherData, windUnitTransformer } = require('../helpers/weather');
const { guard } = require('../helpers/guard');

const { weatherCodeMap } = require('../const/weather');
const { homeOption, closeOption, moduleNames} = require('../const/dictionary');
const { cronIsEnabled, hearsIsEnabled, homeChatId, homeTimeZone } = require('../const/env');

const moduleParam = {
    name: moduleNames.weather,
    keywords: [/погода/i],
    sendTime: [8, 16],
}

const getWeatherMessage = async (ctx, { isCronAction, noRemove } = {}) => {
    const isGuardPassed = isCronAction || await guard(ctx, { unBlocked: true });

    if (!isGuardPassed) {
        if (!noRemove) {
            await removeMessage(ctx);
        }
        await commandAnswer(ctx);
        return;
    }

    const isPrivateChat = ctx.chat?.type === 'private';
    const serviceData = await fetchWeatherData();

    const currentWeather = serviceData?.current ?? {}
    const hourlyWeather = serviceData?.hourly ?? {}

    const currentWeatherCode = weatherCodeMap[currentWeather?.weather_code];
    const windSpeed = windUnitTransformer(currentWeather?.wind_speed_10m);

    let messageText =
        `\n${currentWeatherCode.icon} ${currentWeatherCode.text}` +
        `\n🌡 Температура воздуха: ${currentWeather?.temperature_2m ?? '-'} °С` +
        `\n💧 Влажность воздуха: ${currentWeather?.relative_humidity_2m ?? '-'} %` +
        `\n☁️ Облачность: ${currentWeather?.cloud_cover ?? '-'} %` +
        `\n💨 Скорость ветра: ${windSpeed ?? '-'} м/с` +
        `\n☔️ Количество осадков: ${hourlyWeather?.precipitation?.[0] ?? '-'} мм` +
        `\n🌂 Вероятность осадков: ${hourlyWeather?.precipitation_probability?.[0] ?? '-'} %`;

    if (!isPrivateChat && isCronAction) {
        messageText += '\n\n<blockquote>Информация публикуется автоматически в 08:00 и 16:00 ежедневно</blockquote>';
    }

    await sendMessage(ctx, {
        text: messageText,
        accountId: isPrivateChat ? undefined : homeChatId,
        buttons: {
            ...(isPrivateChat ? homeOption : {}),
            ...(!isPrivateChat && !isCronAction ? closeOption : {}),
        },
    });

    if (!isCronAction && !noRemove) {
        await removeMessage(ctx);
    }
    await commandAnswer(ctx);
};

const cronAction = (bot) => {
    if (cronIsEnabled.weather) {
        cron.schedule(
            `0 ${moduleParam.sendTime} * * *`,
            async () => getWeatherMessage(bot, { isCronAction: true }),
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

    if (hearsIsEnabled.weather) {
        await getWeatherMessage(ctx, { noRemove: true });
    }
};

module.exports = (bot) => {
    cronAction(bot);
    bot.hears(moduleParam.keywords, (ctx) => hearsHandler(ctx));
    bot.command(moduleParam.name, (ctx) => getWeatherMessage(ctx));
    bot.action(moduleParam.name, (ctx) => getWeatherMessage(ctx));
};