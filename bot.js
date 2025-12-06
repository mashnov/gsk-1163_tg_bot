const { Telegraf } = require('telegraf');

const autoRemove = require('./auto-remove');
const startCommand = require('./commands/start');
const profileCommand = require('./commands/profile');
const contactsCommand = require('./commands/contacts');
const meterCommand = require('./commands/meter');
const messageSend = require('./commands/message-send');

function createBot() {
    const bot = new Telegraf(process.env.BOT_TOKEN);
    autoRemove(bot);
    startCommand(bot);
    profileCommand(bot);
    contactsCommand(bot);
    meterCommand(bot);
    messageSend(bot);
    return bot;
}

module.exports = { createBot };
