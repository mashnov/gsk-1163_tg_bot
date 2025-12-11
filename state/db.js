const { Keyv } = require('keyv');
const { KeyvFile } = require('keyv-file');

const db = new Keyv({
    store: new KeyvFile({
        filename: './state/db.json',
        encode: JSON.stringify,
        decode: JSON.parse,
    }),
});

db.on('error', (err) => {
    console.error('Keyv Error:', err);
});

module.exports = {
    db,
};