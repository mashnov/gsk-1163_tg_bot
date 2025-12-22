const stepList = [
    {
        id: 'name',
        text: '🟢 Введите Вашу фамилию и имя',
        errorText: '🟡 Введите Вашу фамилию и имя',
        validation: {
            min: 2,
            dataType: 'text',
        },
    },
    {
        id: 'phone',
        text: '🟢 Введите Ваш номер телефона',
        errorText: '🟡 Введите Ваш номер телефона',
        validation: {
            dataType: 'phone',
        },
    },
    {
        id: 'summary',
        text: '🟢 Данные подготовлены.',
        summary: {
            name: 'Имя отправителя: ',
            phone: 'Номер телефона: ',
        }
    },
];

module.exports = {
    stepList,
};