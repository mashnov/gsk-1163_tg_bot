const { sendMessage, removeMessage } = require('../helpers/message');
const { getDbData } = require('../helpers/db');

const { userStatusList } = require('../const/db');

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
const notPrivateMessage = '\n\n🔒 Передача показаний счётчиков и верификация пользователей для обеспечения сохранности персональных данных осуществляются только в личном чате с ботом.';

const initAction = async (ctx, bot, needAnswer) => {
    const userData = await getDbData(ctx.from.id);
    const userStatus = userData?.userStatus;
    const isAdmin = userData?.userIsAdmin;
    const isVerified = userStatus === userStatusList.verified;
    const isPrivateChat = ctx.chat?.type === 'private';

    const buttons = {
        contact_start: '📖 Контакты',
        rules_start: '📚 Правила',
    };

    if (!isVerified && isPrivateChat) {
        buttons.verification_start = '✨ Верификация';
    }

    if (isVerified && isAdmin && isPrivateChat) {
        buttons.profiles_start = '🪪 Администрирование';
    }

    if (isVerified && isPrivateChat) {
        buttons.meter_start = '〽️ Показания счетчиков';
        buttons.messages_start = '💬 Написать сообщение';
    }

    const notVerifiedMessageText = !isVerified && isPrivateChat ? notVerifiedMessage : '';
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
    bot.start((ctx) => initAction(ctx, bot));
    bot.command('start', async (ctx) => initAction(ctx, bot));
    bot.action('start', async (ctx) => initAction(ctx, bot, true));
    bot.command('close', async (ctx) => closeAction(ctx, bot));
    bot.action('close', async (ctx) => closeAction(ctx, bot, true));
};
