const help = require('./help');
const MAX = require('./max');
const MIN = require('./min');
const statistical = require('./statistical');

module.exports = {
	help,
	functions: {
		...statistical,
		MAX,
		MIN
	}
};
