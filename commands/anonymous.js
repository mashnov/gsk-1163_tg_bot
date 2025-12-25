const { startStepper } = require('../helpers/stepper');
const { getUserIndex } = require('../helpers/db');
const { initStore, getSession } = require('../helpers/sessions');
const { getUserNameLink } = require('../helpers/getters');
const { sendMessage, removeMessage, commandAnswer } = require('../helpers/telegraf');
const { getArrayFallback } = require('../helpers/array');
const { guard } = require('../helpers/guard');

const { stepList } = require('../const/anonymous');
const { closeOption, moduleNames } = require('../const/dictionary');
const { homeChatId, superUserId} = require('../const/env');
const { userStatusList } = require('../const/db');

const moduleParam = {
    name: moduleNames.anonymous,
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
    const senderText = '🎭 Ваше сообщение отправлено.';
    await sendMessage(ctx, { text: senderText });

    const session = getSession(ctx.from.id);

    const recipientHeader = '🎭 Новое анонимное сообщение\n\n';
    const recipientSender = `Отправитель: ${ getUserNameLink(ctx.from) }\n\n`;
    const recipientText = `Сообщение: ${ session.message }`;
    const recipientMessage = `${recipientHeader}${recipientSender}${recipientText}`;


    const chairmanIdList = getArrayFallback(await getUserIndex(userStatusList.chairman), [superUserId]);
    const accountantIdList = getArrayFallback(await getUserIndex(userStatusList.accountant), chairmanIdList);
    const adminIdList = getArrayFallback(await getUserIndex(userStatusList.admin), accountantIdList);

    for (const recipientAccountId of adminIdList) {
        await sendMessage(ctx, {
            accountId: recipientAccountId,
            text: recipientMessage,
            buttons: closeOption,
        });
    }

    await sendMessage(ctx, {
        accountId: homeChatId,
        text: session.message,
        buttons: {},
    });

    await removeMessage(ctx);
    await commandAnswer(ctx, 'Ваше сообщение отправлено');
}

module.exports = (bot) => {
    bot.command(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(moduleParam.name, (ctx) => initAction(ctx));
    bot.action(`${moduleParam.name}:${moduleParam.submit}`, (ctx) => submitAction(ctx));
    bot.on('message', (ctx, next) => stepper ? stepper.inputHandler(ctx, next) : next());
};
