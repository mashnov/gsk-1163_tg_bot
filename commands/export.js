const { getCsvFromBd } = require('../helpers/export');
const { sendLocalFileMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { guard } = require('../helpers/guard');

const { homeOption, moduleNames } = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.export,
};

const startAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    await sendLocalFileMessage(ctx, {
        fileContent: await getCsvFromBd(),
        buttons: homeOption,
    });

    await removeMessage(ctx);
    await commandAnswer(ctx, 'Файл подготовлен');
};

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => startAction(ctx));
    bot.action(moduleParam.name, (ctx) => startAction(ctx));
};
