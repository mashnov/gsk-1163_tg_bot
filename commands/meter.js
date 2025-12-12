const { stepList } = require('../const/meter');

const { initStepper } = require('../helpers/stepper');
const { accountIds, closeOption } = require('../const/dictionary');
const { initStore, getSession} = require('../helpers/sessions');
const { getUserName, getSummaryMessage } = require('../helpers/getters');
const { sendMessage, removeMessage } = require('../helpers/message');

const actionName = 'meter';

const stepper = initStepper({
    stepList,
    actionName,
    submitActions: {
        [`${actionName}_submit`]: 'Отправить'
    },
});

const initAction = async (ctx, needAnswer) => {
    initStore(ctx.from.id, actionName);
    if (needAnswer) {
        await ctx.answerCbQuery();
    }
    await stepper.startHandler(ctx);
    await removeMessage(ctx);
}

const submitAction = async (ctx, destination) => {
    const session = getSession(ctx.from.id);
    const headerText = '🟡 Новые показания\n\n';
    const userNameText = `Отправитель: ${ getUserName(ctx.from) }\n\n`;
    const summaryText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${headerText}${userNameText}${summaryText}`;
    const senderMessage = '🟢 Успешно отправлено';
    await sendMessage(ctx, { text: senderMessage });
    await sendMessage(ctx, {
        accountId: accountIds[destination],
        text: recipientMessage,
        buttons: closeOption
    });
    await removeMessage(ctx);
}

module.exports = (bot) => {
    bot.command(`${actionName}_start`, (ctx) => initAction(ctx));
    bot.action(`${actionName}_start`, (ctx) => initAction(ctx, true));
    bot.action(`${actionName}_submit`, (ctx) => submitAction(ctx, 'accountant'));
    bot.on('text', async (ctx, next) => stepper.inputHandler(ctx, next));
};
