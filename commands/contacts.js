const { sendLocalFileMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getUserData, setStatisticsData } = require('../helpers/db');
const { guard } = require('../helpers/guard');

const { closeOption, moduleNames, homeOption} = require('../const/dictionary');
const { userRoleList } = require('../const/db');

const moduleParam = {
    name: moduleNames.contact,
    verification: moduleNames.verification,
    keywords: [/контакт/i, /rjynfrn/i, /contact/i, /сщтефсе/i],
}

const initAction = async (ctx, { isHearsAction } = {}) => {
    await commandAnswer(ctx);
    await setStatisticsData(isHearsAction ? 'contacts-hears' : 'contacts-get');
    const isGuardPassed = await guard(ctx, { publicChat: isHearsAction });

    if (!isGuardPassed) {
        return;
    }

    const userData = await getUserData({ from: ctx.from });
    const isResident = userData?.userStatus === userRoleList.resident;
    const isAdmin = [userRoleList.admin, userRoleList.accountant, userRoleList.chairman].includes(userData?.userStatus);
    const isPrivateChat = ctx.chat?.type === 'private';

    const isVerified = (isResident || isAdmin) && isPrivateChat;

    const baseMessageText =
        '📖 <b>Контакты</b>\n\n' +
        'ЖСК Еmail: <a href="mailto:gsk1163@mail.ru">gsk1163@mail.ru</a>\n' +
        'ЖСК Диспетчер: <a href="tel:+79312107066">+7 (931) 210-70-66</a>\n' +
        'Дворник: <a href="tel:+79013130083">+7 (901) 313-00-83</a>\n\n' +
        'Лифт <a href="tel:+78124907781">490-77-81</a>\n' +
        'Домофон: <a href="tel:+78126120033">612-00-33</a>\n' +
        'Водопроводчик: <a href="tel:+78129111515">911-15-15</a>\n\n' +
        '<a href="https://max.ru/join/WXnefLdd0qI3xONMvNrNGB3Yg_0BSJcrCz3qmyufAWU">MAX Чат</a>\n' +
        '<a href="https://max.ru/join/HwL3iKNVLwypWsiAmI1i9DSXtZQH3dG1Isj-JLQRSOM">MAX Новости</a>\n' +
        '<a href="https://t.me/+9qDJVP9IOZ1jNTdi">Телеграм Чат</a>\n' +
        '<a href="https://t.me/+85EWUusNepc2MjUy">Телеграм Новости</a>\n' +
        '<a href="https://vk.com/gsk1163">Вконтакте Новости</a>';

    const verifiedMessageText =
        '\n\nДля связи с Председателем, Бухгалтером или администраторами воспользуйтесь кнопкой "написать сообщение" ниже.';

    const unVerifiedMessageText =
        '\n\n<b>🪪 Пожалуйста, пройдите верификацию, чтобы получить доступ ко всем возможностям бота.</b>';

    const personalMessageText = baseMessageText + (isVerified ? verifiedMessageText : unVerifiedMessageText);
    const messageText = isHearsAction ? baseMessageText : personalMessageText;

    const buttons = {};

    if (isVerified) {
        buttons[moduleNames.messages] = '💬 Написать сообщение';
    } else {
        buttons[moduleNames.verification] = '🪪 Верификация';
    }

    await sendLocalFileMessage(ctx, {
        text: messageText,
        fileType: 'photo',
        filePath: `./assets/contacts/preview.jpg`,
        buttons: {
            ...(isPrivateChat ? buttons : {}),
            ...(isPrivateChat ? homeOption : {}),
            ...(!isPrivateChat ? closeOption : {}),
        },
    });

    if (isPrivateChat) {
        await removeMessage(ctx);
    }
};

module.exports = (bot) => {
    bot.hears(moduleParam.keywords, (ctx) => initAction(ctx, { isHearsAction: true }));
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
};
