const { getUserData } = require('../helpers/db');
const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { setStatistics } = require('../helpers/statistics');

const { userStatusList } = require('../const/db');
const { closeOption, moduleNames, homeOption} = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.contact,
    keywords: ['контакты'],
}

const initAction = async (ctx, { isHearsAction }) => {
    setStatistics(isHearsAction ? 'contacts-hears' : 'contacts-get');

    const userData = await getUserData({ from: ctx.from });
    const isResident = userData?.userStatus === userStatusList.resident;
    const isAdmin = [userStatusList.admin, userStatusList.accountant, userStatusList.chairman].includes(userData?.userStatus);
    const isPrivateChat = ctx.chat?.type === 'private';

    const messagesIsAllowed = (isResident || isAdmin) && isPrivateChat;

    const messageText =
        '📖 Контакты\n\n' +
        'ЖСК email: <a href="mailto:gsk1163@mail.ru">gsk1163@mail.ru</a>\n' +
        'ЖСК телефон: <a href="tel:+79312107066">+7 (931) 210-70-66</a>\n' +
        'Дворник <a href="tel:+79013130083">+7 (901) 313-00-83</a>\n\n' +
        'Водопроводчик: <a href="tel:+78129111515">911-15-15</a>\n\n' +
        'Лифт <a href="tel:+78124907781">490-77-81</a>\n' +
        'Домофон: <a href="tel:+78126120033">612-00-33</a>\n\n' +
        '<a href="https://max.ru/join/WXnefLdd0qI3xONMvNrNGB3Yg_0BSJcrCz3qmyufAWU?clckid=ce28f0e7">Канал в MAX</a>\n' +
        '<a href="https://t.me/news1163">Канал в Телеграм</a>\n' +
        '<a href="https://chat.whatsapp.com/LJoRyuouIflACMnCZjTR5h?clckid=97cd2216">Канал в WhatsApp</a>\n' +
        '<a href="https://vk.com/gsk1163">Группа в Вконтакте</a>';

    const verifiedMessageText = '\n\nДля связи с Председателем, Бухгалтером, Дворником или администратором воспользуйтесь кнопкой "написать сообщение" ниже.';

    const buttons = {};

    if (messagesIsAllowed) {
        buttons[moduleNames.messages] = '💬 Написать сообщение';
    }

    await sendMessage(ctx, {
        text: messagesIsAllowed ? messageText + verifiedMessageText : messageText,
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
