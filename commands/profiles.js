const { getUserName, getUserNameLink, getFormattedDate } = require('../helpers/getters');
const { getUserData, getUserIndex, getUserListByIndex } = require('../helpers/db');
const { sendMessage, removeMessage } = require('../helpers/message');
const { guard } = require('../helpers/guard');

const { userStatusList, userStatusText } = require('../const/db');
const { homeOption, moduleNames } = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.profiles,
    verification: moduleNames.verification,
    list: 'list',
    review: 'review',
    start: 'start',
};

const startAction = async (ctx, needAnswer) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true, admin: true });

    if (needAnswer && !isGuardPassed) {
        await ctx.answerCbQuery();
    }

    if (!isGuardPassed) {
        return;
    }

    const userData = await getUserData(ctx.from.id);
    const userStatus = userData?.userStatus;

    const buttons = {
        [`${moduleParam.name}:${userStatusList.chairman}:${moduleParam.list}`]: `🟡 ${ userStatusText.chairman }`,
        [`${moduleParam.name}:${userStatusList.accountant}:${moduleParam.list}`]: `🟡 ${ userStatusText.accountant }`,
        [`${moduleParam.name}:${userStatusList.admin}:${moduleParam.list}`]: `🟡 ${ userStatusText.admin }`,
        [`${moduleParam.name}:${userStatusList.resident}:${moduleParam.list}`]: `🟢 ${ userStatusText.resident }`,
        [`${moduleParam.name}:${userStatusList.pending}:${moduleParam.list}`]: '⚪️️ Ожидают проверки',
        [`${moduleParam.name}:${userStatusList.restricted}:${moduleParam.list}`]: '🟠 Ограниченные',
        [`${moduleParam.name}:${userStatusList.blocked}:${moduleParam.list}`]: '⛔ Заблокированные',
    };

    const messageText =
        `🪪 Администрирование \n\n` +
        `Имя профиля: ${ getUserName(ctx.from) }\n` +
        `Статус: ${ userStatusText[userStatus] }`;

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            ...buttons,
            ...homeOption,
        },
    });
    await removeMessage(ctx);

    if (needAnswer) {
        await ctx.answerCbQuery();
    }
};

const profileListHandler = async (ctx, listType) => {
    const profileList = await getUserIndex(listType);
    const filteredProfileList = profileList.filter(userId => userId !== String(ctx.from.id));
    const mappedProfileList = await getUserListByIndex(filteredProfileList);

    const messageText =
        `👥 Администрирование \n\n` +
        `Список профилей в статусе: ${ userStatusText[listType] }`;

    const buttons = {};

    for (const userData of mappedProfileList) {
        buttons[`${moduleParam.name}:${userData.accountId}:${moduleParam.review}`] = userData.userName;
    }

    buttons[`${moduleParam.name}:${moduleParam.start}`] = '⬅️ Назад';

    await sendMessage(ctx, {
        text: messageText,
        buttons,
    });

    await removeMessage(ctx);

    await ctx.answerCbQuery();
};

const profileReviewHandler = async (ctx, accountId) => {
    const userData = await getUserData(accountId);
    const userLinkData = { id: accountId, first_name: userData.userName };
    const userLink = getUserNameLink(userLinkData);

    const messageText =
        `Детали профиля ${ userLink }\n\n` +
        `Имя жителя: ${userData.residentName}\n` +
        `Номер телефона: ${userData.phoneNumber}\n` +
        `Номер Квартиры: ${userData.roomNumber}\n\n` +
        `Профиль зарегистрирован: ${ getFormattedDate(userData.createdAt) } \n` +
        `Профиль обновлен: ${ getFormattedDate(userData.updatedAt) }`;

    const messageButtons = {
        [`${moduleParam.verification}:${userStatusList.chairman}:${accountId}`]: `🟡 ${userStatusText.chairman}`,
        [`${moduleParam.verification}:${userStatusList.accountant}:${accountId}`]: `🟡 ${userStatusText.accountant}`,
        [`${moduleParam.verification}:${userStatusList.admin}:${accountId}`]: `🟡 ${userStatusText.admin}`,
        [`${moduleParam.verification}:${userStatusList.resident}:${accountId}`]: `🟢 ${userStatusText.resident}`,
        [`${moduleParam.verification}:${userStatusList.undefined}:${accountId}`]: '🔴 Отклонить',
        [`${moduleParam.verification}:${userStatusList.restricted}:${accountId}`]: '🟠 Ограничить',
        [`${moduleParam.verification}:${userStatusList.blocked}:${accountId}`]: '⛔ Заблокировать',
        [`${moduleParam.name}:${moduleParam.start}`]: '⬅️ Назад',
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

    if (action === moduleParam.name && actionName === moduleParam.list) {
        await profileListHandler(ctx, params);
    }

    if (action === moduleParam.name && actionName === moduleParam.review) {
        await profileReviewHandler(ctx, params);
    }

    return next();
};

module.exports = (bot) => {
    bot.command(`${moduleParam.name}:${moduleParam.start}`, async (ctx) => startAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.start}`, async (ctx) => startAction(ctx, true));
    bot.on('callback_query', async (ctx, next) => callbackHandler(ctx, next));
};
