const cron = require('node-cron');

const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { fetchWeatherData, windUnitTransformer } = require('../helpers/weather');
const { guard } = require('../helpers/guard');

const { weatherCodeMap } = require('../const/weather');
const { homeOption, closeOption, moduleNames} = require('../const/dictionary');
const { homeChatId, homeTimeZone } = require('../const/env');

const moduleParam = {
    name: moduleNames.weather,
    keywords: ['погода', 'Погода'],
    sendTime: [8, 14, 20],
}

const getWeatherMessage = async (ctx, { needRemove, needButtons, isCronAction }) => {
    const isGuardPassed = isCronAction || await guard(ctx, { unBlocked: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
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

    if (!isPrivateChat) {
        messageText += '\n\n<blockquote>Прогноз публикуется автоматически в 08:00, 14:00 и 20:00 ежедневно</blockquote>';
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