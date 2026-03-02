const { getUserData, getUserIndex, getUserListByIndex } = require('../helpers/db');
const { getUserNameLink } = require('../helpers/getters');
const { sendLocalFileMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getPaginatedItems } = require('../helpers/array');
const { guard } = require('../helpers/guard');

const { moduleNames, homeOption } = require('../const/dictionary');
const { userRoleList, userRoleText } = require('../const/db');
const { profilesPageCount } = require('../const/env');

const moduleParam = {
    name: moduleNames.profiles,
    unverified: moduleNames.unverified,
    verification: moduleNames.verification,
    list: 'list',
    review: 'review',
};

const startAction = async (ctx) => {
    await commandAnswer(ctx);
    const isGuardPassed = await guard(ctx, { privateChat: true, admin: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        return;
    }

    const buttons = {
        [`${moduleParam.name}:${userRoleList.chairman}:${moduleParam.list}`]: `${userRoleText.chairman}`,
        [`${moduleParam.name}:${userRoleList.accountant}:${moduleParam.list}`]: `${userRoleText.accountant}`,
        [`${moduleParam.name}:${userRoleList.admin}:${moduleParam.list}`]: `${userRoleText.admin}`,
        [`${moduleParam.name}:${userRoleList.resident}:${moduleParam.list}`]: `${userRoleText.resident}`,
        [`${moduleParam.name}:${userRoleList.pending}:${moduleParam.list}`]: 'Ожидают проверки',
        [`${moduleParam.name}:${userRoleList.restricted}:${moduleParam.list}`]: 'Ограниченные',
        [`${moduleParam.name}:${userRoleList.blocked}:${moduleParam.list}`]: 'Заблокированные',
        [`${moduleParam.name}:${userRoleList.unverified}:${moduleParam.list}`]: `${userRoleText.unverified}`,
        [moduleNames.admin]: '⬅️ Назад',
        ...homeOption,
    };

    await sendLocalFileMessage(ctx, {
        text: '🪪 Управление профилями',
        fileType: 'photo',
        filePath: `./assets/admin/profile-list.jpg`,
        buttons,
    });
    await removeMessage(ctx);
};

const profileListHandler = async (ctx, listType, listIndex = '0') => {
    await commandAnswer(ctx);
    const profileList = await getUserIndex(listType);
    const filteredProfileList = profileList.filter(userId => userId !== String(ctx.from.id));
    const mappedProfileList = await getUserListByIndex(filteredProfileList);
    const sortedByRoom = mappedProfileList.sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber));
    const paginatedList = getPaginatedItems(sortedByRoom, Number(listIndex), profilesPageCount);

    const messageText =
        `🪪 Администрирование` +
        `\n\nСтатус: ${userRoleText[listType]}` +
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

    await sendLocalFileMessage(ctx, {
        text: messageText,
        fileType: 'photo',
        filePath: `./assets/admin/${listType}.jpg`,
        buttons: { ...buttons, ...homeOption, },
    });
    await removeMessage(ctx);
};

const profileReviewHandler = async (ctx, accountId, backParams) => {
    await commandAnswer(ctx);
    const userData = await getUserData({ id: accountId });
    const userLinkData = { id: accountId, first_name: userData.userName };
    const userLink = getUserNameLink(userLinkData);

    const messageText =
        `Детали профиля ${userData.residentName ?? '-'}\n\n` +
        `Телеграмм: ${userLink}\n` +
        `Номер телефона: ${userData.phoneNumber ?? '-'}\n` +
        `Номер квартиры: ${userData.roomNumber ?? '-'}\n`;

    const isUnverified = userData?.userStatus === userRoleList.unverified;

    const backButtonOption = {
        [`${moduleParam.name}:${backParams.split('_')[0]}:${moduleParam.list}:${backParams.split('_')[1]}`]: '⬅️ Назад'
    };

    const unverifiedOptions = {
        [`${moduleParam.unverified}:notification:${accountId}`]: '🪪 Запросить авторизацию',
        [`${moduleParam.verification}:${userRoleList.blocked}:${accountId}`]: '🔴 Заблокировать',
        ...backButtonOption,
    };

    const verifiedOptions = {
        [`${moduleParam.verification}:${userRoleList.chairman}:${accountId}`]: `🟡 ${userRoleText.chairman}`,
        [`${moduleParam.verification}:${userRoleList.accountant}:${accountId}`]: `🟡 ${userRoleText.accountant}`,
        [`${moduleParam.verification}:${userRoleList.admin}:${accountId}`]: `🟡 ${userRoleText.admin}`,
        [`${moduleParam.verification}:${userRoleList.resident}:${accountId}`]: `🟢 ${userRoleText.resident}`,
        [`${moduleParam.verification}:${userRoleList.restricted}:${accountId}`]: '🟠 Ограничить',
        [`${moduleParam.verification}:${userRoleList.blocked}:${accountId}`]: '🔴 Заблокировать',
        ...backButtonOption,
        ...homeOption,
    };

    await sendLocalFileMessage(ctx, {
        text: messageText,
        fileType: 'photo',
        filePath: `./assets/admin/profile-details.jpg`,
        buttons: isUnverified ? unverifiedOptions : verifiedOptions,
    });
    await removeMessage(ctx);
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
