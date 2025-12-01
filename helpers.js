const isValidInteger = (text) => {
    return /^[0-9]+$/.test(text.trim());
}

const isValidFloat = (text) => {
    return /^[0-9]+([.,][0-9]+)?$/.test(text.trim());
}

const normalizeNumber = (text) => {
    return text.trim().replace(',', '.');
}

const getUserName = (data) => {
    const { username, first_name, last_name, id } = data;
    const profileName = `${first_name} ${last_name}`;
    const usernameHref = `https://t.me/${username}`;

    if (username && first_name && last_name) {
        return `<a href="${usernameHref}">${first_name} ${last_name}</a>`
    } else if (username) {
        return `<a href="${usernameHref}">${username}</a>`
    } else if (first_name && last_name) {
        return profileName;
    } else if (id) {
        return id;
    }

    return 'неизвестно';
};

module.exports = {
    isValidInteger,
    isValidFloat,
    normalizeNumber,
    getUserName,
};