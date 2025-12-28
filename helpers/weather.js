const { weatherApi, homeLongitude, homeLatitude, homeTimeZone } = require('../const/env');

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

module.exports = {
    windUnitTransformer,
    fetchWeatherData,
};