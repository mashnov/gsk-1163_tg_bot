const { Input } = require('telegraf');

const { getButtons } = require('../helpers/getters');
const { sleep } = require('../helpers/sleep');

const { homeOption, messageParams } = require('../const/dictionary');

const commandAnswer = async (ctx, messageText = '') => {
    if (!ctx?.callbackQuery) {
        return;
    }
    try {
        await ctx.answerCbQuery(messageText);
    } catch (error) {
        console.error(error.message);
    }
};

const preventBotBlock = async () => {
    await sleep(250);
};

const sendMessage = async (ctx, { accountId = ctx.chat.id, text, filePath, buttons = homeOption, attachment, silent }) => {
    await preventBotBlock();
    const messageButtons = getButtons(buttons);
    const params = {
        disable_notification: silent || ctx.chat?.type !== 'private',
        caption: text,
        ...messageButtons,
        ...messageParams,
    };

    if (filePath) {
        try {
            const message = await ctx.replyWithDocument(Input.fromLocalFile(filePath), params);
            return message.message_id;
        } catch (error) {
            console.error(error.message);
        }
    }

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
    await preventBotBlock();
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

const makeAdmin = async (ctx, { chatId, userId } = {}) => {
    try {
        await ctx.telegram.promoteChatMember(chatId, userId, {
            can_delete_messages: true,
            can_restrict_members: true,
            can_pin_messages: true,
        })
    } catch (error) {
        console.error(error.message);
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
        console.error(error.message);
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
        console.error(error.message);
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
        console.error(error.message);
    }
};

const banUserById = async (ctx, { chatId, userId } = {}) => {
    try {
        await ctx.telegram.banChatMember(chatId, userId)
    } catch (error) {
        console.error(error.message);
    }
};

const unBanUserById = async (ctx, { chatId, userId } = {}) => {
    try {
        await ctx.telegram.unbanChatMember(chatId, userId)
    } catch (error) {
        console.error(error.message);
    }
};

module.exports = {
    commandAnswer,
    sendMessage,
    removeMessage,
    makeAdmin,
    demoteUser,
    restrictUser,
    unRestrictUser,
    banUserById,
    unBanUserById,
};
