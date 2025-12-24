const sleep = (time = 500) => new Promise(resolve => { setTimeout(resolve, time) });

module.exports = {
    sleep,
};
