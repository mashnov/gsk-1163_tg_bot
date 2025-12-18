const { getButtons } = require('./getters');
const { homeOption, messageParams } = require('../const/dictionary');

const sendMessage = async (ctx, { accountId = ctx.chat.id, text, buttons = homeOption, attachment }) => {
    const messageButtons = getButtons(buttons);
    const params = {
        caption: text,
        ...messageButtons,
        ...messageParams,
    };

    const methods = {
        photo: 'sendPhoto',
        video: 'sendVideo',
        document: 'sendDocument',
        undefined: 'sendMessage',
    };

    try {
        const message = await ctx.telegram[methods[attachment?.type]](accountId, attachment?.fileId || text, params);
        return message.message_id;
    } catch (error) {
        console.error(error.message);
    }
};

const removeMessage = async (ctx, { chatId, messageId } = {}) => {
    try {
        if (chatId && messageId) {
            return await ctx.telegram.deleteMessage(chatId, messageId);
        } else {
            return await ctx.deleteMessage(messageId);
        }
    } catch (error) {
        console.error(error.message);
    }
};

module.exports = {
    sendMessage,
    removeMessage,
};