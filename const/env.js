require('dotenv').config({ quiet: true, override: true });

const botToken = process.env.BOT_TOKEN;
const botUsername = process.env.BOT_USERNAME;
const superUserId = process.env.SUPER_USER_ID;
const homeChatId = process.env.HOME_CHAT_ID;

module.exports = {
    botToken,
    botUsername,
    superUserId,
    homeChatId
};