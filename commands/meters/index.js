const apartmentStep = require('./apartment');
const metterStep = require('./metter');
const finishStep = require('./finish');
const sendStep = require('./send');

const { sessions } = require('./state');
const { isValidInteger, isValidFloat, normalizeNumber } = require('../../helpers');
const { metersList, messageParams } = require('../../dictionary');

module.exports = (bot) => {
    bot.command('meters', (ctx) => {
        return apartmentStep(ctx);
    });

    bot.action('meters', async (ctx) => {
        await ctx.answerCbQuery();
        return apartmentStep(ctx);
    });

    bot.action('metersSend', async (ctx) => {
        await ctx.answerCbQuery();
        return sendStep(ctx);
    });

    bot.on('text', async (ctx, next) => {
        const userId = ctx.from.id;
        const session = sessions.get(userId);

        if (!session) {
            return next();
        }

        const text = ctx.message.text.trim();

        if (session.step === 'apartment') {
            if (!isValidInteger(text)) {
                return ctx.reply('❗ Номер квартиры должен быть числом.', messageParams);
            }

            session.apartment = text;
            session.step = 'meter';
            session.index = 0;
            sessions.set(userId, session);

            return await metterStep(ctx, session);
        }

        if (!isValidFloat(text)) {
            return ctx.reply('❗ Показания счетчика должно быть числом.', messageParams);
        }

        const value = normalizeNumber(text);
        const currentMeter = metersList[session.index];

        session.readings[currentMeter.key] = value;
        session.index++;

        if (session.index < metersList.length) {
            sessions.set(userId, session);
            return metterStep(ctx, session);
        }

        await finishStep(ctx, session);
    });
};
