const { Input } = require('telegraf');

const { getButtons, getFormattedDate } = require('../helpers/getters');
const { sleep } = require('../helpers/sleep');
const { messageLogger } = require('../helpers/logger');

const { homeOption, messageParams } = require('../const/dictionary');

const commandAnswer = async (ctx, messageText = '') => {
    if (!ctx?.callbackQuery) {
        return;
    }
    try {
        await ctx.answerCbQuery(messageText);
    } catch (error) {
        console.error({
            method: 'commandAnswer',
            date: getFormattedDate(),
            text: messageText,
            error: error.message,
        });
    }
};

const preventBotBlock = async () => {
    await sleep(250);
};

const sendMessage = async (ctx, { accountId = ctx.chat.id, text = '', buttons = homeOption, attachment, silent, logger }) => {
    await preventBotBlock();
    const messageButtons = getButtons(buttons);
    const params = {
        disable_notification: silent || ctx.chat?.type !== 'private',
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

    if (logger) {
        messageLogger({ from: ctx.from.id, to: accountId, text });
    }

    try {
        const message = await ctx.telegram[methods[attachment?.type]](accountId, attachment?.fileId || text, params);
        return message.message_id;
    } catch (error) {
        console.error({
            method: 'sendMessage',
            date: getFormattedDate(),
            text,
            accountId,
            error: error.message,
        });
    }
};

const sendLocalFileMessage = async (ctx, { accountId, text, buttons, filePath, fileContent, silent }) => {
    const attachment = {
        type: 'document',
        fileId: fileContent ? Input.fromBuffer(Buffer.from(fileContent, 'utf8'), 'export.csv') : Input.fromLocalFile(filePath),
    };
    return await sendMessage(ctx, { accountId, text, buttons, attachment, silent });
};

const setMessageReaction = async (ctx, { chatId, messageId, emoji = '👀' } = {}) => {
    await preventBotBlock();
    try {
        return await ctx.telegram.setMessageReaction(chatId, messageId, [{ type: 'emoji', emoji }]);
    } catch (error) {
        console.error({
            method: 'setMessageReaction',
            date: getFormattedDate(),
            text: emoji,
            error: error.message,
        });
    }
};

const removeMessage = async (ctx, { chatId, messageId } = {}) => {
    await preventBotBlock();
    try {
        if (chatId && messageId) {
            return await ctx.telegram.deleteMessage(chatId, messageId);
        } else {
            return await ctx.deleteMessage(messageId);
        }
    } catch (error) {
        console.error({
            method: 'removeMessage',
            date: getFormattedDate(),
            error: error.message,
        });
    }
};

const getFile = async (ctx, fileId) => {
    try {
        return await ctx.telegram.getFile(fileId);
    } catch (error) {
        console.error({
            method: 'getFile',
            date: getFormattedDate(),
            error: error.message,
        });
    }
};

const makeAdmin = async (ctx, { chatId, userId } = {}) => {
    try {
        await ctx.telegram.promoteChatMember(chatId, userId, {
            can_delete_messages: true,
            can_restrict_members: true,
            can_pin_messages: true,
        })
    } catch (error) {
        console.error({
            method: 'makeAdmin',
            date: getFormattedDate(),
            userId,
            error: error.message,
        });
    }
};

const demoteUser = async (ctx, { chatId, userId } = {}) => {
    try {
        await ctx.telegram.promoteChatMember(chatId, userId, {
            can_delete_messages: false,
            can_restrict_members: false,
            can_pin_messages: false,
        });
    } catch (error) {
        console.error({
            method: 'demoteUser',
            date: getFormattedDate(),
            userId,
            error: error.message,
        });
    }
};

const restrictUser = async (ctx, { chatId, userId } = {}) => {
    try {
        await ctx.telegram.restrictChatMember(chatId, userId, {
            permissions: {
                can_send_messages: false,
                can_send_photos: false,
                can_send_videos: false,
                can_send_documents: false,
                can_add_web_page_previews: false,
                can_send_polls: false,
            },
        });
    } catch (error) {
        console.error({
            method: 'restrictUser',
            date: getFormattedDate(),
            userId,
            error: error.message,
        });
    }
};

const unRestrictUser = async (ctx, { chatId, userId } = {}) => {
    try {
        await ctx.telegram.restrictChatMember(chatId, userId, {
            permissions: {
                can_send_messages: true,
                can_send_photos: true,
                can_send_videos: true,
                can_send_documents: true,
                can_add_web_page_previews: true,
                can_send_polls: true,
            }
        });
    } catch (error) {
        console.error({
            method: 'unRestrictUser',
            date: getFormattedDate(),
            userId,
            error: error.message,
        });
    }
};

const banUserById = async (ctx, { chatId, userId } = {}) => {
    try {
        await ctx.telegram.banChatMember(chatId, userId)
    } catch (error) {
        console.error({
            method: 'banUserById',
            date: getFormattedDate(),
            userId,
            error: error.message,
        });
    }
};

const unBanUserById = async (ctx, { chatId, userId } = {}) => {
    try {
        await ctx.telegram.unbanChatMember(chatId, userId)
    } catch (error) {
        console.error({
            method: 'unBanUserById',
            date: getFormattedDate(),
            userId,
            error: error.message,
        });
    }
};

module.exports = {
    commandAnswer,
    sendMessage,
    sendLocalFileMessage,
    setMessageReaction,
    removeMessage,
    getFile,
    makeAdmin,
    demoteUser,
    restrictUser,
    unRestrictUser,
    banUserById,
    unBanUserById,
};
