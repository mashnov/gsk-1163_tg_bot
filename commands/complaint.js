const { initStore, getSession } = require('../helpers/sessions');
const { getUserIndex, setVerificationIndexItem, setStatisticsData } = require('../helpers/db');
const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getUserNameLink } = require('../helpers/getters');
const { getArrayFallback } = require('../helpers/array');
const { startStepper } = require('../helpers/stepper');
const { guard } = require('../helpers/guard');

const { closeOption, moduleNames } = require('../const/dictionary');
const { stepList } = require('../const/complaint');
const { superUserId } = require('../const/env');
const { userStatusList} = require('../const/db');

const moduleParam = {
    name: moduleNames.complaint,
    verification: moduleNames.verification,
    submit: 'submit',
};

let stepper = undefined;

const initStepper = async () => {
    stepper = startStepper({
        stepList,
        actionName: moduleParam.name,
        submitActions: {
            [`${moduleParam.name}:${moduleParam.submit}`]: 'Отправить ✅'
        },
    });
};

const initAction = async (ctx) => {
    await setStatisticsData('complain-start');

    const isGuardPassed = await guard(ctx, { privateChat: true, verify: true });

    if (!isGuardPassed) {
        await removeMessage(ctx);
        await commandAnswer(ctx);
        return;
    }

    initStore({ accountId: ctx.from.id, chatId: ctx.chat.id, moduleName: moduleParam.name });

    await initStepper();
    await stepper?.startHandler(ctx);

    await removeMessage(ctx);
    await commandAnswer(ctx);
};

const submitAction = async (ctx) => {
    await setStatisticsData('complain-submit');

    const senderText = '‼️ Ваша жалоба отправлена.';
    await sendMessage(ctx, { text: senderText });

    const session = getSession(ctx.from.id);

    const senderUserLink = getUserNameLink(ctx.from);

    const authorAccount = session.messageOrigin?.forward_origin?.sender_user;
    const authorUserLink = getUserNameLink(authorAccount);

    const recipientHeader = '‼️ Новая жалоба на сообщение\n\n';
    const recipientSender = `Отправитель: ${senderUserLink}\n`;
    const recipientAuthor = `Автор: ${authorUserLink}\n\n`;
    const recipientText = `Текст сообщения: ${session.messageOrigin.text}`;
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientAuthor}${recipientText}`;

    const chairmanIdList = getArrayFallback(await getUserIndex(userStatusList.chairman), [superUserId]);
    const accountantIdList = getArrayFallback(await getUserIndex(userStatusList.accountant), chairmanIdList);
    const adminIdList = getArrayFallback(await getUserIndex(userStatusList.admin), accountantIdList);

    const messageList = [];

    for (const adminAccountId of adminIdList) {
        const messageId = await sendMessage(ctx, {
            accountId: adminAccountId,
            text: recipientMessage,
            buttons: {
                [`${moduleParam.verification}:${userStatusList.restricted}:${authorAccount.id}`]: '🟠 Ограничить',
                [`${moduleParam.verification}:${userStatusList.blocked}:${authorAccount.id}`]: '🔴 Заблокировать',
                ...closeOption,
            },
            logger: true,
        });
        messageList.push({ chatId: adminAccountId, messageId });
    }

    await setVerificationIndexItem(authorAccount.id, messageList);

    await removeMessage(ctx);
    await commandAnswer(ctx, 'Запрос обработан');
}

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.submit}`, (ctx) => submitAction(ctx));
    bot.on('message', (ctx, next) => stepper ? stepper.inputHandler(ctx, next) : next());
};
