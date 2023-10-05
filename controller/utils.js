const sleep = sec => new Promise(r => setTimeout(r, sec*1000));

module.exports = {
	sleep,
}