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

const unbanUserById = async (ctx, { chatId, userId } = {}) => {
    try {
        await ctx.telegram.unbanChatMember(chatId, userId)
    } catch (error) {
        console.error(error.message);
    }
};

module.exports = {
    makeAdmin,
    demoteUser,
    restrictUser,
    unRestrictUser,
    banUserById,
    unbanUserById,
};
