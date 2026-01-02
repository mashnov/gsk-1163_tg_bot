const readXlsxFile = require('read-excel-file/node');

const {
    botToken,
    debtorsTotalRow,
    debtorsTotalCell,
    debtorsRoomNumberStartRow,
    debtorsRoomNumberCell,
    debtorsAmountCell,
    debtorsAmountMin,
} = require('../const/env');

const handleXlsxFile = async (fileData) => {
    const attachedFile = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileData.file_path}`).then((r) => r.arrayBuffer());
    const bufferFile = Buffer.from(attachedFile);
    const fileRows = await readXlsxFile(bufferFile);

    const total = fileRows[debtorsTotalRow]?.[debtorsTotalCell];
    const roomNumbers = [];

    for (let rowIndex = debtorsRoomNumberStartRow; rowIndex < fileRows.length; rowIndex ++) {
        const roomNumber = fileRows[rowIndex]?.[debtorsRoomNumberCell];
        const amount = Number(fileRows[rowIndex]?.[debtorsAmountCell]);

        if (amount >= debtorsAmountMin && !roomNumbers.find((resident) => resident.roomNumber === roomNumber)) {
            roomNumbers.push({ roomNumber, amount });
        }
    }

    return { total, residents: [...roomNumbers] };
};

module.exports = {
    handleXlsxFile,
};
