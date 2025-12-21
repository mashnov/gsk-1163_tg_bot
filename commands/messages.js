const { initStepper } = require('../helpers/stepper');
const { getDbData } = require('../helpers/db');
const { initStore, getSession} = require('../helpers/sessions');
const { getUserNameLink, getSummaryMessage } = require('../helpers/getters');
const { sendMessage, removeMessage } = require('../helpers/message');
const { guard } = require('../helpers/guard');

const { stepList } = require('../const/messages');
const { closeOption } = require('../const/dictionary');
const { userRoleList} = require('../const/db');

const moduleActionName = 'messages';
const submitActionName = 'submit';

let stepper = undefined;

(async () => {
    const chairmanIdList = await getDbData(userRoleList.chairman) || [];
    const accountantIdList = await getDbData(userRoleList.accountant) || [];
    const adminIdList = await getDbData(userRoleList.admin) || [];

    const submitActions = {};

    if (chairmanIdList.length) {
        submitActions[`${moduleActionName}:${submitActionName}:${userRoleList.chairman}`] = 'Отправить председателю';
    }

    if (accountantIdList.length) {
        submitActions[`${moduleActionName}:${submitActionName}:${userRoleList.accountant}`] = 'Отправить бухгалтеру';
    }

    if (adminIdList.length) {
        submitActions[`${moduleActionName}:${submitActionName}:${userRoleList.admin}`] = 'Отправить администратору';
    }

    stepper = initStepper({
        stepList,
        actionName: moduleActionName,
        submitActions,
    });
})();

const initAction = async (ctx, needAnswer) => {
    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true });

    if (!isGuardPassed) {
        return;
    }

    initStore(ctx.from.id, moduleActionName);

    await stepper?.startHandler(ctx);
    await removeMessage(ctx);

    if (needAnswer) {
        await ctx.answerCbQuery();
    }
}

const submitAction = async (ctx, listType) => {
    const session = getSession(ctx.from.id);
    const userData = await getDbData(ctx.from.id);

    const senderHeader = '🟢 Ваше сообщение отправлено.';
    await sendMessage(ctx, { text: senderHeader });

    const recipientHeader = '🟡 Новое сообщение\n\n';
    const recipientSender = `Отправитель: ${ getUserNameLink(ctx.from) }\n\n`;
    const recipientProfileName = `Имя отправителя: ${ userData?.profileName }\n`;
    const recipientPhoneNumber = `Номер телефона: ${ userData?.phoneNumber }\n`;
    const recipientRoomNumber = `Номер квартиры: ${ userData?.roomNumber }\n\n`;
    const recipientText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientProfileName}${recipientPhoneNumber}${recipientRoomNumber}${recipientText}`;

    const userIdList = await getDbData(listType);

    for (const recipientAccountId of userIdList) {
        await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: recipientMessage,
            buttons: closeOption,
            attachment: session.attachment,
        });
    }

    await removeMessage(ctx);

    await ctx.answerCbQuery('Ваше сообщение отправлено');
}

const callbackHandler = async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const [action, actionName, listType] = data.split(':');

    if (action === moduleActionName && actionName === submitActionName) {
        await submitAction(ctx, listType);
    }

    return next();
};

module.exports = (bot) => {
    bot.command(`${moduleActionName}_start`, (ctx) => initAction(ctx));
    bot.action(`${moduleActionName}_start`, (ctx) => initAction(ctx, true));
    bot.on('message', async (ctx, next) => stepper?.inputHandler(ctx, next));
    bot.on('callback_query', async (ctx, next) => callbackHandler(ctx, next));
};
