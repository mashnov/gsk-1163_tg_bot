const { startStepper } = require('../helpers/stepper');
const { initStore, getSession } = require('../helpers/sessions');
const { getUserNameLink, getSummaryMessage } = require('../helpers/getters');
const { getUserIndex, getUserData } = require('../helpers/db');
const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getArrayFallback } = require('../helpers/array');
const { guard } = require('../helpers/guard');

const { stepList } = require('../const/meter');
const { userStatusList } = require('../const/db');
const { closeOption, moduleNames } = require('../const/dictionary');
const { superUserId } = require('../const/env');

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
    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true });

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
}

const submitAction = async (ctx) => {
    const senderText = '🟢 Показания счетчиков успешно отправлены';
    await sendMessage(ctx, { text: senderText });

    const session = getSession(ctx.from.id);
    const userData = await getUserData(ctx.from.id);

    const recipientHeader = '🟡 Новые показания\n\n';
    const recipientSender = `Отправитель: ${ getUserNameLink(ctx.from) }\n\n`;
    const recipientResidentText = `Имя отправителя: ${ userData?.residentName }\n`;
    const recipientPhoneText = `Номер телефона: ${ userData?.phoneNumber }\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientResidentText}${recipientPhoneText}${recipientText}`;

    const chairmanIdList = getArrayFallback(await getUserIndex(userStatusList.chairman), [superUserId]);
    const adminIdList = getArrayFallback(await getUserIndex(userStatusList.admin), chairmanIdList);
    const accountantIdList = getArrayFallback(await getUserIndex(userStatusList.accountant), adminIdList);

    for (const recipientAccountId of accountantIdList) {
        await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: recipientMessage,
            buttons: closeOption
        });
    }
    await removeMessage(ctx);
    await commandAnswer(ctx, 'Показания счетчиков успешно отправлены');
}

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.submit}`, (ctx) => submitAction(ctx));
    bot.on('text', (ctx, next) => stepper.inputHandler(ctx, next));
};
