const cron = require('node-cron');

const { sendLocalFileMessage, removeMessage, commandAnswer, sendMessage} = require('../helpers/telegraf');
const { setStatisticsData, getStatisticsData } = require('../helpers/db');
const { getCsvFromBd } = require('../helpers/admin');
const { guard } = require('../helpers/guard');

const { moduleNames, homeOption, closeOption} = require('../const/dictionary');
const { homeTimeZone, superUserId} = require('../const/env');

const moduleParam = {
    name: moduleNames.admin,
    csv: 'csv',
    logs: 'logs',
    database: 'database',
    sendTime: [23],
};

const startAction = async (ctx) => {
    await setStatisticsData('admin-start');

    const isGuardPassed = await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const statisticsData = await getStatisticsData(true);
    const statisticsLines = Object.entries(statisticsData).map(([key, value]) => `• ${key} - ${value}`).join('\n');

    const messageText =
        '🪪 Управление' +
        '\n\nСтатистика использования за сегодня:' +
        `\n\n${statisticsLines}`

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            [moduleNames.profiles]: 'Профили',
            [`${moduleParam.name}:${moduleParam.logs}`]: 'Скачать логи',
            [`${moduleParam.name}:${moduleParam.csv}`]: 'Скачать CSV',
            [`${moduleParam.name}:${moduleParam.database}`]: 'Скачать БД',
            ...homeOption,
        },
    });
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const downloadAction = async (ctx, { isCronAction, actionType } = {}) => {
    if (!isCronAction && actionType) {
        await setStatisticsData(`admin-get:${actionType}`);
    }

    const isGuardPassed = isCronAction || await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const fileParams = {};

    if (actionType === moduleParam.database) {
        fileParams.filePath = './state/db.json';
    }
    if (actionType === moduleParam.csv) {
        fileParams.fileContent = await getCsvFromBd();
    }
    if (actionType === moduleParam.logs) {
        fileParams.filePath = './state/messages.txt';
    }

    await sendLocalFileMessage(ctx, {
        ...fileParams,
        accountId: isCronAction ? superUserId : undefined,
        buttons: {
            ...(actionType ? { [moduleParam.name]: '⬅️ Назад' } : {} ),
            ...(isCronAction ? closeOption : {}),
        }
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
