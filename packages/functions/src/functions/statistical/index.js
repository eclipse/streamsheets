const help = require('./help');
const MAX = require('./max');
const MIN = require('./min');
const ifs = require('./ifs');
const statistical = require('./statistical');

module.exports = {
	help,
	functions: {
		...ifs,
		...statistical,
		MAX,
		MIN
	}
};
