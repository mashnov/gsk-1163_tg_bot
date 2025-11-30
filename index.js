const { Telegraf } = require('telegraf');

// BOT_TOKEN ты уже задашь в Bothost в переменных окружения
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Здравствуйте! 🎉 Бот работает.'));
bot.help((ctx) => ctx.reply('Команда /start — проверить работу бота.'));

bot.on('text', (ctx) => {
    ctx.reply(`Вы написали: ${ctx.message.text}`);
});

bot.launch().then(() => {
    console.log('🤖 Bot started on Bothost (long polling)');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
