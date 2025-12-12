const { config } = require('dotenv');
const { Telegraf } = require('telegraf');

const startCommand = require('./commands/start');
const profileCommand = require('./commands/profile');
const authorizationCommand = require('./commands/authorization');
const changeRoleCommand = require('./commands/role');
const contactsCommand = require('./commands/contacts');
const meterCommand = require('./commands/meter');
const messagesCommand = require('./commands/messages');

config();

const createBot = () => {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    startCommand(bot);
    profileCommand(bot);
    authorizationCommand(bot);
    changeRoleCommand(bot);
    contactsCommand(bot);
    meterCommand(bot);
    messagesCommand(bot);

    return bot;
}

const bot = createBot().launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
