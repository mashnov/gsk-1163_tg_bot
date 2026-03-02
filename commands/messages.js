const { initStore, getSession } = require('../helpers/sessions');
const { sendLocalFileMessage, sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getUserIndex, getUserData, setStatisticsData } = require('../helpers/db');
const { getUserNameLink, getSummaryMessage } = require('../helpers/getters');
const { getArrayFallback } = require('../helpers/array');
const { startStepper } = require('../helpers/stepper');
const { guard } = require('../helpers/guard');

const { closeOption, moduleNames } = require('../const/dictionary');
const { stepList } = require('../const/messages');
const { superUserId } = require('../const/env');
const { userRoleList, userRoleText } = require('../const/db');

const moduleParam = {
    name: moduleNames.messages,
    submit: 'submit',
};

let stepper = undefined;

const initStepper = async () => {
    const chairmanIdList = await getUserIndex(userRoleList.chairman);
    const accountantIdList = await getUserIndex(userRoleList.accountant);
    const adminIdList = getArrayFallback(await getUserIndex(userRoleList.admin), [superUserId]);

    const submitActions = {};

    if (chairmanIdList.length) {
        submitActions[`${moduleParam.name}:${moduleParam.submit}:${userRoleList.chairman}`] = 'Отправить председателю';
    }

    if (accountantIdList.length) {
        submitActions[`${moduleParam.name}:${moduleParam.submit}:${userRoleList.accountant}`] = 'Отправить бухгалтеру';
    }

    if (adminIdList.length) {
        submitActions[`${moduleParam.name}:${moduleParam.submit}:${userRoleList.admin}`] = 'Отправить администратору';
    }

    stepper = startStepper({
        stepList,
        actionName: moduleParam.name,
        submitActions,
    });
};

const initAction = async (ctx) => {
    await commandAnswer(ctx);
    await setStatisticsData('message-start');

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

const submitAction = async (ctx, listType) => {
    await setStatisticsData(`message-submit:${listType}`);

    const senderText = '💬 Ваше сообщение отправлено.';
    await sendLocalFileMessage(ctx, {
        text: senderText,
        fileType: 'photo',
        filePath: `./assets/messages/preview.jpg`,
    });

    const session = getSession(ctx.from.id);
    const userData = await getUserData({ from: ctx.from });

    const recipientHeader = '💬 Новое сообщение\n\n';
    const recipientSender = `Отправитель: ${getUserNameLink(ctx.from)}\n\n`;
    const recipientProfileStatus = `Статус: ${ userRoleText[userData?.userStatus] }\n\n`;
    const recipientProfileName = `Имя отправителя: ${userData?.residentName}\n`;
    const recipientPhoneNumber = `Номер телефона: ${userData?.phoneNumber}\n`;
    const recipientRoomNumber = `Номер квартиры: ${userData?.roomNumber}\n\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = recipientHeader + recipientSender + recipientProfileStatus + recipientProfileName + recipientPhoneNumber + recipientRoomNumber + recipientText;

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
