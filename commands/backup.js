const { sendMessage, removeMessage } = require('../helpers/message');
const { guard } = require('../helpers/guard');

const { moduleNames, homeOption } = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.backup,
    start: 'start',
};

const startAction = async (ctx, needAnswer) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true, admin: true });

    if (!isGuardPassed) {
        return;
    }

    const messageText = '\💾 Резервная копия готова!';

    await sendMessage(ctx, {
        text: messageText,
        buttons: homeOption,
        filePath: './state/db.json',
    });
    await removeMessage(ctx);

    if (needAnswer) {
        await ctx.answerCbQuery();
    }
};

module.exports = (bot) => {
    bot.command(`${moduleParam.name}:${moduleParam.start}`, async (ctx) => startAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.start}`, async (ctx) => startAction(ctx, true));
};
