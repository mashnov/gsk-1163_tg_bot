const cron = require('node-cron');

const { sendLocalFileMessage, removeMessage, commandAnswer, sendMessage} = require('../helpers/telegraf');
const { getCsvFromBd } = require('../helpers/backup');
const { guard } = require('../helpers/guard');

const { moduleNames, homeOption, closeOption} = require('../const/dictionary');
const { homeTimeZone } = require('../const/env');

const moduleParam = {
    name: moduleNames.backup,
    csv: 'csv',
    txt: 'txt',
    json: 'json',
    sendTime: [23],
};

const startAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const messageText = '📤 Резервное копирование'

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            [`${moduleParam.name}:${moduleParam.txt}`]: 'Скачать логи',
            [`${moduleParam.name}:${moduleParam.csv}`]: 'Скачать CSV',
            [`${moduleParam.name}:${moduleParam.json}`]: 'Скачать БД',
            ...homeOption,
        },
    });
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const downloadAction = async (ctx, { isCronAction, actionType } = {}) => {
    const isGuardPassed = isCronAction || await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const fileParams = {};

    if (actionType === moduleParam.json) {
        fileParams.filePath = './state/db.json';
    }
    if (actionType === moduleParam.csv) {
        fileParams.fileContent = await getCsvFromBd();
    }
    if (actionType === moduleParam.txt) {
        fileParams.filePath = './state/messages.txt';
    }

    await sendLocalFileMessage(ctx, {
        buttons: isCronAction ? closeOption : homeOption,
        ...fileParams,
    });

    if (!isCronAction) {
        await removeMessage(ctx);
        await commandAnswer(ctx, 'Файл подготовлен');
    }
};

const cronAction = (bot) => {
    cron.schedule(
        `0 ${moduleParam.sendTime} * * *`,
        async () => downloadAction(bot, { isCronAction: true, actionType: moduleParam.json }),
        { timezone: homeTimeZone },
    );
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, actionType] = data.split(':');

    if (action === moduleParam.name) {
        await downloadAction(ctx, { actionType });
    }

    return next();
};

module.exports = (bot) => {
    cronAction(bot);
    bot.command(moduleParam.name, (ctx) => startAction(ctx, { isCronAction: false }));
    bot.action(moduleParam.name, (ctx) => startAction(ctx, { isCronAction: false }));
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};
