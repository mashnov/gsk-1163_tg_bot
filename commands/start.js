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

const notVerifiedMessageText = '\n\n✨ <b>Пожалуйста, пройдите верификацию, чтобы получить доступ ко всем возможностям бота.</b>';

const initAction = async (ctx, bot, needAnswer) => {
    const userData = await getDbData(ctx.from.id);
    const userStatus = userData?.userStatus;
    const isAdmin = userData?.userIsAdmin;
    const isVerified = userStatus === userStatusList.verified;

    const buttons = {
        contact_start: '📖 Контакты',
        rules_start: '📚 Правила чата',
    };

    if (!isVerified) {
        buttons.verification_start = '✨ Верификация';
    }

    if (isAdmin) {
        buttons.profiles_start = '🪪 Администрирование';
    }

    if (isVerified) {
        buttons.meter_start = '〽️ Показания счетчиков';
        buttons.messages_start = '💬 Написать сообщение';
    }

    await sendMessage(ctx, {
        text: isVerified ? messageText : messageText + notVerifiedMessageText,
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
