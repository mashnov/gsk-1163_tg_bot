const forwardStep = require('./forward');
const handlerStep = require('./handler');

module.exports = (bot) => {
    // Команда /complain
    bot.command('complain', (ctx) => forwardStep(ctx));

    // Кнопка в меню (callback 'complain')
    bot.action('complain', async (ctx) => {
        await ctx.answerCbQuery();
        return forwardStep(ctx);
    });

    // Ловим ВСЕ сообщения, но обрабатываем только тех, кто в режиме жалобы
    bot.on('message', async (ctx, next) => {
        return handlerStep(ctx, next);
    });
};
