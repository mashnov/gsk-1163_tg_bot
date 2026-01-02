const toArray = (value) => {
    return Array.isArray(value) ? value : [value];
};

const getArrayFallback = (array, fallback) => {
    const arrayValue = !array == null ? [] : toArray(array);
    const fallbackValue = !fallback == null ? [] : toArray(fallback);
    return arrayValue.length ? arrayValue : fallbackValue;
};

const getPaginatedItems = (array = [], page = 0, size = 50) => {
    const startIndex = page * size;
    const endIndex = startIndex + size;
    return array.slice(startIndex, endIndex);
};

module.exports = {
    getArrayFallback,
    getPaginatedItems,
};