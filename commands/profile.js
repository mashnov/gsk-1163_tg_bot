const { stepList } = require('../const/profile');
const { initStepper } = require('../helpers/stepper');
const { accountIds } = require('../const/dictionary');
const { initStore, getSession} = require('../store');
const { getUserName, getSummaryMessage } = require('../helpers/getters');
const { sendMessage, removeMessage } = require('../helpers/message');
const { isValidOwner } = require('../helpers/validation');

const residents = require('../const/residents.json');

const actionName = 'profile';
const approveActionName = 'approve';
const rejectActionName = 'reject';

const stepper = initStepper({
    stepList,
    actionName,
    submitActions: {
        profile_submit: 'Отправить'
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
    const accountId = ctx.from.id;
    const session = getSession(accountId);
    const headerText = '🟡 Новый запрос авторизации\n\n';
    const userNameText = `Отправитель: ${ getUserName(ctx.from) }\n`;
    const validationText = `${ isValidOwner(session.room, session.owner) ? '🟢' : '🔴'}`;
    const documentOwnerText = `Собственник по документам: ${ residents[session.room].join(', ')} ${ validationText }\n\n`;
    const summaryText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${ headerText }${ userNameText }${ documentOwnerText }${ summaryText }`;
    const senderMessage = '🟢 Ваш запрос отправлен';
    await sendMessage(ctx, { text: senderMessage });
    await sendMessage(ctx, {
        accountId: accountIds[destination],
        text: recipientMessage,
        buttons: {
            [`${actionName}:${approveActionName}:${accountId}`]: 'Одобрить',
            [`${actionName}:${rejectActionName}:${accountId}`]: 'Отклонить',
        },
    });
    await removeMessage(ctx);
}

const profileChangeHandler = async (ctx, status, accountId) => {
    if (status === approveActionName) {
        await sendMessage(ctx, {
            text: '🟢 Ваш запрос авторизации принят!',
            accountId,
            buttons: {
                profile_exit: 'Закрыть',
            },
        });
    }
    if (status === rejectActionName) {
        await sendMessage(ctx, {
            text: '🔴 Ваш запрос авторизации отклонен.',
            accountId,
            buttons: {
                profile_exit: 'Закрыть',
            },
        });
    }
}

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, status, accountId] = data.split(':');

    if (action === actionName) {
        await profileChangeHandler(ctx, status, accountId);
        await removeMessage(ctx);
    }

    return next();
}

module.exports = (bot) => {
    bot.command('profile_start', (ctx) => initAction(ctx));
    bot.action('profile_start', (ctx) => initAction(ctx, true));
    bot.action('profile_submit', (ctx) => submitAction(ctx, 'admin'));
    bot.action('profile_exit', (ctx) => removeMessage(ctx, ));
    bot.on('text', async (ctx, next) => stepper.inputHandler(ctx, next));
    bot.on('callback_query', async (ctx, next) => callbackHandler(ctx, next));
};
