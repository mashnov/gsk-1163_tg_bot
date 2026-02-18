const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getUserName } = require('../helpers/getters');
const { getUserData } = require('../helpers/db');
const { guard } = require('../helpers/guard');

const { botUsername, superUserId } = require('../const/env');
const { moduleNames } = require('../const/dictionary');
const { userStatusList } = require('../const/db');

const initAction = async (ctx) => {
    const isGuardPassed = await guard(ctx, { privateChat: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    const userData = await getUserData({ from: ctx.from });
    const isUnverified = userData?.userStatus === userStatusList.unverified || !userData?.userStatus;
    const isPending = userData?.userStatus === userStatusList.pending;
    const isBlocked = [userStatusList.blocked, userStatusList.restricted].includes(userData?.userStatus);
    const isResident = userData?.userStatus === userStatusList.resident;
    const isAdmin = [userStatusList.admin, userStatusList.accountant, userStatusList.chairman].includes(userData?.userStatus);
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
        buttons[moduleNames.messages] = '💬 Написать сообщение';
    }

    if (isPrivateChat && (isAdmin || isSuperUser)) {
        buttons[moduleNames.admin] = '🪪 Администрирование';
    }

    let messageText =
        `Привет, ${getUserName(ctx.from)}!` +
        '\n\nЯ <b>Домовёнок</b> - бот нашего дома.' +
        '\n\nЯ помогу тебе:' +
        '\n• Познакомиться с правилами';

    if (isPrivateChat && (isResident || isAdmin)) {
        messageText +=
            '\n• Познакомиться с правилами' +
            '\n• Найти нужный контакт' +
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

    await sendMessage(ctx, {
        text: messageText,
        buttons,
    });

    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const closeAction = async (ctx) => {
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

module.exports = (bot) => {
    bot.command('start', (ctx) => initAction(ctx));
    bot.action('start', (ctx) => initAction(ctx));
    bot.command('close', (ctx) => closeAction(ctx));
    bot.action('close', (ctx) => closeAction(ctx));
};
