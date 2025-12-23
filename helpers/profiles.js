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

const makeUser = async (ctx, { chatId, userId } = {}) => {
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
    makeUser,
    banUserById,
    unbanUserById,
};
