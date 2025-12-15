const { getUserName } = require('../helpers/getters');
const { getUserRole } = require('../helpers/db');
const { sendMessage, removeMessage } = require('../helpers/message');

const { userRoleList, userRoleText, userStatusList } = require('../const/db');
const { backOption } = require('../const/dictionary');

const actionName = 'profiles';

const startAction = async (ctx, needAnswer) => {
    if (needAnswer) {
        await ctx.answerCbQuery();
    }

    const userRole = await getUserRole(ctx.from.id);

    const buttons = {
        [`${actionName}:${userRoleList.chairman}:list`]: 'Список председателей',
        [`${actionName}:${userRoleList.accountant}:list`]: 'Список бухгалтеров',
        [`${actionName}:${userRoleList.admin}:list`]: 'Список администраторов',
        [`${actionName}:${userStatusList.verified}:list`]: '✨ Список верифицированных',
        [`${actionName}_start`]: '🔎 Поиск профиля',
    };

    const messageText =
        `Привет, ${ getUserName(ctx.from) }!\n\n` +
        `Роль: ${ userRoleText[userRole] }`;

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            ...buttons,
            ...backOption,
        },
    });
    await removeMessage(ctx);
};

const getListHandler = async (ctx, listType) => {
    console.log(listType);
};

const callbackHandler = async (ctx, next) => {
    await ctx.answerCbQuery();
    const data = ctx.callbackQuery.data;
    const [action, listType] = data.split(':');

    if (action === actionName) {
        await getListHandler(ctx, listType);
        await removeMessage(ctx);
    }

    return next();
}

module.exports = (bot) => {
    bot.command(`${actionName}_start`, async (ctx) => startAction(ctx));
    bot.action(`${actionName}_start`, async (ctx) => startAction(ctx, true));
    bot.on('callback_query', async (ctx, next) => callbackHandler(ctx, next));
};
