require('dotenv').config({ quiet: true, override: true });

const botToken = process.env.BOT_TOKEN;
const botUsername = process.env.BOT_USERNAME;
const superUserId = Number(process.env.SUPER_USER_ID);
const homeChatId = Number(process.env.HOME_CHAT_ID);
const homeTimeZone = process.env.HOME_TZ;
const homeLatitude = process.env.HOME_WEATHER_LAT;
const homeLongitude = process.env.HOME_WEATHER_LON;
const weatherApi = process.env.HOME_WEATHER_API;
const horoscopeApi = process.env.HOROSCOPE_API;
const profilesPageCount = Number(process.env.PROFILES_PAGE_COUNT);

module.exports = {
    botToken,
    botUsername,
    superUserId,
    homeChatId,
    homeTimeZone,
    homeLatitude,
    homeLongitude,
    profilesPageCount,
    weatherApi,
    horoscopeApi,
};