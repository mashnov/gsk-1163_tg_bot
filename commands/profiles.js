const { getUserName, getUserNameLink, getFormattedDate } = require('../helpers/getters');
const { getUserData, getUserIndex, getUserListByIndex } = require('../helpers/db');
const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getPaginatedItems } = require('../helpers/array');
const { guard } = require('../helpers/guard');

const { profilesPageCount } = require('../const/env');
const { userStatusList, userStatusText } = require('../const/db');
const { homeOption, moduleNames } = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.profiles,
    unverified: moduleNames.unverified,
    verification: moduleNames.verification,
    list: 'list',
    review: 'review',
};

const startAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const userData = await getUserData({ from: ctx.from });
    const userStatus = userData?.userStatus;

    const buttons = {
        [`${moduleParam.name}:${userStatusList.chairman}:${moduleParam.list}`]: `${userStatusText.chairman}`,
        [`${moduleParam.name}:${userStatusList.accountant}:${moduleParam.list}`]: `${userStatusText.accountant}`,
        [`${moduleParam.name}:${userStatusList.janitor}:${moduleParam.list}`]: `${userStatusText.janitor}`,
        [`${moduleParam.name}:${userStatusList.admin}:${moduleParam.list}`]: `${userStatusText.admin}`,
        [`${moduleParam.name}:${userStatusList.resident}:${moduleParam.list}`]: `${userStatusText.resident}`,
        [`${moduleParam.name}:${userStatusList.pending}:${moduleParam.list}`]: 'Ожидают проверки',
        [`${moduleParam.name}:${userStatusList.restricted}:${moduleParam.list}`]: 'Ограниченные',
        [`${moduleParam.name}:${userStatusList.blocked}:${moduleParam.list}`]: 'Заблокированные',
        [`${moduleParam.name}:${userStatusList.unverified}:${moduleParam.list}`]: `${userStatusText.unverified}`,
    };

    const messageText =
        `🪪 Администрирование \n\n` +
        `Имя профиля: ${getUserName(ctx.from)}\n` +
        `Статус: ${userStatusText[userStatus]}`;

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            ...buttons,
            ...homeOption,
        },
    });
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const profileListHandler = async (ctx, listType, listIndex = '0') => {
    const profileList = await getUserIndex(listType);
    const filteredProfileList = profileList.filter(userId => userId !== String(ctx.from.id));
    const mappedProfileList = await getUserListByIndex(filteredProfileList);
    const sortedProfileList = mappedProfileList.sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber));
    const paginatedList = getPaginatedItems(sortedProfileList, Number(listIndex), profilesPageCount);

    const messageText =
        `🪪 Администрирование` +
        `\n\nСтатус: ${userStatusText[listType]}` +
        `\nКоличество профилей: ${mappedProfileList.length}`;

    const buttons = {};

    for (const userData of paginatedList) {
        const { accountId, userName, roomNumber, residentName } = userData;

        const value = `${moduleParam.name}:${accountId}:${moduleParam.review}:${listType}_${listIndex}`;
        const name = residentName ?? userName ?? accountId;

        buttons[value] = roomNumber ? `КВ ${roomNumber} - ${name}` : name;
    }

    if (Number(listIndex) !== 0) {
        buttons[`${moduleParam.name}:${listType}:${moduleParam.list}:${Number(listIndex) - 1}`] = '⏮️ Предыдущий список';
    }

    if (Math.ceil(mappedProfileList.length / profilesPageCount) > Number(listIndex) + 1) {
        buttons[`${moduleParam.name}:${listType}:${moduleParam.list}:${Number(listIndex) + 1}`] = 'Следующий список ⏭️';
    }

    buttons[moduleParam.name] = '⬅️ Назад';

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            ...buttons,
            ...homeOption,
        },
    });
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const profileReviewHandler = async (ctx, accountId, backParams) => {
    const userData = await getUserData({ id: accountId });
    const userLinkData = { id: accountId, first_name: userData.userName };
    const userLink = getUserNameLink(userLinkData);

    const messageText =
        `Детали профиля ${userData.residentName ?? '-'}\n\n` +
        `Телеграмм: ${userLink}\n` +
        `Номер телефона: ${userData.phoneNumber ?? '-'}\n` +
        `Номер квартиры: ${userData.roomNumber ?? '-'}\n\n` +
        `Профиль зарегистрирован: ${getFormattedDate(userData.createdAt)} \n` +
        `Профиль обновлен: ${getFormattedDate(userData.updatedAt)}`;

    const isUnverified = userData?.userStatus === userStatusList.unverified;

    const backButtonOption = {
        [`${moduleParam.name}:${backParams.split('_')[0]}:${moduleParam.list}:${backParams.split('_')[1]}`]: '⬅️ Назад'
    };

    const unverifiedOptions = {
        [`${moduleParam.unverified}:notification:${accountId}`]: '🪪 Запросить авторизацию',
        [`${moduleParam.verification}:${userStatusList.blocked}:${accountId}`]: '🔴 Заблокировать',
        ...backButtonOption,
    };

    const verifiedOptions = {
        [`${moduleParam.verification}:${userStatusList.chairman}:${accountId}`]: `🟡 ${userStatusText.chairman}`,
        [`${moduleParam.verification}:${userStatusList.accountant}:${accountId}`]: `🟡 ${userStatusText.accountant}`,
        [`${moduleParam.verification}:${userStatusList.janitor}:${accountId}`]: `🟡 ${userStatusText.janitor}`,
        [`${moduleParam.verification}:${userStatusList.admin}:${accountId}`]: `🟡 ${userStatusText.admin}`,
        [`${moduleParam.verification}:${userStatusList.resident}:${accountId}`]: `🟢 ${userStatusText.resident}`,
        [`${moduleParam.verification}:${userStatusList.restricted}:${accountId}`]: '🟠 Ограничить',
        [`${moduleParam.verification}:${userStatusList.blocked}:${accountId}`]: '🔴 Заблокировать',
        ...backButtonOption,
    };

    await sendMessage(ctx, {
        text: messageText,
        buttons: isUnverified ? unverifiedOptions : verifiedOptions,
    });
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, params, actionName, listIndex] = data.split(':');

    if (action === moduleParam.name && actionName === moduleParam.list) {
        await profileListHandler(ctx, params, listIndex);
    }

    if (action === moduleParam.name && actionName === moduleParam.review) {
        await profileReviewHandler(ctx, params, listIndex);
    }

    return next();
};

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => startAction(ctx));
    bot.action(moduleParam.name, (ctx) => startAction(ctx));
    bot.on('callback_query', (ctx, next) => callbackHandler(ctx, next));
};
