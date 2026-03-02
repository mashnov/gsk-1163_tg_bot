const cron = require('node-cron');

const { initStore, getSession } = require('../helpers/sessions');
const { sendLocalFileMessage, removeMessage, commandAnswer, getFile} = require('../helpers/telegraf');
const { getStatisticsData } = require('../helpers/db');
const { updateDbFile } = require('../helpers/database');
const { getCsvFromBd, getVcfFromBd } = require('../helpers/admin');
const { startStepper } = require('../helpers/stepper');
const { guard } = require('../helpers/guard');

const { moduleNames, homeOption, closeOption} = require('../const/dictionary');
const { homeTimeZone, superUserId} = require('../const/env');
const { stepList } = require('../const/database');

const moduleParam = {
    name: moduleNames.admin,
    init: 'init',
    submit: 'submit',
    csv: 'csv',
    vcf: 'vcf',
    logs: 'logs',
    database: 'database',
    download: 'download',
    upload: 'upload',
    sendTimeMinutes: 30,
    sendTimeHours: 23,
};

let stepper = undefined;

const initStepper = async () => {
    stepper = startStepper({
        stepList,
        actionName: moduleParam.name,
        submitActions: {
            [`${moduleParam.name}:${moduleParam.submit}`]: 'Обработать файл'
        },
    });
};

const startAction = async (ctx) => {
    await commandAnswer(ctx);
    const isGuardPassed = await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        return;
    }

    const statisticsData = await getStatisticsData(true);
    const statisticsLines = Object.entries(statisticsData).map(([key, value]) => `• ${key} - ${value}`).join('\n');

    const messageText =
        '🪪 Управление' +
        '\n\nСтатистика использования за сегодня:' +
        `\n\n${statisticsLines}`

    await sendLocalFileMessage(ctx, {
        text: messageText,
        fileType: 'photo',
        filePath: `./assets/admin/preview.jpg`,
        buttons: {
            [moduleNames.profiles]: 'Профили',
            [`${moduleParam.name}:${moduleParam.download}:${moduleParam.csv}`]: 'Скачать CSV',
            [`${moduleParam.name}:${moduleParam.download}:${moduleParam.vcf}`]: 'Скачать vCard',
            [`${moduleParam.name}:${moduleParam.download}:${moduleParam.logs}`]: 'Скачать логи',
            [`${moduleParam.name}:${moduleParam.download}:${moduleParam.database}`]: 'Скачать БД',
            [`${moduleParam.name}:${moduleParam.upload}:${moduleParam.database}`]: 'Востановить БД',
            ...homeOption,
        },
    });
    await removeMessage(ctx);
};

const initAction = async (ctx) => {
    await commandAnswer(ctx);
    const isGuardPassed = await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        return;
    }

    initStore({ accountId: ctx.from.id, chatId: ctx.chat.id, moduleName: moduleParam.name });

    await initStepper();
    await stepper?.startHandler(ctx);

    await removeMessage(ctx);
};

const submitAction = async (ctx) => {
    const session = getSession(ctx.from.id);
    const fileData = await getFile(ctx, session?.document?.file_id);

    await updateDbFile(fileData);

    await sendLocalFileMessage(ctx, {
        text: '🪪 Пожалуйста, перезапустите бота!',
        fileType: 'photo',
        filePath: `./assets/admin/success.jpg`,
        buttons: { [moduleNames.admin]: 'Готово' },
    });

    await removeMessage(ctx);
    await commandAnswer(ctx, 'Данные успешно загружены');
};

const downloadAction = async (ctx, { isCronAction, fileType } = {}) => {
    const isGuardPassed = isCronAction || await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const fileParams = {};

    if (fileType === moduleParam.database) {
        fileParams.filePath = './state/db.json';
    }
    if (fileType === moduleParam.csv) {
        fileParams.fileContent = await getCsvFromBd();
        fileParams.fileName = 'export.csv';
    }
    if (fileType === moduleParam.vcf) {
        fileParams.fileContent = await getVcfFromBd();
        fileParams.fileName = 'contacts.vcf';
    }
    if (fileType === moduleParam.logs) {
        fileParams.filePath = './state/messages.txt';
    }

    await sendLocalFileMessage(ctx, {
        ...fileParams,
        accountId: isCronAction ? superUserId : undefined,
        buttons: {
            ...(fileType && !isCronAction ? { [moduleParam.name]: '⬅️ Назад' } : {} ),
            ...(fileType && !isCronAction ? homeOption : {} ),
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
        `${moduleParam.sendTimeMinutes} ${moduleParam.sendTimeHours} * * *`,
        async () => downloadAction(bot, { isCronAction: true, fileType: moduleParam.database }),
        { timezone: homeTimeZone },
    );
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, actionName, fileType] = data.split(':');

    if (actionName === moduleParam.download && action === moduleParam.name) {
        await downloadAction(ctx, { fileType });
    }
    if (actionName === moduleParam.upload && action === moduleParam.name) {
        await initAction(ctx);
    }
    if (actionName === moduleParam.submit && action === moduleParam.name) {
        await submitAction(ctx);
    }

    return next();
};

module.exports = (bot) => {
    cronAction(bot);
    bot.command(moduleParam.name, (ctx) => startAction(ctx, { isCronAction: false }));
    bot.action(moduleParam.name, (ctx) => startAction(ctx, { isCronAction: false }));
    bot.on('document', (ctx, next) => stepper ? stepper.inputHandler(ctx, next) : next());
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};
