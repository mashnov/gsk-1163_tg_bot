const { Telegraf } = require('telegraf');

const remove = require('./middleware/remove');

const startCommand = require('./commands/start');
const profileCommand = require('./commands/profile');
const contactsCommand = require('./commands/contacts');
const metersCommand = require('./commands/meters');
const complainCommand = require('./commands/complain');

function createBot() {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    remove(bot);

    startCommand(bot);
    profileCommand(bot);
    contactsCommand(bot);
    metersCommand(bot);
    complainCommand(bot);

    return bot;
}

module.exports = { createBot };