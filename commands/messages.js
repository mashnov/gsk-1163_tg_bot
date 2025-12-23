const { initStepper } = require('../helpers/stepper');
const { getUserIndex, getUserData } = require('../helpers/db');
const { initStore, getSession} = require('../helpers/sessions');
const { getUserNameLink, getSummaryMessage } = require('../helpers/getters');
const { sendMessage, removeMessage } = require('../helpers/message');
const { getArrayFallback } = require('../helpers/array');
const { guard } = require('../helpers/guard');

const { stepList } = require('../const/messages');
const { closeOption, moduleNames } = require('../const/dictionary');
const { userStatusList } = require('../const/db');
const { superUserId } = require('../const/env');

const moduleParam = {
    name: moduleNames.messages,
    start: 'start',
    submit: 'submit',
};

let stepper = undefined;

(async () => {
    const chairmanIdList = await getUserIndex(userStatusList.chairman);
    const accountantIdList = await getUserIndex(userStatusList.accountant);
    const adminIdList = getArrayFallback(await getUserIndex(userStatusList.admin), [superUserId]);

    const submitActions = {};

    if (chairmanIdList.length) {
        submitActions[`${moduleParam.name}:${moduleParam.submit}:${userStatusList.chairman}`] = 'Отправить председателю';
    }

    if (accountantIdList.length) {
        submitActions[`${moduleParam.name}:${moduleParam.submit}:${userStatusList.accountant}`] = 'Отправить бухгалтеру';
    }

    if (adminIdList.length) {
        submitActions[`${moduleParam.name}:${moduleParam.submit}:${userStatusList.admin}`] = 'Отправить администратору';
    }

    stepper = initStepper({
        stepList,
        actionName: moduleParam.name,
        submitActions,
    });
})();

const initAction = async (ctx, needAnswer) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true });

    if (needAnswer && !isGuardPassed) {
        await ctx.answerCbQuery();
    }

    if (!isGuardPassed) {
        return;
    }

    initStore(ctx.from.id, moduleParam.name);

    await stepper?.startHandler(ctx);
    await removeMessage(ctx);

    if (needAnswer) {
        await ctx.answerCbQuery();
    }
}

const submitAction = async (ctx, listType) => {
    const senderText = '🟢 Ваше сообщение отправлено.';
    await sendMessage(ctx, { text: senderText });

    const session = getSession(ctx.from.id);
    const userData = await getUserData(ctx.from.id);

    const recipientHeader = '🟡 Новое сообщение\n\n';
    const recipientSender = `Отправитель: ${ getUserNameLink(ctx.from) }\n\n`;
    const recipientProfileName = `Имя отправителя: ${ userData?.residentName }\n`;
    const recipientPhoneNumber = `Номер телефона: ${ userData?.phoneNumber }\n`;
    const recipientRoomNumber = `Номер квартиры: ${ userData?.roomNumber }\n\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientProfileName}${recipientPhoneNumber}${recipientRoomNumber}${recipientText}`;

    const userIdList = await getUserIndex(listType);

    for (const recipientAccountId of userIdList) {
        await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: recipientMessage,
            buttons: closeOption,
            attachment: session.attachment,
        });
    }

    await removeMessage(ctx);

    await ctx.answerCbQuery('Ваше сообщение отправлено');
}

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, actionName, listType] = data.split(':');

    if (action === moduleParam.name && actionName === moduleParam.submit) {
        await submitAction(ctx, listType);
    }

    return next();
};

module.exports = (bot) => {
    bot.command(`${moduleParam.name}:${moduleParam.start}`, (ctx) => initAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.start}`, (ctx) => initAction(ctx, true));
    bot.on('message', async (ctx, next) => stepper?.inputHandler(ctx, next));
    bot.on('callback_query', async (ctx, next) => callbackHandler(ctx, next));
};
