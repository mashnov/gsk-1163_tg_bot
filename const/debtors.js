const stepList = [
    {
        id: 'message',
        text: '🟢 Пожалуйста, загрузите xlsx файл',
        errorText: '🟡 Пожалуйста, загрузите xlsx файл',
        validation: {
            dataType: 'document',
            extension: 'xlsx',
        },
    },
    {
        id: 'summary',
        text: '🟢 Файл загружен',
        summary: {}
    },
];

module.exports = {
    stepList,
};