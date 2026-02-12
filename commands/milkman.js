const cron = require('node-cron');

const { sendLocalFileMessage} = require('../helpers/telegraf');

const { homeChatId, homeTimeZone} = require('../const/env');
const { moduleNames } = require('../const/dictionary');

const moduleParam = {
    name: moduleNames.milkman,
    notification: 'notification',
    sendTime: [15],
};

const sendMilkMessage = async (ctx) => {
    const messageText =
        'Свежие молочные продукты уже в пути!' +
        '\n\nЗавтра <b>в 14:40</b> к нам снова заглянет молочник!' +
        '\n\nЧтобы всем всего хватило, пожалуйста, сообщите молочнику Ваш список заранее' +
        '\n\nКирилл: @KKL1994Z'

    await sendLocalFileMessage(ctx, {
        text: messageText,
        accountId: homeChatId,
        fileType: 'photo',
        buttons: {},
        filePath: './assets/milkman.jpg'
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
};
