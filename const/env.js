require('dotenv').config({ quiet: true, override: true });

const botToken = process.env.BOT_TOKEN;
const botUsername = process.env.BOT_USERNAME;
const superUserId = process.env.SUPER_USER_ID;
const homeChatId = process.env.HOME_CHAT_ID;
const homeTimeZone = process.env.HOME_TZ;
const homeLatitude = process.env.HOME_WEATHER_LAT;
const homeLongitude = process.env.HOME_WEATHER_LON;

module.exports = {
    botToken,
    botUsername,
    superUserId,
    homeChatId,
    homeTimeZone,
    homeLatitude,
    homeLongitude,
};