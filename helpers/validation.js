const { getMessageText, getMessageAttachment, getNormalizeNumber } = require('./getters');

const isValidMessage = (message) => {
    const text = getMessageText(message);
    const attachments = getMessageAttachment(message);
    return text.length || attachments;
};

const isValidText = (text, { min = 0 }) => text.trim().split(/\s+/).length >= min;

const isValidPhoneNumber = (text) => text.trim().length >= 7;

const isValidNumber = (text, { min = -Infinity, max = Infinity }, isInteger = false) => {
    const mappedString = ['-'].includes(text) ? '0' : getNormalizeNumber(text);
    const number = Number(mappedString);
    const isValidValue = min < number && max > number;
    const isValidFormat = isInteger ? /^[0-9]+$/.test(mappedString) : /^[0-9]+([.,][0-9]+)?$/.test(text.trim());
    return isValidValue && isValidFormat;
};

const isValidForwardMessage = (message) => {
    const isForwardedMessage = Boolean(message?.forward_from) || Boolean(message?.forward_from_chat);
    const isSelfForwarded = message.from.id === message?.forward_from?.id;
    return !isSelfForwarded && isForwardedMessage;
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
        case 'forward':
            return isValidForwardMessage(message);
        default:
            return true;
    }
};

module.exports = {
    validateMessage,
};