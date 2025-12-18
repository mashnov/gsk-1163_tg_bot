const { initStepper } = require('../helpers/stepper');
const { initStore, getSession } = require('../helpers/sessions');
const { getUserNameLink, getUserName, getFormattedDate, getSummaryMessage, getRoomOwner } = require('../helpers/getters');
const { getDbData, updateUserData, getVerificationIndexItem, setVerificationIndexItem } = require('../helpers/db');
const { sendMessage, removeMessage } = require('../helpers/message');
const { isValidOwner } = require('../helpers/validation');

const { userStatusText, userStatusList, userRoleText, userRoleList} = require('../const/db');
const { backOption} = require('../const/dictionary');
const { stepList } = require('../const/verification');

const moduleActionName = 'verification';
const rejectActionName = 'reject';

const superUserId = process.env.SUPER_USER_ID;

let stepper = undefined;

(async () => {
    stepper = initStepper({
        stepList,
        actionName: moduleActionName,
        submitActions: {
            [`${moduleActionName}_submit`]: 'Отправить ✅'
        },
    });
})();

const startAction = async (ctx, needAnswer) => {
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
        `✨ Верификация\n\n` +
        `${ getUserName(ctx.from) }!\n\n` +
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

    if (needAnswer) {
        await ctx.answerCbQuery();
    }
};

const initAction = async (ctx) => {
    initStore(ctx.from.id, moduleActionName);

    await stepper.startHandler(ctx);
    await removeMessage(ctx);

    await ctx.answerCbQuery();
};

const submitAction = async (ctx) => {
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

    const adminIdList = await getDbData(userRoleList.admin) || [superUserId];
    const messageList = [];

    for (const recipientAccountId of adminIdList) {
        const messageId = await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: recipientMessage,
            buttons: {
                [`${moduleActionName}:${userRoleList.chairman}:${accountId}:${moduleActionName}`]: `🟡 ${userRoleText.chairman}`,
                [`${moduleActionName}:${userRoleList.accountant}:${accountId}:${moduleActionName}`]: `🟡 ${userRoleText.accountant}`,
                [`${moduleActionName}:${userRoleList.admin}:${accountId}:${moduleActionName}`]: `🟡 ${userRoleText.admin}`,
                [`${moduleActionName}:${userRoleList.resident}:${accountId}:${moduleActionName}`]: `🟢 ${userRoleText.resident}`,
                [`${moduleActionName}:${rejectActionName}:${accountId}:${moduleActionName}`]: '⛔ Отклонить',
            },
        });
        messageList.push({ chatId: recipientAccountId, messageId });
    }

    await setVerificationIndexItem(accountId, messageList);

    await removeMessage(ctx);

    await updateUserData(accountId, {
        profileName: session.name,
        userName: getUserName(ctx.from),
        userStatus: userStatusList.pending,
        roomNumber: session.room,
        phoneNumber: session.phone,
    });

    await ctx.answerCbQuery('Запрос успешно отправлен!');
}

const validationHandler = async (ctx, userStatus, accountId, originModuleName) => {
    const adminIdList = await getDbData(userRoleList.admin) || [superUserId];
    const filteredAdminIdList = adminIdList.filter(adminId => ![String(ctx.from.id), accountId].includes(adminId));

    for (const recipientAccountId of filteredAdminIdList) {
        const adminUserLink = getUserNameLink(ctx.from);
        const residentData = await getDbData(accountId);
        const residentLinkData = { id: accountId, first_name: residentData.userName };
        const residentUserLink = getUserNameLink(residentLinkData);

        const messageText = {
            [userRoleList.chairman]: `${adminUserLink} выдал права председателя ${residentUserLink}`,
            [userRoleList.accountant]: `${adminUserLink} выдал права бухгалтера ${residentUserLink}`,
            [userRoleList.admin]: `${adminUserLink} выдал права администратора ${residentUserLink}`,
            [userRoleList.resident]: `${adminUserLink} одобрил запрос верификации ${residentUserLink}`,
            [rejectActionName]: `${adminUserLink} отклонил запрос верификации ${residentUserLink}`,
        };

        await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: messageText[userStatus],
            buttons: {
                [`${moduleActionName}_exit`]: 'Закрыть',
            }
        });
    }

    const isRejected = userStatus === rejectActionName;
    const isResident = userStatus === userRoleList.resident;
    const validationStatus = isRejected ? userStatusList.unverified : userStatusList.verified;
    const isAdminRules = !isRejected && !isResident;

    const validationText = {
        [userRoleList.chairman]: '🟢 Вам выданы права председателя!',
        [userRoleList.accountant]: '🟢 Вам выданы права бухгалтера!',
        [userRoleList.admin]: '🟢 Вам выданы права администратора!',
        [userRoleList.resident]: '🟢 Ваш запрос верификации одобрен!',
        [rejectActionName]: '🔴 Ваш запрос верификации отклонен.',
    };

    await sendMessage(ctx, {
        text: validationText[userStatus],
        accountId,
        buttons: {
            [`${moduleActionName}_exit`]: 'Закрыть',
        },
    });

    await updateUserData(accountId, { userStatus: validationStatus });
    await updateUserData(accountId, { userIsAdmin: isAdminRules });

    if (!isRejected) {
        await updateUserData(accountId, { userRole: userStatus });
    }

    if (originModuleName === moduleActionName) {
        const verificationMessages = await getVerificationIndexItem(accountId);

        for (const { chatId, messageId } of verificationMessages) {
            await removeMessage(ctx, { chatId, messageId });
        }

        await setVerificationIndexItem(accountId, []);
    }

    await ctx.answerCbQuery(isRejected ? 'Запрос отклонен' : 'Права успешно назначены');
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, userStatus, accountId, originModuleName] = data.split(':');

    if (action === moduleActionName) {
        await validationHandler(ctx, userStatus, accountId, originModuleName);
    }

    return next();
}

module.exports = (bot) => {
    bot.command(`${moduleActionName}_start`, async (ctx) => startAction(ctx));
    bot.action(`${moduleActionName}_start`, async (ctx) => startAction(ctx, true));
    bot.action(`${moduleActionName}_init`, async (ctx) => initAction(ctx));
    bot.action(`${moduleActionName}_submit`, async (ctx) => submitAction(ctx));
    bot.action(`${moduleActionName}_exit`, (ctx) => removeMessage(ctx, ));
    bot.on('text', async (ctx, next) => stepper.inputHandler(ctx, next));
    bot.on('callback_query', async (ctx, next) => callbackHandler(ctx, next));
};
