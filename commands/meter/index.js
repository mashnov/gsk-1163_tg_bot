const { stepList } = require('./dictionary');

const { initStepper } = require('../../stepper');
const { accountIds, closeOption } = require('../../dictionary');
const { initStore, getSession} = require('../../store');
const { getUserName, getSummaryMessage, sendMessage, removeMessage } = require('../../helpers');

const actionName = 'meter_send';

const submitActions = { meter_submit: 'Отправить' };

const stepper = initStepper({
    stepList,
    actionName,
    submitActions,
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
    bot.command('meter_start', (ctx) => initAction(ctx));
    bot.action('meter_start', (ctx) => initAction(ctx, true));
    bot.action('meter_submit', (ctx) => submitAction(ctx, 'accountant'));
    bot.on('text', async (ctx, next) => stepper.inputHandler(ctx, next));
};
