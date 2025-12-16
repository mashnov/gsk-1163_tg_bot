const { getUserName } = require('../helpers/getters');
const { getDbData, getUserListByIndex } = require('../helpers/db');
const { sendMessage, removeMessage } = require('../helpers/message');

const { userRoleList, userRoleText, userStatusList } = require('../const/db');
const { backOption } = require('../const/dictionary');

const actionName = 'profiles';

const startAction = async (ctx, needAnswer) => {
    if (needAnswer) {
        await ctx.answerCbQuery();
    }

    const userData = await getDbData(ctx.from.id);
    const userRole = userData?.userRole;

    const buttons = {
        [`${actionName}:${userRoleList.chairman}:list`]: 'Список председателей',
        [`${actionName}:${userRoleList.accountant}:list`]: 'Список бухгалтеров',
        [`${actionName}:${userRoleList.admin}:list`]: 'Список администраторов',
        [`${actionName}:${userStatusList.verified}:list`]: 'Список ожидающих',
        [`${actionName}:${userStatusList.verified}:list`]: 'Список одобренных',
        [`${actionName}:${userStatusList.verified}:list`]: 'Список отклоненных',
    };

    const messageText =
        `Привет, ${ getUserName(ctx.from) }!\n\n` +
        `Роль: ${ userRoleText[userRole] }\n\n`;

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
    const userlist = await getUserListByIndex(listType);
    console.log({ listType, userlist });
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
