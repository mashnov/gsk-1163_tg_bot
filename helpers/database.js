const fs = require('fs');

const { botToken} = require('../const/env');

const targetPath = 'state';
const targetFile = 'db.json';

const updateDbFile = async (fileData) => {
    const attachedFile = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileData.file_path}`).then((r) => r.arrayBuffer());
    const bufferFile = Buffer.from(attachedFile);

    fs.mkdirSync(targetPath, { recursive: true });
    fs.writeFileSync(`${targetPath}/${targetFile}`, bufferFile);
};

module.exports = {
    updateDbFile,
};
