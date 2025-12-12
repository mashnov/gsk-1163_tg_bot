const { initStore} = require('../helpers/sessions');
const { sendMessage, removeMessage } = require('../helpers/message');
const { cancelOption } = require('../const/dictionary');
const { getUserName, getFormattedDate } = require('../helpers/getters');
const { getUserStatus, getUserRole, getUserUpdateDate } = require('../helpers/db');
const { userStatusText, userStatusList, userRoleText } = require('../const/db');

const actionName = 'profile';

const initAction = async (ctx, bot, needAnswer) => {
    initStore(ctx.from.id, actionName);

    if (needAnswer) {
        await ctx.answerCbQuery();
    }

    const userStatus = await getUserStatus(ctx.from.id);
    const userRole = await getUserRole(ctx.from.id);
    const userUpdateDate = await getUserUpdateDate(ctx.from.id);


    const buttons = {};

    if (userStatus === userStatusList.unverified) {
        buttons.authorization_start = 'Пройти авторизацию';
    }

    if (userStatus === userStatusList.pending) {
        buttons[`${actionName}_start`] = 'Обновить';
    }

    if (userStatus === userStatusList.verified) {
        buttons.verification_start = 'Проверить пользователя';
        buttons.role_start = 'Изменить роль';
    }

    const messageText =
        `Привет, ${getUserName(ctx.from)}! \n\n` +
        `Роль: ${userRoleText[userRole]} \n` +
        `Ваш статус: ${userStatusText[userStatus]}\n\n` +
        `Последнее обновление профиля: ${ getFormattedDate(userUpdateDate) }`
    ;

    await sendMessage(ctx, {
        text: messageText,
        buttons: {
            ...buttons,
            ...cancelOption,
        },
    });
    await removeMessage(ctx);
};

module.exports = (bot) => {
    bot.command(`${actionName}_start`, async (ctx) => initAction(ctx, bot));
    bot.action(`${actionName}_start`, async (ctx) => initAction(ctx, bot, true));
};
