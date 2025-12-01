const excludedCommands = ['/start'];

module.exports = (bot) => {
    bot.use(async (ctx, next) => {
        const isMessage = !!ctx.message;

        if (isMessage) {
            const msg = ctx.message?.text || '';
            const isCommand = msg?.startsWith('/');
            const isExcludedCommand = excludedCommands.includes(msg);

            if (isCommand && isExcludedCommand) {
                return next();
            }
        }

        try {
            await ctx.deleteMessage();
        } catch(e) {
            console.log('Не удалось удалить команду:', e.message);
        }
        return next();
    });
};
