const { initStepper } = require('../helpers/stepper');
const { initStore, getSession} = require('../helpers/sessions');
const { getUserNameLink, getSummaryMessage } = require('../helpers/getters');
const { getDbData } = require('../helpers/db');
const { sendMessage, removeMessage } = require('../helpers/message');

const { stepList } = require('../const/meter');
const { userRoleList } = require('../const/db');
const { closeOption } = require('../const/dictionary');

const moduleActionName = 'meter';

const stepper = initStepper({
    stepList,
    actionName: moduleActionName,
    submitActions: {
        [`${moduleActionName}_submit`]: 'Отправить ✅'
    },
});

const initAction = async (ctx, needAnswer) => {
    initStore(ctx.from.id, moduleActionName);

    await stepper.startHandler(ctx);
    await removeMessage(ctx);

    if (needAnswer) {
        await ctx.answerCbQuery();
    }
}

const submitAction = async (ctx) => {
    const session = getSession(ctx.from.id);
    const userData = await getDbData(ctx.from.id);

    const headerText = '🟡 Новые показания\n\n';
    const userNameText = `Отправитель: ${ getUserNameLink(ctx.from) }\n\n`;
    const profileNameText = `Имя отправителя: ${ userData?.profileName }\n`;
    const phoneNumberText = `Номер телефона: ${ userData?.phoneNumber }\n`;
    const summaryText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${headerText}${userNameText}${profileNameText}${phoneNumberText}${summaryText}`;
    const senderMessage = '🟢 Показания счетчиков успешно отправлены';

    await sendMessage(ctx, { text: senderMessage });

    const userIdList = await getDbData(userRoleList.accountant);

    for (const accountId of userIdList) {
        await sendMessage(ctx, {
            accountId,
            text: recipientMessage,
            buttons: closeOption
        });
    }

    await removeMessage(ctx);

    await ctx.answerCbQuery('Показания счетчиков успешно отправлены');
}

module.exports = (bot) => {
    bot.command(`${moduleActionName}_start`, (ctx) => initAction(ctx));
    bot.action(`${moduleActionName}_start`, (ctx) => initAction(ctx, true));
    bot.action(`${moduleActionName}_submit`, (ctx) => submitAction(ctx));
    bot.on('text', async (ctx, next) => stepper.inputHandler(ctx, next));
};
