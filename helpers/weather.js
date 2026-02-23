const { weatherApi, homeLongitude, homeLatitude, homeTimeZone } = require('../const/env');
const { weatherCodeDetails } = require('../const/weather');

const weatherParam = {
    current: ['temperature_2m', 'relative_humidity_2m', 'weather_code', 'cloud_cover', 'wind_speed_10m',].join(','),
    hourly: ['precipitation', 'precipitation_probability'].join(','),
    longitude: homeLongitude,
    latitude: homeLatitude,
    timezone: homeTimeZone,
}

const fetchWeatherData = async () => {
    const url = new URL(weatherApi);
    url.search = new URLSearchParams(weatherParam).toString();
    const weatherResponse = await fetch(url);
    return await weatherResponse.json();
};

const windUnitTransformer = (value) => {
    return value ? (value / 3.6).toFixed(1) : '-';
};

const getWeatherImage = (code, temperature) => {
    const season = Number(temperature) < 8 ? 'winter' : 'summer';
    const weather = weatherCodeDetails[code]?.image;
    return `./assets/weather/${season}/${weather}.jpeg`;
};

const isWinter = () => {
    const month = new Date().getMonth();
    return [0, 1, 2, 10, 11].includes(month);
};

module.exports = {
    windUnitTransformer,
    fetchWeatherData,
    getWeatherImage,
    isWinter,
};