const { getDbData } = require('../helpers/db');
const { sendMessage, removeMessage } = require('../helpers/message');

const { userStatusList } = require('../const/db');
const { backOption } = require('../const/dictionary');

const moduleActionName = 'contact';

const messageText =
        'Полезные телефоны и ссылки:\n\n' +
        'ЖСК email: <a href="mailto:gsk1163@mail.ru">gsk1163@mail.ru</a>\n' +
        'ЖСК телефон: <a href="tel:+79312107066">+7 (931) 210-70-66</a>\n\n' +
        'Водопроводчик: <a href="tel:+78129111515">911-15-15</a>\n' +
        'Дворник: <a href="tel:+79013130083">+7 (901) 313-00-83</a>\n\n' +
        'Лифт <a href="tel:+78129111515">911-15-15</a>\n' +
        'Домофон: <a href="tel:+78126120033">612-00-33</a>\n\n' +
        '<a href="https://t.me/chat1163">Чат жителей</a>\n\n' +
        '<a href="https://max.ru/join/WXnefLdd0qI3xONMvNrNGB3Yg_0BSJcrCz3qmyufAWU?clckid=ce28f0e7">Канал в MAX</a>\n' +
        '<a href="https://t.me/news1163">Канал в Телеграм</a>\n' +
        '<a href="https://chat.whatsapp.com/LJoRyuouIflACMnCZjTR5h?clckid=97cd2216">Канал в WhatsApp</a>\n' +
        '<a href="https://vk.com/gsk1163">Группа в Вконтакте</a>';

const verifiedMessageText = '\n\nДля связи с Председателем, Бухгалтером или администратором воспользуйтесь кнопкой "написать сообщение" ниже.';

const initAction = async (ctx, bot, needAnswer) => {
    if (needAnswer) {
        await ctx.answerCbQuery();
    }

    const userData = await getDbData(ctx.from.id);
    const userStatus = userData?.userStatus;
    const isVerified = userStatus === userStatusList.verified;

    const buttons = { ...backOption };

    if (isVerified) {
        buttons.buttons = 'Написать сообщение';
    }

    await sendMessage(ctx, {
        text: isVerified ? messageText + verifiedMessageText : messageText,
        buttons,
    });

    await removeMessage(ctx);
};

module.exports = (bot) => {
    bot.command(`${moduleActionName}_start`, async (ctx) => initAction(ctx, bot));
    bot.action(`${moduleActionName}_start`, async (ctx) => initAction(ctx, bot, true));
};
