require('dotenv').config({ quiet: true, override: true });

const botToken = process.env.BOT_TOKEN;
const botUsername = process.env.BOT_USERNAME;
const superUserId = Number(process.env.SUPER_USER_ID);
const homeChatId = Number(process.env.HOME_CHAT_ID);
const logMaxAgeDays = Number(process.env.LOG_MAX_AGE_DAYS);
const homeTimeZone = process.env.HOME_TZ;
const homeLatitude = process.env.HOME_WEATHER_LAT;
const homeLongitude = process.env.HOME_WEATHER_LON;
const weatherApi = process.env.HOME_WEATHER_API;
const horoscopeApi = process.env.HOROSCOPE_API;
const profilesPageCount = Number(process.env.PROFILES_PAGE_COUNT);
const debtorsTotalRow = Number(process.env.DEBTORS_TOTAL_ROW);
const debtorsTotalCell = Number(process.env.DEBTORS_TOTAL_CELL);
const debtorsRoomNumberStartRow = Number(process.env.DEBTORS_ROOM_NUMBER_START_ROW);
const debtorsRoomNumberCell = Number(process.env.DEBTORS_ROOM_NUMBER_CELL);
const debtorsAmountCell = Number(process.env.DEBTORS_AMOUNT_CELL);
const debtorsAmountMin = Number(process.env.DEBTORS_AMOUNT_MIN);

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
    debtorsTotalRow,
    debtorsTotalCell,
    debtorsRoomNumberStartRow,
    debtorsRoomNumberCell,
    debtorsAmountCell,
    debtorsAmountMin,
};