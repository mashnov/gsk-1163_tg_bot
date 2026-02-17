const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getUserData, setStatisticsData } = require('../helpers/db');

const { closeOption, moduleNames, homeOption} = require('../const/dictionary');
const { userStatusList } = require('../const/db');

const moduleParam = {
    name: moduleNames.contact,
    verification: moduleNames.verification,
    keywords: [/контакты/i],
}

const initAction = async (ctx, { isHearsAction } = {}) => {
    await setStatisticsData(isHearsAction ? 'contacts-hears' : 'contacts-get');

    const userData = await getUserData({ from: ctx.from });
    const isResident = userData?.userStatus === userStatusList.resident;
    const isAdmin = [userStatusList.admin, userStatusList.accountant, userStatusList.chairman].includes(userData?.userStatus);
    const isPrivateChat = ctx.chat?.type === 'private';

    const isVerified = (isResident || isAdmin) && isPrivateChat;

    const baseMessageText =
        '📖 Контакты\n\n' +
        'ЖСК email: <a href="mailto:gsk1163@mail.ru">gsk1163@mail.ru</a>\n' +
        'ЖСК телефон: <a href="tel:+79312107066">+7 (931) 210-70-66</a>\n' +
        'Дворник: <a href="tel:+79013130083">+7 (901) 313-00-83</a>\n\n' +
        'Водопроводчик: <a href="tel:+78129111515">911-15-15</a>\n\n' +
        'Лифт <a href="tel:+78124907781">490-77-81</a>\n' +
        'Домофон: <a href="tel:+78126120033">612-00-33</a>\n\n';

    const verifiedLinks =
        '<a href="https://t.me/+9qDJVP9IOZ1jNTdi">Телеграм Чат</a>\n' +
        '<a href="https://t.me/+85EWUusNepc2MjUy">Телеграм Новости</a>\n\n' +
        '<a href="https://max.ru/join/WXnefLdd0qI3xONMvNrNGB3Yg_0BSJcrCz3qmyufAWU">MAX Чат</a>\n\n' +
        '<a href="https://vk.com/gsk1163">Вконтакте Новости</a>';

    const unverifiedLinks =
        '<a href="https://t.me/+85EWUusNepc2MjUy">Телеграм Новости</a>\n' +
        '<a href="https://vk.com/gsk1163">Вконтакте Новости</a>';

    const unVerifiedMessageText =
        '\n\n<b>🪪 Пожалуйста, пройдите верификацию, чтобы получить доступ ко всем возможностям бота, а так же для получения ссылок на домовые чаты в телеграмм или макс.</b>';

    const verifiedMessageText =
        '\n\nДля связи с Председателем, Бухгалтером, Дворником или администраторами воспользуйтесь кнопкой "написать сообщение" ниже.';

    const messageText = baseMessageText + (isVerified ? verifiedLinks + verifiedMessageText : unverifiedLinks + unVerifiedMessageText);

    const buttons = {};

    if (isVerified) {
        buttons[moduleNames.messages] = '💬 Написать сообщение';
    } else {
        buttons[moduleNames.verification] = '🪪 Верификация';
    }

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            ...(isPrivateChat ? buttons : {}),
            ...(isPrivateChat ? homeOption : {}),
            ...(!isPrivateChat ? closeOption : {}),
        },
    });
    await removeMessage(ctx);
    await commandAnswer(ctx);
};

module.exports = (bot) => {
    bot.hears(moduleParam.keywords, (ctx) => initAction(ctx, { isHearsAction: true }));
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
};
