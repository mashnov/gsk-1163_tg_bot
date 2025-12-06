const { config } = require('dotenv');
const { createBot } = require('./bot');

config();

const bot = createBot().launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
