const { startStepper } = require('../helpers/stepper');
const { initStore, getSession } = require('../helpers/sessions');
const { sendMessage, removeMessage, commandAnswer, getFile } = require('../helpers/telegraf');
const { getFormattedAmount, getFormattedDate } = require('../helpers/getters');
const { getUserData, getDebtorsData, setDebtorsData } = require('../helpers/db');
const { handleXlsxFile } = require('../helpers/debtors');
const { guard } = require('../helpers/guard');

const { stepList } = require('../const/debtors');
const { moduleNames, homeOption} = require('../const/dictionary');
const { userStatusList} = require('../const/db');

const moduleParam = {
    name: moduleNames.debtors,
    init: 'init',
    submit: 'submit',
}

let stepper = undefined;

const initStepper = async () => {
    stepper = startStepper({
        stepList,
        actionName: moduleParam.name,
        submitActions: {
            [`${moduleParam.name}:${moduleParam.submit}`]: 'Обработать файл ✅'
        },
    });
};

const startAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const debtorsData = await getDebtorsData();
    const userData = await getUserData({ from: ctx.from });
    const isAdmin = [userStatusList.admin, userStatusList.accountant, userStatusList.chairman].includes(userData?.userStatus);

    let messageText =
        '🏦 Должники\n\n' +
        `Обновлено: ${getFormattedDate(debtorsData.updatedAt)}\n` +
        `Суммарный долг: ${getFormattedAmount(debtorsData.total)}\n\n`;

    for (const resident of debtorsData.residents) {
        messageText += `${resident.roomNumber} - ${getFormattedAmount(resident.amount)}\n`
    }

    messageText += '\n\n<blockquote>Указание номера квартиры без ФИО не позволяет определить конкретное физическое лицо ФЗ № 152.</blockquote>';

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            ...(isAdmin ? { [`${moduleParam.name}:${moduleParam.init}`]: '📥 Загрузить новые данные' } : {}),
            ...homeOption,
        },
    });
    await removeMessage(ctx);
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

    await startAction(ctx);
    await removeMessage(ctx);
    await commandAnswer(ctx, 'Данные успешно загружены');
};

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => startAction(ctx));
    bot.action(moduleParam.name, (ctx) => startAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.init}`, (ctx) => initAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.submit}`, (ctx) => submitAction(ctx));
    bot.on('document', (ctx, next) => stepper ? stepper.inputHandler(ctx, next) : next());
};
