const { Markup } = require('telegraf');
const { messageParams, cancelOption} = require('./dictionary');

const sendMessage = async (ctx, { accountId = ctx.chat.id, text, buttons = cancelOption, attachment }) => {
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

const removeMessage = async (ctx, messageId) => {
    try {
        await ctx.deleteMessage(messageId);
    } catch (error) {
        console.error(error.message);
    }
};

const getButtons = (options) => {
    const buttons = Object.entries(options).map(([action, label]) => {
        return [Markup.button.callback(String(label || action), String(action))];
    });
    return Markup.inlineKeyboard(buttons);
};

const getSummaryMessage = (template, values) => {
    return Object.entries(template).map(([key, text]) => `${text}${values[key] ?? ''}\n`).join('');
};

const getUserName = (data) => {
    const { username, first_name, last_name, id } = data;
    const profileName = `${first_name} ${last_name}`;
    const usernameHref = `https://t.me/${username}`;

    if (username && first_name && last_name) {
        return `<a href="${usernameHref}">${first_name} ${last_name}</a>`
    } else if (username) {
        return `<a href="${usernameHref}">${username}</a>`
    } else if (first_name || last_name) {
        return profileName;
    } else if (id) {
        return id;
    }

    return 'неизвестно';
};

const getMessageAttachment = (message) => {
    if (message.photo && message.photo.length > 0) {
        return {
            type: 'photo',
            fileId: message.photo[message.photo.length - 1].file_id,
            sizes: message.photo,
        };
    }

    if (message.video) {
        return {
            type: 'video',
            fileId: message.video.file_id,
            duration: message.video.duration,
            width: message.video.width,
            height: message.video.height,
        };
    }

    if (message.document) {
        return {
            type: 'document',
            fileId: message.document.file_id,
            fileName: message.document.file_name,
            mimeType: message.document.mime_type,
        };
    }
};


const getMessageText = (message) => {
    return (message?.text ?? message?.caption ?? '').trim();
};

const isValidMessage = (message) => {
    const text = getMessageText(message);
    const attachments = getMessageAttachment(message);
    return text.length || attachments;
};

const isValidText = (text, { min = 0 }) => text.trim().split(/\s+/).length >= min;

const isValidPhoneNumber = (text) => text.trim().length >= 7;

const isValidNumber = (text, { min = -Infinity, max = Infinity }, isInteger = false) => {
    const mappedString = ['-'].includes(text) ? '0' : normalizeNumber(text);
    const number = Number(mappedString);
    const isValidValue = min < number && max > number;
    const isValidFormat = isInteger ? /^[0-9]+$/.test(mappedString) : /^[0-9]+([.,][0-9]+)?$/.test(text.trim());
    return isValidValue && isValidFormat;
};

const normalizeNumber = (text) => {
    return text.trim().replace(',', '.');
};

const validateMessage = (message, stepValidation) => {
    const text = getMessageText(message);
    switch (stepValidation?.dataType) {
        case 'message':
            return isValidMessage(message);
        case 'text':
            return isValidText(text, stepValidation);
        case 'int':
            return isValidNumber(text, stepValidation, true);
        case 'float':
            return isValidNumber(text, stepValidation);
        case 'phone':
            return isValidPhoneNumber(text);
        default:
            return true;
    }
};

module.exports = {
    sendMessage,
    removeMessage,
    getSummaryMessage,
    getMessageAttachment,
    getUserName,
    getMessageText,
    validateMessage,
};