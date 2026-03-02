const { sendMessage, removeMessage, commandAnswer, banUserById, unBanUserById, makeAdmin, demoteUser, restrictUser, unRestrictUser } = require('../helpers/telegraf');
const { getUserIndex, getUserData, setUserData, getVerificationIndexItem, setVerificationIndexItem, setStatisticsData } = require('../helpers/db');
const { getUserNameLink, getUserName, getSummaryMessage, getRoomOwner } = require('../helpers/getters');
const { initStore, getSession } = require('../helpers/sessions');
const { getArrayFallback } = require('../helpers/array');
const { startStepper } = require('../helpers/stepper');
const { guard } = require('../helpers/guard');

const { backOption, closeOption, moduleNames} = require('../const/dictionary');
const { superUserId, homeChatId, botUsername } = require('../const/env');
const { userRoleText, userRoleList } = require('../const/db');
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
    await commandAnswer(ctx);
    await setStatisticsData('verification-start');

    const isGuardPassed = await guard(ctx, { privateChat: true, unBlocked: true });
    if (!isGuardPassed) {
        await removeMessage(ctx);
        return;
    }

    const userData = await getUserData({ from: ctx.from });
    const isUnverified = userData?.userStatus === userRoleList.unverified || !userData?.userStatus;
    const isPending = userData?.userStatus === userRoleList.pending;

    const messageText =
        `🪪 Верификация\n\n` +
        `Ваш статус: ${userRoleText[userData?.userStatus]}`;

    const buttons = {};

    if (isUnverified) {
        buttons[`${moduleParam.name}:${moduleParam.init}`] = 'Начать верификацию 🪪';
    }

    if (isPending) {
        buttons[moduleParam.name] = '🔃 Обновить статус';
    }

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            ...buttons,
            ...backOption,
        },
    });
    await removeMessage(ctx);
};

const initAction = async (ctx) => {
    await commandAnswer(ctx);
    const isGuardPassed = await guard(ctx, { privateChat: true, unBlocked: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        return;
    }

    initStore({ accountId: ctx.from.id, chatId: ctx.chat.id, moduleName: moduleParam.name });

    await initStepper();
    await stepper?.startHandler(ctx);

    await removeMessage(ctx);
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

    const chairmanIdList = getArrayFallback(await getUserIndex(userRoleList.chairman), [superUserId]);
    const accountantIdList = getArrayFallback(await getUserIndex(userRoleList.accountant), chairmanIdList);
    const adminIdList = getArrayFallback(await getUserIndex(userRoleList.admin), accountantIdList);

    const messageList = [];

    for (const recipientAccountId of adminIdList) {
        const messageId = await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: recipientMessage,
            buttons: {
                [`${moduleParam.name}:${userRoleList.chairman}:${accountId}`]: `🟡 ${userRoleText.chairman}`,
                [`${moduleParam.name}:${userRoleList.accountant}:${accountId}`]: `🟡 ${userRoleText.accountant}`,
                [`${moduleParam.name}:${userRoleList.admin}:${accountId}`]: `🟡 ${userRoleText.admin}`,
                [`${moduleParam.name}:${userRoleList.resident}:${accountId}`]: `🟢 ${userRoleText.resident}`,
                [`${moduleParam.name}:${userRoleList.restricted}:${accountId}`]: '🟠 Ограничить',
                [`${moduleParam.name}:${userRoleList.blocked}:${accountId}`]: '🔴 Заблокировать',
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
        userStatus: userRoleList.pending,
        roomNumber: session.room,
        phoneNumber: session.phone,
    });
}

const submitAction = async (ctx) => {
    await setStatisticsData('verification-submit');

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
    const residentIsAdmin = [userRoleList.chairman, userRoleList.accountant, userRoleList.admin].includes(residentData?.userStatus);
    const residentIsRestricted = userRoleList.restricted === residentData?.userStatus;
    const residentIsBlocked = userRoleList.blocked === residentData?.userStatus;

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
    const residentIsAdmin = [userRoleList.chairman, userRoleList.accountant, userRoleList.admin].includes(userStatus);
    const residentIsRestricted = userRoleList.restricted === userStatus;
    const residentIsBlocked = userRoleList.blocked === userStatus;

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
    const adminIdList = getArrayFallback(await getUserIndex(userRoleList.admin), [superUserId]);
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
            [userRoleList.chairman]: `${adminUserLink} выдал права председателя ${residentDetailsText}`,
            [userRoleList.accountant]: `${adminUserLink} выдал права бухгалтера ${residentDetailsText}`,
            [userRoleList.admin]: `${adminUserLink} выдал права администратора ${residentDetailsText}`,
            [userRoleList.resident]: `${adminUserLink} одобрил запрос верификации ${residentDetailsText}`,
            [userRoleList.restricted]: `${adminUserLink} ограничил ${residentDetailsText}`,
            [userRoleList.blocked]: `${adminUserLink} заблокировал ${residentDetailsText}`,
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
    const residentIsBlocked = [userRoleList.restricted, userRoleList.blocked].includes(residentData?.userStatus);
    const residentWillBlocked = [userRoleList.blocked, userRoleList.restricted].includes(userStatus);

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
    const residentIsBlocked = userRoleList.blocked === userStatus;

    const validationText = {
        [userRoleList.chairman]: '🟢 Вам выданы права председателя!',
        [userRoleList.accountant]: '🟢 Вам выданы права бухгалтера!',
        [userRoleList.admin]: '🟢 Вам выданы права администратора!',
        [userRoleList.resident]: '🟢 Вам выданы права жителя!',
        [userRoleList.restricted]: '🟠 Вы были ограничены. Для снятия ограничений, пожалуйста, воспользуйтесь ботом.',
        [userRoleList.blocked]: '🔴 Вы были заблокированы. Для снятия ограничений, пожалуйста, воспользуйтесь ботом.',
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
