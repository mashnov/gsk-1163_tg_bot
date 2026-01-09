const { startStepper } = require('../helpers/stepper');
const { getUserIndex, getUserData } = require('../helpers/db');
const { initStore, getSession } = require('../helpers/sessions');
const { getUserNameLink, getSummaryMessage } = require('../helpers/getters');
const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getArrayFallback } = require('../helpers/array');
const { setStatistics } = require('../helpers/statistics');
const { guard } = require('../helpers/guard');

const { stepList } = require('../const/messages');
const { closeOption, moduleNames } = require('../const/dictionary');
const { userStatusList } = require('../const/db');
const { superUserId } = require('../const/env');

const moduleParam = {
    name: moduleNames.messages,
    submit: 'submit',
};

let stepper = undefined;

const initStepper = async () => {
    const chairmanIdList = await getUserIndex(userStatusList.chairman);
    const accountantIdList = await getUserIndex(userStatusList.accountant);
    const janitorIdList = await getUserIndex(userStatusList.janitor);
    const adminIdList = getArrayFallback(await getUserIndex(userStatusList.admin), [superUserId]);

    const submitActions = {};

    if (chairmanIdList.length) {
        submitActions[`${moduleParam.name}:${moduleParam.submit}:${userStatusList.chairman}`] = 'Отправить председателю';
    }

    if (accountantIdList.length) {
        submitActions[`${moduleParam.name}:${moduleParam.submit}:${userStatusList.accountant}`] = 'Отправить бухгалтеру';
    }

    if (janitorIdList.length) {
        submitActions[`${moduleParam.name}:${moduleParam.submit}:${userStatusList.janitor}`] = 'Отправить дворнику';
    }

    if (adminIdList.length) {
        submitActions[`${moduleParam.name}:${moduleParam.submit}:${userStatusList.admin}`] = 'Отправить администратору';
    }

    stepper = startStepper({
        stepList,
        actionName: moduleParam.name,
        submitActions,
    });
};

const initAction = async (ctx) => {
    setStatistics('message-start');

    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true });

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

const submitAction = async (ctx, listType) => {
    setStatistics(`message-submit:${listType}`);

    const senderText = '💬 Ваше сообщение отправлено.';
    await sendMessage(ctx, { text: senderText });

    const session = getSession(ctx.from.id);
    const userData = await getUserData({ from: ctx.from });

    const recipientHeader = '💬 Новое сообщение\n\n';
    const recipientSender = `Отправитель: ${getUserNameLink(ctx.from)}\n\n`;
    const recipientProfileName = `Имя отправителя: ${userData?.residentName}\n`;
    const recipientPhoneNumber = `Номер телефона: ${userData?.phoneNumber}\n`;
    const recipientRoomNumber = `Номер квартиры: ${userData?.roomNumber}\n\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientProfileName}${recipientPhoneNumber}${recipientRoomNumber}${recipientText}`;

    const userIdList = await getUserIndex(listType);

    for (const recipientAccountId of userIdList) {
        await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: recipientMessage,
            buttons: closeOption,
            attachment: session.attachment,
            logger: true,
        });
    }
    await removeMessage(ctx);
    await commandAnswer(ctx, 'Ваше сообщение отправлено');
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
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.on('message', (ctx, next) => stepper ? stepper.inputHandler(ctx, next) : next());
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};
