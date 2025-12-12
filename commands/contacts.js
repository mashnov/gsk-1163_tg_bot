const { initStore} = require('../helpers/sessions');
const { sendMessage, removeMessage } = require('../helpers/message');
const { cancelOption } = require('../const/dictionary');

const actionName = 'contact';

const messageText =
        'Полезные телефоны и ссылки: \n\n'+
        'ЖСК 1163 Телефон: <a href="tel:+79312107066">+7 (931) 210-70-66</a> \n' +
        'ЖСК 1163 email: <a href="mailto:gsk1163@mail.ru">gsk1163@mail.ru</a> \n\n' +
        'Водопроводчик: <a href="tel:+78129111515">911-15-15</a> \n' +
        'Дворник: <a href="tel:+79013130083">+7 (901) 313-00-83</a> \n\n' +
        'Проблемы в сфере ЖКХ: <a href="tel:004">004</a> \n' +
        'Домофон: <a href="tel:+78126120033">612-00-33</a> \n' +
        'Лифт <a href="tel:+78129111515">911-15-15</a> \n\n' +
        '<a href="https://t.me/news1163">Новостной канал</a> \n' +
        '<a href="https://t.me/chat1163">Чат жителей</a> \n\n' +
        '<a href="https://vk.com/gsk1163">Группа в Вконтакте</a> \n' +
        '<a href="https://max.ru/join/WXnefLdd0qI3xONMvNrNGB3Yg_0BSJcrCz3qmyufAWU?clckid=ce28f0e7">Канал в MAX</a> \n' +
        '<a href="https://chat.whatsapp.com/LJoRyuouIflACMnCZjTR5h?clckid=97cd2216">Канал в WhatsApp</a> \n \n' +
        'Для связи с Председателем, Бухгалтером или администратором воспользуйтесь кнопкой "написать сообщение" ниже.';

const initAction = async (ctx, bot, needAnswer) => {
    initStore(ctx.from.id, actionName);
    if (needAnswer) {
        await ctx.answerCbQuery();
    }
    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            messages_start: 'Написать сообщение',
            ...cancelOption,
        }
    });
    await removeMessage(ctx);
};

module.exports = (bot) => {
    bot.command(`${actionName}_start`, async (ctx) => initAction(ctx, bot));
    bot.action(`${actionName}_start`, async (ctx) => initAction(ctx, bot, true));
};
