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
        'Завтра в 14:40 нас вновь посетит молочник!' +
        '\n\nЧтобы всем всего хватило, сформируйте, пожалуйста, список заранее.' +
        '\nЗаказы: @KKL1994Z'

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
