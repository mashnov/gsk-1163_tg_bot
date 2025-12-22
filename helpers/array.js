const toArray = (value) => {
    return Array.isArray(value) ? value : [value];
};

const getArrayFallback = (array, fallback) => {
    const arrayValue = !array == null ? [] : toArray(array);
    const fallbackValue = !fallback == null ? [] : toArray(fallback);
    return arrayValue.length ? arrayValue : fallbackValue;
};

module.exports = {
    getArrayFallback,
};