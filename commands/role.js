const { stepList } = require('../const/role');
const { initStepper } = require('../helpers/stepper');
const { initStore, getSession } = require('../helpers/sessions');
const { getUserName, getSummaryMessage } = require('../helpers/getters');
const { sendMessage, removeMessage } = require('../helpers/message');
const { updateUserData } = require('../helpers/db');
const { userRoleList, userRoleText } = require('../const/db');
const { accountIds} = require("../const/dictionary");

const actionName = 'role';

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

    const senderHeader = '🟢 Ваш запрос отправлен.';
    await sendMessage(ctx, { text: senderHeader });

    const recipientHeader = '🟡 Новый запрос смены роли\n\n';
    const recipientSender = `Отправитель: ${ getUserName(ctx.from) }\n\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientText}`;

    await sendMessage(ctx, {
        accountId: accountIds[destination],
        text: recipientMessage,
        buttons: {
            [`${actionName}:${userRoleList.chairman}:${accountId}`]: userRoleText.chairman,
            [`${actionName}:${userRoleList.accountant}:${accountId}`]: userRoleText.accountant,
            [`${actionName}:${userRoleList.admin}:${accountId}`]: userRoleText.admin,
            [`${actionName}:${userRoleList.resident}:${accountId}`]: userRoleText.resident,
        }
    });

    await removeMessage(ctx);
}

const roleChangeHandler = async (ctx, userRole, accountId) => {
    const roleText = {
        chairman: '🟢 Роль председателя назначена!',
        accountant: '🟢 Вам выданы права бухгалтера!',
        admin: '🟢 Вы назначены администратором!',
        resident: '🔴 Ваш запрос смены роли отклонен.',
    }
    await sendMessage(ctx, {
        text: roleText[userRole],
        accountId,
        buttons: {
            [`${actionName}_exit`]: 'Закрыть',
        },
    });
    await updateUserData(accountId, { userRole });
}

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, userRole, accountId] = data.split(':');

    if (action === actionName) {
        await roleChangeHandler(ctx, userRole, accountId);
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
