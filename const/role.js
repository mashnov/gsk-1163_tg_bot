const stepList = [
    {
        id: 'userName',
        text: '🟢 Введите Вашу фамилию и имя',
        errorText: '🟡 Введите Вашу фамилию и имя',
        validation: {
            min: 2,
            dataType: 'text',
        },
    },
    {
        id: 'room',
        text: '🟢 Введите номер Вашей квартиры',
        errorText: '🟡 Введите номер Вашей квартиры',
        validation: {
            min: 0,
            max: 667,
            dataType: 'int',
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
            userName: 'ФИО: ',
            room: 'Номер квартиры: ',
            phone: 'Номер телефона: ',
        }
    },
];

module.exports = {
    stepList,
};