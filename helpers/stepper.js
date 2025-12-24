const { getSession } = require('../helpers/sessions');
const { homeOption } = require('../const/dictionary');
const { validateMessage } = require('./validation');
const { getMessageText, getMessageAttachment, getSummaryMessage } = require('./getters');
const { sendMessage, removeMessage } = require('./telegraf');

function startStepper({ actionName, stepList, cancelActions = homeOption, submitActions }) {
    const sendStepWarning = async (ctx, session) => {
        const messageText = stepList[session.stepIndex]?.errorText;
        session.messageId = await sendMessage(ctx, { text: messageText });
    };

    const sendStepMessage = async (ctx, session) => {
        const stepId = stepList[session.stepIndex]?.id;
        const messageText = stepList[session.stepIndex]?.text;
        if (stepId === 'summary') {
            const summaryText = getSummaryMessage(stepList[session.stepIndex]?.summary, session);
            const summaryMessage = `${messageText}\n\n${summaryText}`;
            session.messageId = await sendMessage(ctx, {
                text: summaryMessage,
                buttons: { ...submitActions, ...cancelActions },
                attachment: session.attachment,
            });
        } else {
            session.messageId = await sendMessage(ctx, { text: messageText });
        }
    };

    const startHandler = async (ctx) => {
        const session = getSession(ctx.from.id);
        await sendStepMessage(ctx, session);
    };

    const inputHandler = async (ctx, next) => {

        const session = getSession(ctx.from.id);

        if (session?.action !== actionName) {
            return next();
        }

        if (session?.messageId) {
            await removeMessage(ctx, { messageId: session.messageId });
        }

        if (!stepList[session.stepIndex]) {
            return;
        }

        if (stepList[session.stepIndex].id === 'summary') {
            return;
        }

        const validationRules = stepList[session.stepIndex]?.validation;
        const isMessageStep = validationRules.dataType === 'message';
        const stepIsValid = validateMessage(ctx.message, validationRules);

        if (stepIsValid && isMessageStep) {
            session.attachment = getMessageAttachment(ctx.message);
            session.messageOrigin = ctx.message;
        }
        if (stepIsValid) {
            session[stepList[session.stepIndex]?.id] = getMessageText(ctx.message);
            session.stepIndex = session.stepIndex + 1;
            await sendStepMessage(ctx, session);
        } else {
            await sendStepWarning(ctx, session);
        }

        await removeMessage(ctx);
    };

    return {
        startHandler,
        inputHandler,
    };
}

module.exports = {
    startStepper,
};
