const { Telegraf } = require('telegraf');

const startCommand = require('./commands/start');
const rulesCommand = require('./commands/rules');
const contactsCommand = require('./commands/contacts');
const verificationCommand = require('./commands/verification');
const profilesCommand = require('./commands/profiles');
const meterCommand = require('./commands/meter');
const messagesCommand = require('./commands/messages');
const unblockCommand = require('./commands/unblock');

const { botToken } = require('./const/env');

const createBot = () => {
    const bot = new Telegraf(botToken);

    startCommand(bot);
    rulesCommand(bot);
    contactsCommand(bot);
    verificationCommand(bot);
    profilesCommand(bot);
    meterCommand(bot);
    messagesCommand(bot);
    unblockCommand(bot);

    return bot;
}

const bot = createBot().launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
