const { Telegraf } = require('telegraf');

const navigationService = require('./commands/navigation');
const startCommand = require('./commands/start');
const rulesCommand = require('./commands/rules');
const contactsCommand = require('./commands/contacts');
const messagesCommand = require('./commands/messages');
const weatherCommand = require('./commands/weather');
const horoscopeCommand = require('./commands/horoscope');
const meterCommand = require('./commands/meter');
const anonymousCommand = require('./commands/anonymous');
const complaintCommand = require('./commands/complaint');
const profilesCommand = require('./commands/profiles');
const backupCommand = require('./commands/backup');
const verificationCommand = require('./commands/verification');
const unblockCommand = require('./commands/unblock');
const reactionsCommand = require('./commands/reactions');

const { botToken } = require('./const/env');

const createBot = () => {
    const bot = new Telegraf(botToken);

    navigationService(bot);
    startCommand(bot);
    rulesCommand(bot);
    contactsCommand(bot);
    messagesCommand(bot);
    weatherCommand(bot);
    horoscopeCommand(bot);
    meterCommand(bot);
    anonymousCommand(bot);
    complaintCommand(bot);
    profilesCommand(bot);
    backupCommand(bot);
    verificationCommand(bot);
    unblockCommand(bot);
    reactionsCommand(bot);

    return bot;
}

const bot = createBot();

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
