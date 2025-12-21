const { getUserName, getUserNameLink, getFormattedDate } = require('../helpers/getters');
const { getDbData, getUserListByIndex } = require('../helpers/db');
const { sendMessage, removeMessage } = require('../helpers/message');
const { guard } = require('../helpers/guard');

const { userRoleList, userRoleText, userStatusList, userStatusText } = require('../const/db');
const { backOption } = require('../const/dictionary');

const moduleActionName = 'profiles';
const verificationActionName = 'verification';
const rejectActionName = 'reject';
const listActionName = 'list';
const reviewActionName = 'review';

const startAction = async (ctx, needAnswer) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true, admin: true });

    if (!isGuardPassed) {
        return;
    }

    const userData = await getDbData(ctx.from.id);
    const userRole = userData?.userRole;

    const buttons = {
        [`${moduleActionName}:${userStatusList.pending}:${listActionName}`]: 'Ожидают проверки',
        [`${moduleActionName}:${userRoleList.resident}:${listActionName}`]: 'Жители',
        [`${moduleActionName}:${userRoleList.admin}:${listActionName}`]: 'Администраторы',
        [`${moduleActionName}:${userRoleList.accountant}:${listActionName}`]: 'Бухгалтер',
        [`${moduleActionName}:${userRoleList.chairman}:${listActionName}`]: 'Председатель',
    };

    const messageText =
        `👥 Администрирование \n\n` +
        `Имя профиля: ${ getUserName(ctx.from) }\n` +
        `Роль: ${ userRoleText[userRole] }`;

    await sendMessage(ctx, {
        text: messageText,
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

const profileListHandler = async (ctx, listType) => {
    const profileList = await getDbData(listType) || [];
    const filteredProfileList = profileList.filter(userId => userId !== String(ctx.from.id));
    const mappedProfileList = await getUserListByIndex(filteredProfileList);

    const messageText =
        `👥 Администрирование \n\n` +
        `Список профилей в статусе: ${userRoleText[listType] || userStatusText[listType]}`;

    const buttons = {};

    for (const userData of mappedProfileList) {
        buttons[`${moduleActionName}:${userData.accountId}:${reviewActionName}`] = userData.userName;
    }

    buttons[`${moduleActionName}_start`] = '⬅️ Назад';

    await sendMessage(ctx, {
        text: messageText,
        buttons,
    });

    await removeMessage(ctx);

    await ctx.answerCbQuery();
};

const profileReviewHandler = async (ctx, accountId) => {
    const userData = await getDbData(accountId);
    const userLinkData = { id: accountId, first_name: userData.userName };
    const userLink = getUserNameLink(userLinkData);

    const messageText =
        `Детали профиля ${ userLink }\n\n` +
        `Имя пользователя: ${userData.profileName}\n` +
        `Номер телефона: ${userData.phoneNumber}\n` +
        `Номер Квартиры: ${userData.roomNumber}\n\n` +
        `Профиль зарегистрирован: ${ getFormattedDate(userData.createdAt) } \n` +
        `Профиль обновлен: ${ getFormattedDate(userData.updatedAt) }`;

    const messageButtons = {
        [`${verificationActionName}:${userRoleList.chairman}:${accountId}:${moduleActionName}`]: `🟡 ${userRoleText.chairman}`,
        [`${verificationActionName}:${userRoleList.accountant}:${accountId}:${moduleActionName}`]: `🟡 ${userRoleText.accountant}`,
        [`${verificationActionName}:${userRoleList.admin}:${accountId}:${moduleActionName}`]: `🟡 ${userRoleText.admin}`,
        [`${verificationActionName}:${userRoleList.resident}:${accountId}:${moduleActionName}`]: `🟢 ${userRoleText.resident}`,
        [`${verificationActionName}:${rejectActionName}:${accountId}:${moduleActionName}`]: '⛔ Отклонить',
        [`${moduleActionName}_start`]: '⬅️ Назад',
    };

    await sendMessage(ctx, {
        text: messageText,
        buttons: messageButtons,
    });

    await removeMessage(ctx);

    await ctx.answerCbQuery();
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, params, actionName] = data.split(':');

    if (action === moduleActionName && actionName === listActionName) {
        await profileListHandler(ctx, params);
    }

    if (action === moduleActionName && actionName === reviewActionName) {
        await profileReviewHandler(ctx, params);
    }

    return next();
};

module.exports = (bot) => {
    bot.command(`${moduleActionName}_start`, async (ctx) => startAction(ctx));
    bot.action(`${moduleActionName}_start`, async (ctx) => startAction(ctx, true));
    bot.on('callback_query', async (ctx, next) => callbackHandler(ctx, next));
};
