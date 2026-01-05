const messageLogger = ({ from, to, text }) => {
    console.log('logger', { from, to, text });
};

module.exports = {
    messageLogger,
};
