const { sendMessage, removeMessage } = require('../helpers/message');
const { getUserData } = require('../helpers/db');

const { commandNames } = require('../const/dictionary');
const { userStatusList } = require('../const/db');

const initAction = async (ctx, bot, needAnswer) => {
    const userData = await getUserData(ctx.from.id);
    const isUnverified = userData?.userStatus === userStatusList.undefined || !userData?.userStatus;
    const isBlocked = userData?.userStatus === userStatusList.blocked;
    const isPending = userData?.userStatus === userStatusList.pending;
    const isResident = userData?.userStatus === userStatusList.resident;
    const isAdmin = [userStatusList.admin, userStatusList.accountant, userStatusList.chairman].includes(userData?.userStatus);
    const isPrivateChat = ctx.chat?.type === 'private';

    const buttons = {
        [commandNames.rules]: '📚 Правила',
        [commandNames.contact]: '📖 Контакты',
    };

    if ((isResident || isAdmin) && isPrivateChat) {
        buttons[commandNames.meter] = '〽️ Показания счетчиков';
    }

    if (isAdmin && isPrivateChat) {
        buttons[commandNames.profiles] = '🪪 Администрирование';
    }

    if ((isUnverified || isPending) && isPrivateChat) {
        buttons[commandNames.verification] = '✨ Верификация';
    }

    if (isBlocked && isPrivateChat) {
        buttons[commandNames.unblock] = '🫥 Разблокировка';
    }

    const messageText =
        '<b>Привет!</b>\n' +
        'Я <b>Домовёнок</b> - бот нашего дома.\n\n' +
        'Я помогу тебе:\n' +
        '• пройти верификацию\n' +
        '• найти нужный контакт\n' +
        '• передать показания счётчиков\n' +
        '• ознакомиться с правилами чата\n' +
        '• связаться с правлением или администратором';

    const notVerifiedMessage = '\n\n✨ <b>Пожалуйста, пройдите верификацию, чтобы получить доступ ко всем возможностям бота.</b>';
    const notPrivateMessage = '\n\n🔒 Передача показаний счётчиков и верификация пользователей для обеспечения сохранности персональных данных осуществляются <b>только в личном <a href="https://t.me/@help1163_bot">чате с ботом</a></b>.';

    const notVerifiedMessageText = isUnverified && isPrivateChat ? notVerifiedMessage : '';
    const notPrivateMessageText = !isPrivateChat ? notPrivateMessage : '';

    await sendMessage(ctx, {
        text: messageText + notVerifiedMessageText + notPrivateMessageText,
        buttons,
    });

    await removeMessage(ctx);

    if (needAnswer) {
        await ctx.answerCbQuery();
    }
};

const closeAction = async (ctx, bot, needAnswer) => {
    await removeMessage(ctx);

    if (needAnswer) {
        await ctx.answerCbQuery();
    }
};

module.exports = (bot) => {
    bot.command('start', async (ctx) => initAction(ctx, bot));
    bot.action('start', async (ctx) => initAction(ctx, bot, true));
    bot.command('close', async (ctx) => closeAction(ctx, bot));
    bot.action('close', async (ctx) => closeAction(ctx, bot, true));
};
