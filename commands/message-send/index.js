const { stepList } = require('./dictionary');

const { initStepper } = require('../../stepper');
const { accountIds, closeOption } = require('../../dictionary');
const { initStore, getSession} = require('../../store');
const { getUserName, getSummaryMessage, sendMessage, removeMessage } = require('../../helpers');

const actionName = 'message';

const submitActions = {
    message_submit_chairman: 'Отправить председателю',
    message_submit_accountant: 'Отправить бухгалтеру',
    message_submit_admin: 'Отправить администратору',
};

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

    const senderHeader = '🟢 Ваше сообщение отправлено.';
    await sendMessage(ctx, { text: senderHeader });

    const recipientHeader = '🟡 Новое сообщение\n';
    const recipientSender = `Отправитель: ${ getUserName(ctx.from) }\n\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientText}`;

    await sendMessage(ctx, {
        accountId: accountIds[destination],
        text: recipientMessage,
        buttons: closeOption,
        attachment: session.attachment,
    });

    await removeMessage(ctx);
}

module.exports = (bot) => {
    bot.command('message_start', (ctx) => initAction(ctx));
    bot.action('message_start', (ctx) => initAction(ctx, true));
    bot.action('message_submit_chairman', (ctx) => submitAction(ctx, 'chairman'));
    bot.action('message_submit_accountant', (ctx) => submitAction(ctx, 'accountant'));
    bot.action('message_submit_admin', (ctx) => submitAction(ctx, 'admin'));
    bot.on('message', async (ctx, next) => stepper.inputHandler(ctx, next));
};
