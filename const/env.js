const { config } = require('dotenv');

config({ override: true });

const botToken = process.env.BOT_TOKEN;
const superUserId = process.env.SUPER_USER_ID;

module.exports = {
    botToken,
    superUserId,
};