const { initStepper } = require('../helpers/stepper');
const { initStore, getSession} = require('../helpers/sessions');
const { getUserNameLink, getUserName, getFormattedDate, getSummaryMessage, getRoomOwner } = require('../helpers/getters');
const { getDbData, updateUserData} = require('../helpers/db');
const { sendMessage, removeMessage } = require('../helpers/message');
const { isValidOwner } = require('../helpers/validation');

const { userStatusText, userStatusList, userRoleText, userRoleList} = require('../const/db');
const { backOption, accountList, accountIds} = require('../const/dictionary');
const { stepList } = require('../const/verification');

const moduleActionName = 'verification';
const rejectActionName = 'reject';

const stepper = initStepper({
    stepList,
    actionName: moduleActionName,
    submitActions: {
        [`${moduleActionName}_submit`]: 'Отправить ✅'
    },
});

const startAction = async (ctx, needAnswer) => {
    if (needAnswer) {
        await ctx.answerCbQuery();
    }

    const userData = await getDbData(ctx.from.id);

    const userStatus = userData?.userStatus;
    const userRole = userData?.userRole;
    const userUpdateDate = userData?.updatedAt;

    const buttons = {};

    if (userStatus === userStatusList.unverified || !userStatus) {
        buttons[`${moduleActionName}_init`] = 'Начать верификацию ✨';
    }

    if (userStatus === userStatusList.pending) {
        buttons[`${moduleActionName}_start`] = '🔃 Обновить статус';
    }

    const messageText =
        `Привет, ${ getUserName(ctx.from) }!\n\n` +
        `Роль: ${ userRoleText[userRole] }\n` +
        `Ваш статус: ${ userStatusText[userStatus] }`;

    const userUpdateText = userUpdateDate ? `\n\nПоследнее обновление профиля: ${ getFormattedDate(userUpdateDate) }` : '';

    await sendMessage(ctx, {
        text: messageText + userUpdateText,
        buttons: {
            ...buttons,
            ...backOption,
        },
    });
    await removeMessage(ctx);
};

const initAction = async (ctx) => {
    initStore(ctx.from.id, moduleActionName);
    await ctx.answerCbQuery();
    await stepper.startHandler(ctx);
    await removeMessage(ctx);
};

const submitAction = async (ctx, destination) => {
    await ctx.answerCbQuery();
    const accountId = ctx.from.id;
    const session = getSession(accountId);
    const validationIcon = `${ isValidOwner(session.room, session.owner) ? '🟢' : '🔴'}`;
    const headerText = `${ validationIcon } Новый запрос авторизации\n\n`;
    const userNameText = `Отправитель: ${ getUserNameLink(ctx.from) }\n`;
    const documentOwnerText = `Собственник по документам: ${ getRoomOwner(session.room) }\n\n`;
    const summaryText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${ headerText }${ userNameText }${ documentOwnerText }${ summaryText }`;
    const senderMessage = '🟢 Ваш запрос отправлен';
    await sendMessage(ctx, { text: senderMessage });
    await sendMessage(ctx, {
        accountId: accountIds[destination],
        text: recipientMessage,
        buttons: {
            [`${moduleActionName}:${userRoleList.chairman}:${accountId}`]: `🟡 ${ userRoleText.chairman }`,
            [`${moduleActionName}:${userRoleList.accountant}:${accountId}`]: `🟡 ${ userRoleText.accountant }`,
            [`${moduleActionName}:${userRoleList.admin}:${accountId}`]: `🟡 ${ userRoleText.admin }`,
            [`${moduleActionName}:${userRoleList.resident}:${accountId}`]: `🟢 ${ userRoleText.resident }`,
            [`${moduleActionName}:${rejectActionName}:${accountId}`]: '⛔ Отклонить',
        },
    });
    await removeMessage(ctx);
    await updateUserData(accountId, {
        profileName: session.name,
        userName: getUserName(ctx.from),
        userStatus: userStatusList.pending,
        roomNumber: session.room,
        phoneNumber: session.phone,
    });
}

const validationHandler = async (ctx, status, accountId) => {
    const isRejected = status === rejectActionName;
    const isResident = status === userRoleList.resident;
    const validationStatus = isRejected ? userStatusList.unverified : userStatusList.verified;
    const isAdminRules = !isRejected && !isResident;

    const validationText = {
        [userRoleList.chairman]: '🟢 Вы назначены председателем.\nВам выданы права администратора!',
        [userRoleList.accountant]: '🟢 Вы назначены бухгалтером.\nВам выданы права администратора!',
        [userRoleList.admin]: '🟢 Вам выданы права администратора!',
        [userRoleList.resident]: '🟢 Ваш запрос верификации одобрен!',
        [rejectActionName]: '🔴 Ваш запрос верификации отклонен.',
    };

    await sendMessage(ctx, {
        text: validationText[status],
        accountId,
        buttons: {
            [`${moduleActionName}_exit`]: 'Закрыть',
        },
    });

    await updateUserData(accountId, { userStatus: validationStatus });
    await updateUserData(accountId, { userIsAdmin: isAdminRules });

    if (!isRejected) {
        await updateUserData(accountId, { userRole: status });
    }
};

const callbackHandler = async (ctx, next) => {
    await ctx.answerCbQuery();
    const data = ctx.callbackQuery.data;
    const [action, status, accountId] = data.split(':');

    if (action === moduleActionName) {
        await validationHandler(ctx, status, accountId);
        await removeMessage(ctx);
    }

    return next();
}

module.exports = (bot) => {
    bot.command(`${moduleActionName}_start`, async (ctx) => startAction(ctx));
    bot.action(`${moduleActionName}_start`, async (ctx) => startAction(ctx, true));
    bot.action(`${moduleActionName}_init`, async (ctx) => initAction(ctx));
    bot.action(`${moduleActionName}_submit`, async (ctx) => submitAction(ctx, accountList.admin));
    bot.action(`${moduleActionName}_exit`, (ctx) => removeMessage(ctx, ));
    bot.on('text', async (ctx, next) => stepper.inputHandler(ctx, next));
    bot.on('callback_query', async (ctx, next) => callbackHandler(ctx, next));
};
