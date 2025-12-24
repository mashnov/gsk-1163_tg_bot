const { startStepper } = require('../helpers/stepper');
const { initStore, getSession } = require('../helpers/sessions');
const { getUserNameLink, getSummaryMessage } = require('../helpers/getters');
const { getUserIndex, getUserData, setVerificationIndexItem } = require('../helpers/db');
const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getArrayFallback } = require('../helpers/array');
const { guard } = require('../helpers/guard');

const { stepList } = require('../const/unblock');
const { userStatusText, userStatusList } = require('../const/db');
const { closeOption, moduleNames} = require('../const/dictionary');
const { superUserId } = require('../const/env');

const moduleParam = {
    name: moduleNames.unblock,
    verification: moduleNames.verification,
    submit: 'submit',
}

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
    const isGuardPassed = await guard(ctx, { blocked: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    initStore(ctx.from.id, moduleParam.name);
    await initStepper();

    await stepper.startHandler(ctx);
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const submitAction = async (ctx) => {
    const senderText = '🟢 Ваш запрос отправлен.';
    await sendMessage(ctx, { text: senderText });

    const accountId = ctx.from.id;
    const session = getSession(accountId);
    const userData = await getUserData(accountId);

    const recipientHeader = '🔴 Новый запрос разблокировки\n\n';
    const recipientSender = `Отправитель: ${ getUserNameLink(ctx.from) }\n\n`;
    const recipientRoomNumber = `Номер квартиры в БД: ${ userData?.roomNumber }\n`;
    const recipientProfileName = `Имя отправителя в БД: ${ userData?.residentName }\n`;
    const recipientPhoneNumber = `Номер телефона в БД: ${ userData?.phoneNumber }\n\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientProfileName}${recipientPhoneNumber}${recipientRoomNumber}${recipientText}`;

    const chairmanIdList = getArrayFallback(await getUserIndex(userStatusList.chairman), [superUserId]);
    const accountantIdList = getArrayFallback(await getUserIndex(userStatusList.accountant), chairmanIdList);
    const adminIdList = getArrayFallback(await getUserIndex(userStatusList.admin), accountantIdList);

    const messageButtons = {
        [`${moduleParam.name}:${userStatusList.chairman}:${accountId}`]: `🟡 ${userStatusText.chairman}`,
        [`${moduleParam.name}:${userStatusList.accountant}:${accountId}`]: `🟡 ${userStatusText.accountant}`,
        [`${moduleParam.name}:${userStatusList.admin}:${accountId}`]: `🟡 ${userStatusText.admin}`,
        [`${moduleParam.name}:${userStatusList.resident}:${accountId}`]: `🟢 ${userStatusText.resident}`,
        [`${moduleParam.name}:${userStatusList.restricted}:${accountId}`]: '🟠 Ограничить',
        [`${moduleParam.name}:${userStatusList.blocked}:${accountId}`]: '⛔ Заблокировать',
        ...closeOption,
    };

    const messageList = [];

    for (const recipientAccountId of adminIdList) {
        const messageId = await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: recipientMessage,
            buttons: messageButtons,
        });
        messageList.push({ chatId: recipientAccountId, messageId });
    }

    await setVerificationIndexItem(accountId, messageList);
    await removeMessage(ctx);
    await commandAnswer(ctx, 'Ваш запрос отправлен');
};

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.submit}`, (ctx) => submitAction(ctx));
    bot.on('text', (ctx, next) => stepper.inputHandler(ctx, next));
};
