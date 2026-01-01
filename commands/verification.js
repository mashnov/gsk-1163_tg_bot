const { startStepper } = require('../helpers/stepper');
const { initStore, getSession } = require('../helpers/sessions');
const { getUserNameLink, getUserName, getFormattedDate, getSummaryMessage, getRoomOwner } = require('../helpers/getters');
const { getUserIndex, getUserData, setUserData, getVerificationIndexItem, setVerificationIndexItem } = require('../helpers/db');
const { sendMessage, removeMessage, commandAnswer, banUserById, unBanUserById, makeAdmin, demoteUser, restrictUser, unRestrictUser } = require('../helpers/telegraf');
const { getArrayFallback } = require('../helpers/array');
const { guard } = require('../helpers/guard');

const { superUserId, homeChatId, botUsername } = require('../const/env');
const { userStatusText, userStatusList } = require('../const/db');
const { backOption, closeOption, moduleNames} = require('../const/dictionary');
const { stepList } = require('../const/verification');

const moduleParam = {
    name: moduleNames.verification,
    init: 'init',
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

const startAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, unBlocked: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const userData = await getUserData({ from: ctx.from });
    const isUnverified = userData?.userStatus === userStatusList.unverified || !userData?.userStatus;
    const isPending = userData?.userStatus === userStatusList.pending;

    const messageText =
        `🪪 Верификация\n\n` +
        `Ваш статус: ${userStatusText[userData?.userStatus]}`;

    const userCreatedText = `\n\nДата регистрации профиля: ${getFormattedDate(userData?.createdAt)}`;
    const userUpdateText = `\nПоследнее обновление профиля: ${getFormattedDate(userData?.updatedAt)}`;

    const buttons = {};

    if (isUnverified) {
        buttons[`${moduleParam.name}:${moduleParam.init}`] = 'Начать верификацию 🪪';
    }

    if (isPending) {
        buttons[moduleParam.name] = '🔃 Обновить статус';
    }

    await sendMessage(ctx, {
        text: messageText + userCreatedText + userUpdateText,
        buttons: {
            ...buttons,
            ...backOption,
        },
    });
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const initAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, unBlocked: true });

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

const sendResidentVerificationRequest = async (ctx) => {
    const senderMessage = '🪪 Ваш запрос отправлен';
    await sendMessage(ctx, { text: senderMessage });
};

const sendAdminVerificationRequest = async (ctx, session) => {
    const accountId = ctx.from.id;

    const recipientHeader = '🪪 Новый запрос авторизации\n\n';
    const recipientResidentText = `Отправитель: ${getUserNameLink(ctx.from)}\n`;
    const recipientOwnerText = `Собственник по документам: ${getRoomOwner(session.room)}\n\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${recipientHeader}${recipientResidentText}${recipientOwnerText}${recipientText}`;

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
                [`${moduleParam.name}:${userStatusList.restricted}:${accountId}`]: '🟠 Ограничить',
                [`${moduleParam.name}:${userStatusList.blocked}:${accountId}`]: '🔴 Заблокировать',
            },
        });
        messageList.push({ chatId: recipientAccountId, messageId });
    }

    await setVerificationIndexItem(accountId, messageList);
};

const setResidentVerificationRequest = async (ctx, session) => {
    await setUserData(ctx.from.id, {
        residentName: session.name,
        userName: getUserName(ctx.from),
        userStatus: userStatusList.pending,
        roomNumber: session.room,
        phoneNumber: session.phone,
    });
}

const submitAction = async (ctx) => {
    const session = getSession(ctx.from.id);

    await sendResidentVerificationRequest(ctx);
    await sendAdminVerificationRequest(ctx, session);
    await setResidentVerificationRequest(ctx, session);
    await removeMessage(ctx);
    await commandAnswer(ctx, 'Запрос успешно отправлен!');
};


const removeAdminVerificationMessages = async (ctx, accountId) => {
    const verificationMessages = await getVerificationIndexItem(accountId);

    for (const { chatId, messageId } of verificationMessages) {
        await removeMessage(ctx, { chatId, messageId });
    }

    await setVerificationIndexItem(accountId, []);
};

const removeResidentVerificationStatus = async (ctx, userStatus, accountId, residentData) => {
    const residentIsAdmin = [userStatusList.chairman, userStatusList.accountant, userStatusList.admin].includes(residentData?.userStatus);
    const residentIsRestricted = userStatusList.restricted === residentData?.userStatus;
    const residentIsBlocked = userStatusList.blocked === residentData?.userStatus;

    if (residentIsAdmin) {
        await demoteUser(ctx, { chatId: homeChatId, userId: accountId });
    }

    if (residentIsRestricted) {
        await unRestrictUser(ctx, { chatId: homeChatId, userId: accountId });
    }

    if (residentIsBlocked) {
        await unBanUserById(ctx, { chatId: homeChatId, userId: accountId });
    }
};


const setResidentVerificationStatus = async (ctx, userStatus, accountId) => {
    const residentIsAdmin = [userStatusList.chairman, userStatusList.accountant, userStatusList.admin].includes(userStatus);
    const residentIsRestricted = userStatusList.restricted === userStatus;
    const residentIsBlocked = userStatusList.blocked === userStatus;

    if (residentIsAdmin) {
        await makeAdmin(ctx, { chatId: homeChatId, userId: accountId });
    }

    if (residentIsRestricted) {
        await restrictUser(ctx, { chatId: homeChatId, userId: accountId });
    }

    if (residentIsBlocked) {
        await banUserById(ctx, { chatId: homeChatId, userId: accountId });
    }

    await setUserData(accountId, { userStatus });
};

const sendAdminVerificationNotification = async (ctx, userStatus, accountId, residentData) => {
    const adminIdList = getArrayFallback(await getUserIndex(userStatusList.admin), [superUserId]);
    const adminFilteredList = adminIdList.filter(adminId => ![String(ctx.from.id), accountId].includes(String(adminId)));
    const adminUserLink = getUserNameLink(ctx.from);

    const residentLinkData = { id: accountId, first_name: residentData.userName };
    const residentUserLink = getUserNameLink(residentLinkData);

    for (const adminId of adminFilteredList) {
        const residentDetailsText =
            `${residentUserLink}` +
            `\n\nФИО: ${residentData.residentName}` +
            `\nНомер телефона: ${residentData.phoneNumber}` +
            `\nНомер квартиры: ${residentData.roomNumber}`;

        const messageText = {
            [userStatusList.chairman]: `${adminUserLink} выдал права председателя ${residentDetailsText}`,
            [userStatusList.accountant]: `${adminUserLink} выдал права бухгалтера ${residentDetailsText}`,
            [userStatusList.admin]: `${adminUserLink} выдал права администратора ${residentDetailsText}`,
            [userStatusList.resident]: `${adminUserLink} одобрил запрос верификации ${residentDetailsText}`,
            [userStatusList.restricted]: `${adminUserLink} ограничил ${residentDetailsText}`,
            [userStatusList.blocked]: `${adminUserLink} заблокировал ${residentDetailsText}`,
        };

        await sendMessage(ctx, {
            accountId: adminId,
            text: messageText[userStatus],
            buttons: closeOption,
        });
    }
};

const sendChatVerificationNotification = async (ctx, userStatus, accountId, residentData) => {
    const residentLinkData = { id: accountId, first_name: residentData.userName };
    const residentUserLink = getUserNameLink(residentLinkData);
    const residentIsBlocked = [userStatusList.restricted, userStatusList.blocked].includes(residentData?.userStatus);
    const residentWillBlocked = [userStatusList.blocked, userStatusList.restricted].includes(userStatus);

    if (residentIsBlocked && !residentWillBlocked) {
        await sendMessage(ctx, {
            accountId: homeChatId,
            text: `🟢 С пользователя ${residentUserLink} сняты все ограничения`,
            buttons: {},
        });
    }

    if (!residentIsBlocked && residentWillBlocked) {
        await sendMessage(ctx, {
            accountId: homeChatId,
            text: `🟠 Пользователь ${residentUserLink} ограничен.\n\nДля снятия ограничений воспользуйтесь <a href="https://t.me/${botUsername}">ботом</a>.`,
            buttons: {},
        });
    }
};

const sendResidentVerificationNotification = async (ctx, userStatus, accountId) => {
    const residentIsBlocked = userStatusList.blocked === userStatus;

    const validationText = {
        [userStatusList.chairman]: '🟢 Вам выданы права председателя!',
        [userStatusList.accountant]: '🟢 Вам выданы права бухгалтера!',
        [userStatusList.admin]: '🟢 Вам выданы права администратора!',
        [userStatusList.resident]: '🟢 Вам выданы права жителя!',
        [userStatusList.restricted]: '🟠 Вы были ограничены. Для снятия ограничений, пожалуйста, воспользуйтесь ботом.',
        [userStatusList.blocked]: '🔴 Вы были заблокированы. Для снятия ограничений, пожалуйста, воспользуйтесь ботом.',
    };

    await sendMessage(ctx, {
        accountId,
        text: validationText[userStatus],
        buttons: {
            ...(residentIsBlocked ? { [moduleNames.unblock]: '🫥 Разблокировка' } : {}),
            ...closeOption,
        }
    });
};

const verificationHandler = async (ctx, userStatus, accountId) => {
    const residentData = await getUserData({ id: accountId });
    await removeResidentVerificationStatus(ctx, userStatus, accountId, residentData);
    await setResidentVerificationStatus(ctx, userStatus, accountId);
    await sendAdminVerificationNotification(ctx, userStatus, accountId, residentData);
    await sendChatVerificationNotification(ctx, userStatus, accountId, residentData);
    await sendResidentVerificationNotification(ctx, userStatus, accountId);
    await removeAdminVerificationMessages(ctx, accountId);
    await commandAnswer(ctx, 'Запрос обработан');
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, userStatus, accountId] = data.split(':');

    if (action === moduleParam.name) {
        await verificationHandler(ctx, userStatus, accountId);
    }

    return next();
}

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => startAction(ctx));
    bot.action(moduleParam.name, (ctx) => startAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.init}`, (ctx) => initAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.submit}`, (ctx) => submitAction(ctx));
    bot.on('text', (ctx, next) => stepper ? stepper.inputHandler(ctx, next) : next());
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};
