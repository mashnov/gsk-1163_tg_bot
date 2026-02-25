require('dotenv').config({ quiet: true, override: true });

const botToken = process.env.BOT_TOKEN;
const botUsername = process.env.BOT_USERNAME;
const superUserId = Number(process.env.SUPER_USER_ID);
const homeChatId = Number(process.env.HOME_CHAT_ID);
const logMaxAgeDays = Number(process.env.LOG_MAX_AGE_DAYS);
const homeTimeZone = process.env.HOME_TZ;
const homeLatitude = process.env.HOME_LAT;
const homeLongitude = process.env.HOME_LON;
const weatherApi = process.env.WEATHER_API;
const horoscopeApi = process.env.HOROSCOPE_API;
const profilesPageCount = Number(process.env.PROFILES_PAGE_COUNT);

const cronIsEnabled = {
    weather: process.env.CRON_WEATHER_IS_ENABLED === 'true',
};

module.exports = {
    botToken,
    botUsername,
    superUserId,
    homeChatId,
    logMaxAgeDays,
    homeTimeZone,
    homeLatitude,
    homeLongitude,
    profilesPageCount,
    weatherApi,
    horoscopeApi,
    cronIsEnabled,
};