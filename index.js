const { config } = require('dotenv');
const { Telegraf } = require('telegraf');

const startCommand = require('./commands/start');
const rulesCommand = require('./commands/rules');
const contactsCommand = require('./commands/contacts');
const verificationCommand = require('./commands/verification');
const profilesCommand = require('./commands/profiles');
const meterCommand = require('./commands/meter');
const messagesCommand = require('./commands/messages');

config();

const createBot = () => {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    startCommand(bot);
    rulesCommand(bot);
    contactsCommand(bot);
    verificationCommand(bot);
    profilesCommand(bot);
    meterCommand(bot);
    messagesCommand(bot);

    return bot;
}

const bot = createBot().launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
