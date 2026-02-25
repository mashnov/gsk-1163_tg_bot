const cron = require('node-cron');

const { sendLocalFileMessage} = require('../helpers/telegraf');
const { isWinter} = require('../helpers/weather');

const { homeChatId, homeTimeZone} = require('../const/env');
const { moduleNames } = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.milkman,
    notification: 'notification',
    keywords: [/молочник/i, /vjkjxybr/i, /молоко/i, /vjkjrj/i],
    sendTime: [15],
};

const sendMilkMessage = async (ctx) => {
    const messageText =
        '<b>Уважаемые жители!</b>' +
        '\n\n<b>В пятницу <u>в 14:40</u></b> к нам снова приедет молочник!' +
        '\n\nДля того чтобы продукции хватило всем желающим и заказ был сформирован корректно, просьба заранее направить <a href="https://t.me/KKL1994Z">молочнику Кириллу</a> список необходимых позиций и объёмов.';

    await sendLocalFileMessage(ctx, {
        text: messageText,
        accountId: homeChatId,
        fileType: 'photo',
        filePath: `./assets/milkman/${isWinter() ? 'winter' : 'summer'}.png`,
        buttons: {}
    });
};

const cronAction = (bot) => {
    cron.schedule(
        `0 ${moduleParam.sendTime} * * 4`,
        async () => sendMilkMessage(bot),
        { timezone: homeTimeZone },
    );
};

module.exports = (bot) => {
    cronAction(bot);
    bot.hears(moduleParam.keywords, (ctx) => sendMilkMessage(ctx));
};
