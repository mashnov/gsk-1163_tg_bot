const { stepList } = require('../const/authorization');
const { initStepper } = require('../helpers/stepper');
const { accountIds } = require('../const/dictionary');
const { initStore, getSession} = require('../helpers/sessions');
const { getUserName, getSummaryMessage } = require('../helpers/getters');
const { sendMessage, removeMessage } = require('../helpers/message');
const { isValidOwner } = require('../helpers/validation');
const { updateUserData } = require('../helpers/db');
const { userStatusList } = require('../const/db');

const residents = require('../const/residents.json');

const actionName = 'authorization';
const approveActionName = 'approve';
const rejectActionName = 'reject';

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
    await updateUserData(accountId, { userStatus: userStatusList.pending });
}

const profileChangeHandler = async (ctx, status, accountId) => {
    if (status === approveActionName) {
        await sendMessage(ctx, {
            text: '🟢 Ваш запрос авторизации принят!',
            accountId,
            buttons: {
                [`${actionName}_exit`]: 'Закрыть',
            },
        });
        await updateUserData(accountId, { userStatus: userStatusList.verified });
    }
    if (status === rejectActionName) {
        await sendMessage(ctx, {
            text: '🔴 Ваш запрос авторизации отклонен.',
            accountId,
            buttons: {
                [`${actionName}_exit`]: 'Закрыть',
            },
        });
        await updateUserData(accountId, { userStatus: userStatusList.unverified });
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
    bot.command(`${actionName}_start`, (ctx) => initAction(ctx));
    bot.action(`${actionName}_start`, (ctx) => initAction(ctx, true));
    bot.action(`${actionName}_submit`, (ctx) => submitAction(ctx, 'admin'));
    bot.action(`${actionName}_exit`, (ctx) => removeMessage(ctx, ));
    bot.on('text', async (ctx, next) => stepper.inputHandler(ctx, next));
    bot.on('callback_query', async (ctx, next) => callbackHandler(ctx, next));
};
