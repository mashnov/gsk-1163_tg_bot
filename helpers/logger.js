const fs = require('fs');

const { logMaxAgeDays } = require('../const/env');

const FILE_PATH = './state/messages.txt';
const LOG_MAX_AGE = logMaxAgeDays * 24 * 60 * 60 * 1000;

const messageLogger = ({ from, to, text }) => {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, '');
    }

    const currentDate = new Date();
    const record = { from, to, text: String(text ?? '').trim(), date: currentDate.toISOString() };
    const content = fs.readFileSync(FILE_PATH, 'utf8') || '[]';
    const records = [...JSON.parse(content), record];
    const filteredRecords = records.filter((record) => {
        const time = new Date(record.date).getTime();
        return currentDate - time <= LOG_MAX_AGE;
    });
    fs.writeFileSync(FILE_PATH, JSON.stringify(filteredRecords));
};

module.exports = {
    messageLogger,
};
