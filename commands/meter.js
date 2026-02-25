const { initStore, getSession } = require('../helpers/sessions');
const { sendLocalFileMessage, sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getUserIndex, getUserData, setStatisticsData } = require('../helpers/db');
const { getUserNameLink, getSummaryMessage } = require('../helpers/getters');
const { getArrayFallback } = require('../helpers/array');
const { startStepper } = require('../helpers/stepper');
const { guard } = require('../helpers/guard');

const { closeOption, moduleNames } = require('../const/dictionary');
const { superUserId } = require('../const/env');
const { userStatusList } = require('../const/db');
const { stepList } = require('../const/meter');

const moduleParam = {
    name: moduleNames.meter,
    submit: 'submit',
};

let stepper = undefined;

const initStepper = async () => {
    stepper = startStepper({
        stepList,
        actionName: moduleParam.name,
        submitActions: {
            [`${moduleParam.name}:${moduleParam.submit}`]: 'Отправить ✅'
        },
    });
};

const initAction = async (ctx) => {
    await commandAnswer(ctx);
    await setStatisticsData('meter-start');

    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true });

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
    await setStatisticsData('meter-submit');

    const senderText = '〽️ Показания счетчиков успешно отправлены';
    await sendLocalFileMessage(ctx, {
        text: senderText,
        fileType: 'photo',
        filePath: `./assets/meter/preview.jpg`,
    });

    const session = getSession(ctx.from.id);
    const userData = await getUserData({ from: ctx.from });

    const recipientHeader = '〽️ Новые показания\n\n';
    const recipientSender = `Отправитель: ${getUserNameLink(ctx.from)}\n\n`;
    const recipientResidentText = `Имя отправителя: ${userData?.residentName}\n`;
    const recipientPhoneText = `Номер телефона: ${userData?.phoneNumber}\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientResidentText}${recipientPhoneText}${recipientText}`;

    const chairmanIdList = getArrayFallback(await getUserIndex(userStatusList.chairman), [superUserId]);
    const adminIdList = getArrayFallback(await getUserIndex(userStatusList.admin), chairmanIdList);
    const accountantIdList = getArrayFallback(await getUserIndex(userStatusList.accountant), adminIdList);

    for (const recipientAccountId of accountantIdList) {
        await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: recipientMessage,
            buttons: closeOption,
            logger: true,
        });
    }
    await removeMessage(ctx);
    await commandAnswer(ctx, 'Показания счетчиков успешно отправлены');
}

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.submit}`, (ctx) => submitAction(ctx));
    bot.on('text', (ctx, next) => stepper ? stepper.inputHandler(ctx, next) : next());
};
