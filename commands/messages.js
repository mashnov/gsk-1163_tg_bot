const { initStepper } = require('../helpers/stepper');
const { initStore, getSession} = require('../helpers/sessions');
const { getUserNameLink, getSummaryMessage } = require('../helpers/getters');
const { sendMessage, removeMessage } = require('../helpers/message');

const { stepList } = require('../const/messages');
const { accountList, accountIds, closeOption } = require('../const/dictionary');

const moduleActionName = 'messages';

const stepper = initStepper({
    stepList,
    actionName: moduleActionName,
    submitActions: {
        [`${moduleActionName}_submit_chairman`]: 'Отправить председателю',
        [`${moduleActionName}_submit_accountant`]: 'Отправить бухгалтеру',
        [`${moduleActionName}_submit_admin`]: 'Отправить администратору',
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

const submitAction = async (ctx, destination) => {
    const session = getSession(ctx.from.id);

    const senderHeader = '🟢 Ваше сообщение отправлено.';
    await sendMessage(ctx, { text: senderHeader });

    const recipientHeader = '🟡 Новое сообщение\n';
    const recipientSender = `Отправитель: ${ getUserNameLink(ctx.from) }\n\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientText}`;

    await sendMessage(ctx, {
        accountId: accountIds[destination],
        text: recipientMessage,
        buttons: closeOption,
        attachment: session.attachment,
    });

    await removeMessage(ctx);

    await ctx.answerCbQuery('Ваше сообщение отправлено');
}

module.exports = (bot) => {
    bot.command(`${moduleActionName}_start`, (ctx) => initAction(ctx));
    bot.action(`${moduleActionName}_start`, (ctx) => initAction(ctx, true));
    bot.action(`${moduleActionName}_submit_chairman`, (ctx) => submitAction(ctx, accountList.chairman));
    bot.action(`${moduleActionName}_submit_accountant`, (ctx) => submitAction(ctx, accountList.accountant));
    bot.action(`${moduleActionName}_submit_admin`, (ctx) => submitAction(ctx, accountList.admin));
    bot.on('message', async (ctx, next) => stepper.inputHandler(ctx, next));
};
