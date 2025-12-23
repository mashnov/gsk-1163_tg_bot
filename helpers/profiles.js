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
    banUserById,
    unbanUserById,
};
