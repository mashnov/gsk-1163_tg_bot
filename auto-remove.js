const excludedCommands = ['/start'];

// todo: remove
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
        } catch(error) {
            console.error(error.message);
        }
        return next();
    });
};
