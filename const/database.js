const stepList = [
    {
        id: 'message',
        text: '🟢 Перез загрузкой JSON файла сделайте резервную копию DB!',
        errorText: '🟡 Пожалуйста, загрузите JSON файл',
        validation: {
            dataType: 'document',
            extension: 'json',
        },
    },
    {
        id: 'summary',
        text: '🟢 Файл успешно обработан',
        summary: {}
    },
];

module.exports = {
    stepList,
};