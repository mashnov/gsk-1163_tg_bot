const { initStepper } = require('../helpers/stepper');
const { initStore, getSession } = require('../helpers/sessions');
const { getUserNameLink, getUserName, getFormattedDate, getSummaryMessage, getRoomOwner } = require('../helpers/getters');
const { getUserIndex, getUserData, setUserData, getVerificationIndexItem, setVerificationIndexItem } = require('../helpers/db');
const { sendMessage, removeMessage } = require('../helpers/message');
const { isValidOwner } = require('../helpers/validation');
const { getArrayFallback } = require('../helpers/array');
const { banUserById, unbanUserById } = require('../helpers/profiles');
const { guard } = require('../helpers/guard');

const { superUserId, homeChatId } = require('../const/env');
const { userStatusText, userStatusList } = require('../const/db');
const { backOption, closeOption, moduleNames} = require('../const/dictionary');
const { stepList } = require('../const/verification');

const moduleParam = {
    name: moduleNames.verification,
    init: 'init',
    start: 'start',
    submit: 'submit',
};

let stepper = undefined;

(async () => {
    stepper = initStepper({
        stepList,
        actionName: moduleParam.name,
        submitActions: {
            [`${moduleParam.name}:${moduleParam.submit}`]: 'Отправить ✅'
        },
    });
})();

const startAction = async (ctx, needAnswer) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, unBlocked: true });

    if (!isGuardPassed) {
        return;
    }

    const userData = await getUserData(ctx.from.id);
    const isUnverified = userData?.userStatus === userStatusList.undefined || !userData?.userStatus;
    const isPending = userData?.userStatus === userStatusList.pending;

    const messageText =
        `✨ Верификация\n\n` +
        `Ваш статус: ${ userStatusText[userData?.userStatus] }`;

    const userCreatedText = `\n\nДата регистрации профиля: ${ getFormattedDate(userData?.createdAt) }`;
    const userUpdateText = `\nПоследнее обновление профиля: ${ getFormattedDate(userData?.updatedAt) }`;

    const buttons = {};

    if (isUnverified) {
        buttons[`${moduleParam.name}:${moduleParam.init}`] = 'Начать верификацию ✨';
    }

    if (isPending) {
        buttons[`${moduleParam.name}:${moduleParam.start}`] = '🔃 Обновить статус';
    }

    await sendMessage(ctx, {
        text: messageText + userCreatedText + userUpdateText,
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
    const isGuardPassed = await guard(ctx, { privateChat: true, unBlocked: true });

    if (!isGuardPassed) {
        return;
    }

    initStore(ctx.from.id, moduleParam.name);

    await stepper.startHandler(ctx);
    await removeMessage(ctx);

    await ctx.answerCbQuery();
};

const submitAction = async (ctx) => {
    const senderMessage = '🟢 Ваш запрос отправлен';
    await sendMessage(ctx, { text: senderMessage });

    const accountId = ctx.from.id;
    const session = getSession(accountId);

    const recipientIcon = `${ isValidOwner(session.room, session.owner) ? '🟢' : '🔴'}`;
    const recipientHeader = `${ recipientIcon } Новый запрос авторизации\n\n`;
    const recipientResidentText = `Отправитель: ${ getUserNameLink(ctx.from) }\n`;
    const recipientOwnerText = `Собственник по документам: ${ getRoomOwner(session.room) }\n\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${ recipientHeader }${ recipientResidentText }${ recipientOwnerText }${ recipientText }`;

    const chairmanIdList = getArrayFallback(await getUserIndex(userStatusList.chairman), [superUserId]);
    const accountantIdList = getArrayFallback(await getUserIndex(userStatusList.accountant), chairmanIdList);
    const adminIdList = getArrayFallback(await getUserIndex(userStatusList.admin), accountantIdList);

    const messageList = [];

    for (const recipientAccountId of adminIdList) {
        const messageId = await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: recipientMessage,
            buttons: {
                [`${moduleParam.name}:${userStatusList.chairman}:${accountId}`]: `🟡 ${userStatusText.chairman}`,
                [`${moduleParam.name}:${userStatusList.accountant}:${accountId}`]: `🟡 ${userStatusText.accountant}`,
                [`${moduleParam.name}:${userStatusList.admin}:${accountId}`]: `🟡 ${userStatusText.admin}`,
                [`${moduleParam.name}:${userStatusList.resident}:${accountId}`]: `🟢 ${userStatusText.resident}`,
                [`${moduleParam.name}:${userStatusList.undefined}:${accountId}`]: '🔴 Отклонить',
                [`${moduleParam.name}:${userStatusList.blocked}:${accountId}`]: '⛔ Заблокировать',
            },
        });
        messageList.push({ chatId: recipientAccountId, messageId });
    }

    await setVerificationIndexItem(accountId, messageList);
    await removeMessage(ctx);
    await setUserData(accountId, {
        residentName: session.name,
        userName: getUserName(ctx.from),
        userStatus: userStatusList.pending,
        roomNumber: session.room,
        phoneNumber: session.phone,
    });
    await ctx.answerCbQuery('Запрос успешно отправлен!');
}

const validationHandler = async (ctx, userStatus, accountId) => {
    const adminIdList = getArrayFallback(await getUserIndex(userStatusList.admin), [superUserId]);
    const filteredAdminIdList = adminIdList.filter(adminId => ![String(ctx.from.id), accountId].includes(String(adminId)));

    const adminUserLink = getUserNameLink(ctx.from);
    const residentData = await getUserData(accountId);
    const residentLinkData = { id: accountId, first_name: residentData.userName };
    const residentUserLink = getUserNameLink(residentLinkData);

    for (const recipientAccountId of filteredAdminIdList) {
        const messageText = {
            [userStatusList.chairman]: `${adminUserLink} выдал права председателя ${residentUserLink}`,
            [userStatusList.accountant]: `${adminUserLink} выдал права бухгалтера ${residentUserLink}`,
            [userStatusList.admin]: `${adminUserLink} выдал права администратора ${residentUserLink}`,
            [userStatusList.resident]: `${adminUserLink} одобрил запрос верификации ${residentUserLink}`,
            [userStatusList.undefined]: `${adminUserLink} отклонил запрос верификации ${residentUserLink}`,
            [userStatusList.blocked]: `${adminUserLink} заблокировал ${residentUserLink}`,
        };

        await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: messageText[userStatus],
            buttons: closeOption,
        });
    }

    const validationText = {
        [userStatusList.chairman]: '🟢 Вам выданы права председателя!',
        [userStatusList.accountant]: '🟢 Вам выданы права бухгалтера!',
        [userStatusList.admin]: '🟢 Вам выданы права администратора!',
        [userStatusList.resident]: '🟢 Ваш запрос верификации одобрен!',
        [userStatusList.undefined]: '🔴 Ваш запрос верификации отклонен.',
        [userStatusList.blocked]: '⛔️ Вы были заблокированы.',
    };

    await sendMessage(ctx, {
        accountId,
        text: validationText[userStatus],
        buttons: closeOption,
    });

    await setUserData(accountId, { userStatus });

    const verificationMessages = await getVerificationIndexItem(accountId);
    for (const { chatId, messageId } of verificationMessages) {
        await removeMessage(ctx, { chatId, messageId });
    }
    await setVerificationIndexItem(accountId, []);

    if (userStatus === userStatusList.blocked) {
        await banUserById(ctx, { chatId: homeChatId, userId: accountId });
        await sendMessage(ctx, {
            accountId: homeChatId,
            text: `⛔️ Пользователь ${residentUserLink} заблокирован`,
            buttons: {},
        });
    }

    if (residentData?.userStatus === userStatusList.blocked && userStatus !== userStatusList.blocked) {
        await unbanUserById(ctx, { chatId: homeChatId, userId: accountId });
        await sendMessage(ctx, {
            accountId: homeChatId,
            text: `🟢 Пользователь ${residentUserLink} разблокирован`,
            buttons: {},
        });
    }

    await ctx.answerCbQuery('Запрос обработан');
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, userStatus, accountId] = data.split(':');

    if (action === moduleParam.name) {
        await validationHandler(ctx, userStatus, accountId);
    }

    return next();
}

module.exports = (bot) => {
    bot.command(`${moduleParam.name}:${moduleParam.start}`, async (ctx) => startAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.start}`, async (ctx) => startAction(ctx, true));
    bot.action(`${moduleParam.name}:${moduleParam.init}`, async (ctx) => initAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.submit}`, async (ctx) => submitAction(ctx));
    bot.on('text', async (ctx, next) => stepper.inputHandler(ctx, next));
    bot.on('callback_query', async (ctx, next) => callbackHandler(ctx, next));
};
