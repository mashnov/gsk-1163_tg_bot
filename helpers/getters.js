const { Markup } = require('telegraf');
const residents = require('../const/residents.json');

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

    if (first_name || last_name) {
        return profileName;
    } else if (username) {
        return username;
    } else {
        return id;
    }
}

const getUserNameLink = (data) => {
    const { username, first_name, last_name, id } = data;
    const profileName = `${first_name} ${last_name}`;
    const usernameHref = `https://t.me/${username}`;
    const userIdHref = `tg://user?id=${id}`;

    if (username && (first_name || last_name)) {
        return `<a href="${usernameHref}">${first_name} ${last_name}</a>`;
    } else if (username) {
        return `<a href="${usernameHref}">${username}</a>`;
    } else if (first_name || last_name) {
        return `<a href="${userIdHref}">${profileName}</a>`;
    } else if (id) {
        return `<a href="${userIdHref}">${id}</a>`;
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

const getNormalizeNumber = (text) => {
    return text.trim().replace(',', '.');
};

const getNormalizeString = (text) => {
    return text.trim().toLocaleLowerCase().replace(/Ё/g, 'е');
};

const getFormattedDate = (string) => {
    const date = new Date(string);
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    };
    return date.toLocaleString('ru-RU', options);
};

const getRoomOwner = (room) => {
    const ownerList = residents[room];
    return ownerList.length ? residents[room].join(', ') : 'Собственник не указан';
};

module.exports = {
    getButtons,
    getSummaryMessage,
    getMessageAttachment,
    getUserNameLink,
    getUserName,
    getMessageText,
    getNormalizeNumber,
    getNormalizeString,
    getFormattedDate,
    getRoomOwner,
};