const { sendLocalFileMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getUserName } = require('../helpers/getters');
const { getUserData } = require('../helpers/db');
const { guard } = require('../helpers/guard');

const { botUsername, superUserId } = require('../const/env');
const { moduleNames } = require('../const/dictionary');
const { userRoleList } = require('../const/db');

const moduleParam = {
    name: moduleNames.start,
    keywords: [/старт/i, /start/i, /cnfhm/i, /ыефке/i],
};

const initAction = async (ctx) => {
    await commandAnswer(ctx);
    const isGuardPassed = await guard(ctx, { privateChat: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        return;
    }

    const userData = await getUserData({ from: ctx.from });
    const isUnverified = userData?.userStatus === userRoleList.unverified || !userData?.userStatus;
    const isPending = userData?.userStatus === userRoleList.pending;
    const isBlocked = [userRoleList.blocked, userRoleList.restricted].includes(userData?.userStatus);
    const isResident = userData?.userStatus === userRoleList.resident;
    const isAdmin = [userRoleList.admin, userRoleList.accountant, userRoleList.chairman].includes(userData?.userStatus);
    const isSuperUser = superUserId === ctx?.from?.id;
    const isPrivateChat = ctx.chat?.type === 'private';

    const buttons = {
        [moduleNames.rules]: '📚 Правила',
        [moduleNames.contact]: '📖 Контакты',
    };

    if (isPrivateChat && (isUnverified || isPending)) {
        buttons[moduleNames.verification] = '🪪 Верификация';
    }

    if (isPrivateChat && isBlocked) {
        buttons[moduleNames.unblock] = '🫥 Разблокировка';
    }

    if (isPrivateChat && (isResident || isAdmin)) {
        buttons[moduleNames.weather] = '🌤️ Прогноз погоды';
        buttons[moduleNames.horoscope] = '💫 Личный Гороскоп';
        buttons[moduleNames.meter] = '〽️ Показания счетчиков';
    }

    if (isPrivateChat && (isAdmin || isSuperUser)) {
        buttons[moduleNames.admin] = '🪪 Администрирование';
    }

    let messageText =
        `Привет, ${getUserName(ctx.from)}!` +
        '\n\nЯ <b>Домовёнок</b> - бот нашего дома.' +
        '\n\nЯ помогу тебе:' +
        '\n• Познакомиться с правилами' +
        '\n• Найти нужный контакт';

    if (isPrivateChat && (isResident || isAdmin)) {
        messageText +=
            '\n• Узнать прогноз погоды' +
            '\n• Получить личный гороскоп' +
            '\n• Передать показания счётчиков';
    }

    if (isPrivateChat && isAdmin) {
        messageText +=
            '\n\n• Управлять пользователями' +
            '\n• Сделать резервную копию БД';
    }

    if (!isPrivateChat) {
        messageText +=
            `\n\n🔒 Передача показаний счётчиков и верификация пользователей для обеспечения сохранности персональных данных осуществляются <b>только в личном <a href="https://t.me/${botUsername}">чате с ботом</a></b>.`
    }

    if (isPrivateChat && isUnverified) {
        messageText +=
            '\n• Пройти верификацию' +
            '\n\n🪪 <b>Пожалуйста, пройдите верификацию, чтобы получить доступ ко всем возможностям бота.</b>'
    }

    if (isPrivateChat && isBlocked) {
        messageText +=
            '\n\n🔒 Доступ к чату временно ограничен. Чтобы продолжить работу с ботом, запустите процедуру снятия блокировки.';
    }

    await sendLocalFileMessage(ctx, {
        buttons,
        text: messageText,
        fileType: 'photo',
        filePath: `./assets/start/preview.jpg`,
    });

    if (isPrivateChat) {
        await removeMessage(ctx);
    }
};

const closeAction = async (ctx) => {
    await commandAnswer(ctx);
    await removeMessage(ctx);
};

module.exports = (bot) => {
    bot.hears(moduleParam.keywords, (ctx) => initAction(ctx, { isHearsAction: true }));
    bot.command('start', (ctx) => initAction(ctx));
    bot.action('start', (ctx) => initAction(ctx));
    bot.command('close', (ctx) => closeAction(ctx));
    bot.action('close', (ctx) => closeAction(ctx));
};
