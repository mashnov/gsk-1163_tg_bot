const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { guard } = require('../helpers/guard');

const { moduleNames, homeOption } = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.backup,
};

const startAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const messageText = '💾 Резервная копия готова!';

    await sendMessage(ctx, {
        text: messageText,
        buttons: homeOption,
        filePath: './state/db.json',
    });
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => startAction(ctx));
    bot.action(moduleParam.name, (ctx) => startAction(ctx));
};
