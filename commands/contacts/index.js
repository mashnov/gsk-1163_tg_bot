const { initStore} = require('../../store');
const { sendMessage, removeMessage } = require('../../helpers');

const messageText =
        'Полезные телефоны и ссылки: \n\n'+
        '<a href="https://t.me/+79215594007">ЖСК 1163 Председатель</a>: <a href="tel:+79215594007">+7 (921) 559-40-07</a> \n' +
        '<a href="https://t.me/+79213216100">ЖСК 1163 Бухгалтер</a>: <a href="tel:+79213216100">+7 (921) 321-61-00</a> \n\n' +
        'ЖСК 1163 Дворник: <a href="tel:+79013130083">+7 (901) 313-00-83</a> \n\n' +
        'ЖСК 1163 телефон: <a href="tel:+79312107066">+7 (931) 210-70-66</a> \n' +
        'ЖСК 1163 email: <a href="mailto:gsk1163@mail.ru">gsk1163@mail.ru</a> \n\n' +
        'Проблемы в сфере ЖКХ: <a href="tel:004">004</a> \n' +
        'Водопроводчик: <a href="tel:+78129111515">911-15-15</a> \n' +
        'Домофон: <a href="tel:+78126120033">612-00-33</a> \n' +
        'Лифт <a href="tel:+78129111515">911-15-15</a> \n\n' +
        '<a href="https://t.me/news1163">Новостной канал</a> \n' +
        '<a href="https://t.me/chat1163">Чат жителей</a> \n\n' +
        '<a href="https://max.ru/join/WXnefLdd0qI3xONMvNrNGB3Yg_0BSJcrCz3qmyufAWU?clckid=ce28f0e7">ЖСК 1163 в MAX</a> \n' +
        '<a href="https://vk.com/gsk1163">ЖСК 1163 в Вконтакте</a> \n' +
        '<a href="https://chat.whatsapp.com/LJoRyuouIflACMnCZjTR5h?clckid=97cd2216">ЖСК 1163 в WhatsApp</a>';

const initAction = async (ctx, bot, needAnswer) => {
    initStore(ctx.from.id, 'contacts');
    if (needAnswer) {
        await ctx.answerCbQuery();
    }
    await sendMessage(ctx, { text: messageText });
    await removeMessage(ctx);
};

module.exports = (bot) => {
    bot.command('contact_start', async (ctx) => initAction(ctx, bot));
    bot.action('contact_start', async (ctx) => initAction(ctx, bot, true));
};
