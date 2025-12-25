const { Telegraf } = require('telegraf');

const navigationService = require('./commands/navigation');
const startCommand = require('./commands/start');
const rulesCommand = require('./commands/rules');
const contactsCommand = require('./commands/contacts');
const weatherCommand = require('./commands/weather');
const horoscopeCommand = require('./commands/horoscope');
const complaintCommand = require('./commands/complaint');
const meterCommand = require('./commands/meter');
const profilesCommand = require('./commands/profiles');
const backupCommand = require('./commands/backup');
const verificationCommand = require('./commands/verification');
const unblockCommand = require('./commands/unblock');
const messagesCommand = require('./commands/messages');

const { botToken } = require('./const/env');

const createBot = () => {
    const bot = new Telegraf(botToken);

    navigationService(bot);
    startCommand(bot);
    rulesCommand(bot);
    contactsCommand(bot);
    weatherCommand(bot);
    horoscopeCommand(bot);
    complaintCommand(bot);
    meterCommand(bot);
    profilesCommand(bot);
    backupCommand(bot);
    verificationCommand(bot);
    unblockCommand(bot);
    messagesCommand(bot);

    return bot;
}

const bot = createBot().launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
