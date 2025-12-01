const { config } = require('dotenv');
config();

const { createBot } = require('./bot');

const bot = createBot();

bot.launch().then(() => {
    console.log('🟢 Бот запущен');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
