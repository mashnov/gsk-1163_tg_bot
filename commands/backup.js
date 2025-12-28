const cron = require('node-cron');

const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { guard } = require('../helpers/guard');

const { moduleNames, homeOption, closeOption } = require('../const/dictionary');
const { homeTimeZone, superUserId } = require('../const/env');

const moduleParam = {
    name: moduleNames.backup,
    sendTime: [0, 6, 12, 16, 18, 19, 20, 21, 22, 23],
};

const startAction = async (ctx, { isCronAction }) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, superUser: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const messageText = '💾 Резервная копия готова!';

    await sendMessage(ctx, {
        accountId: superUserId,
        text: messageText,
        buttons: isCronAction ? closeOption : homeOption,
        filePath: './state/db.json',
    });
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const cronAction = (bot) => {
    cron.schedule(
        `0 ${moduleParam.sendTime} * * *`,
        async () => startAction(bot, { isCronAction: true }),
        { timezone: homeTimeZone },
    );
}

module.exports = (bot) => {
    cronAction(bot);
    bot.command(moduleParam.name, (ctx) => startAction(ctx, { isCronAction: false }));
    bot.action(moduleParam.name, (ctx) => startAction(ctx, { isCronAction: false }));
};
