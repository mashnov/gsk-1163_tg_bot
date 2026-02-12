const cron = require('node-cron');

const { initStore, getSession } = require('../helpers/sessions');
const { getUserData, getDebtorsData, setDebtorsData, setStatisticsData } = require('../helpers/db');
const { sendMessage, removeMessage, commandAnswer, getFile } = require('../helpers/telegraf');
const { getFormattedAmount, getFormattedDate } = require('../helpers/getters');
const { handleXlsxFile } = require('../helpers/debtors');
const { startStepper } = require('../helpers/stepper');
const { guard } = require('../helpers/guard');

const { cronIsEnabled, hearsIsEnabled, homeTimeZone, homeChatId } = require('../const/env');
const { moduleNames, homeOption, closeOption} = require('../const/dictionary');
const { stepList } = require('../const/debtors');
const { userStatusList} = require('../const/db');

const moduleParam = {
    name: moduleNames.debtors,
    keywords: [/долг/i, /долж/i],
    sendTime: [18],
    sendDay: [1],
    init: 'init',
    submit: 'submit',
}

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

const startAction = async (ctx, { isCronAction, noRemove, isUploadAction, isHearsAction } = {}) => {
    if (!isCronAction && !isUploadAction) {
        await setStatisticsData(isHearsAction ? 'debtors-hears' : 'debtors-start');
    }

    const isGuardPassed = isCronAction || await guard(ctx, { unBlocked: true });

    if (!isGuardPassed) {
        if (!noRemove) {
            await removeMessage(ctx);
        }
        await commandAnswer(ctx);
        return;
    }

    const debtorsData = await getDebtorsData();
    const userData = await getUserData({ from: ctx.from });
    const isPrivateChat = ctx.chat?.type === 'private';
    const isAdmin = [userStatusList.admin, userStatusList.accountant, userStatusList.chairman].includes(userData?.userStatus);

    let messageText =
        '🏦 Должники\n\n' +
        `Обновлено: ${getFormattedDate(debtorsData.updatedAt)}\n` +
        `Суммарный долг: ${getFormattedAmount(debtorsData.total)}\n\n`;

    for (const resident of debtorsData.residents) {
        messageText += `${resident.roomNumber} - ${getFormattedAmount(resident.amount)}\n`
    }

    messageText += '\n\n<blockquote>Указание номера квартиры без ФИО не позволяет определить конкретное физическое лицо ФЗ № 152.</blockquote>';

    if (!isPrivateChat && isCronAction) {
        messageText += '\n\n<blockquote>Информация публикуется автоматически ежемесячно, первого числа, в 18:00.</blockquote>';
    }

    await sendMessage(ctx, {
        text: messageText,
        accountId: isPrivateChat ? undefined : homeChatId,
        buttons: {
            ...(isPrivateChat && isAdmin ? { [`${moduleParam.name}:${moduleParam.init}`]: '📥 Загрузить новые данные' } : {}),
            ...(isPrivateChat ? homeOption : {}),
            ...(!isPrivateChat && !isCronAction ? closeOption : {}),
        },
    });

    if (!isCronAction && !noRemove) {
        await removeMessage(ctx);
    }
    await commandAnswer(ctx);
};

const initAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    initStore({ accountId: ctx.from.id, chatId: ctx.chat.id, moduleName: moduleParam.name });

    await initStepper();
    await stepper?.startHandler(ctx);

    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const submitAction = async (ctx) => {
    const session = getSession(ctx.from.id);
    const fileData = await getFile(ctx, session?.document?.file_id);
    const { residents, total } = await handleXlsxFile(fileData);

    await setDebtorsData({ total, residents });

    await startAction(ctx, { isUploadAction: true });
    await removeMessage(ctx);
    await commandAnswer(ctx, 'Данные успешно загружены');
};

const cronAction = (bot) => {
    if (cronIsEnabled.debtors) {
        cron.schedule(
            `0 ${moduleParam.sendTime} ${moduleParam.sendDay} * *`,
            async () => startAction(bot, { isCronAction: true }),
            { timezone: homeTimeZone },
        );
    }
};

const hearsHandler = async (ctx) => {
    const isGuardPassed = await guard(ctx, { publicChat: true });

    if (!isGuardPassed) {
        await commandAnswer(ctx);
        return;
    }

    if (hearsIsEnabled.debtors) {
        await startAction(ctx, { noRemove: true, isHearsAction: true });
    }
};

module.exports = (bot) => {
    cronAction(bot);
    bot.hears(moduleParam.keywords, (ctx) => hearsHandler(ctx));
    bot.command(moduleParam.name, (ctx) => startAction(ctx));
    bot.action(moduleParam.name, (ctx) => startAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.init}`, (ctx) => initAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.submit}`, (ctx) => submitAction(ctx));
    bot.on('document', (ctx, next) => stepper ? stepper.inputHandler(ctx, next) : next());
};
