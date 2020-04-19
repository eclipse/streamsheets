const help = require('./help');
const max = require('./max');
const min = require('./min');
const ifs = require('./ifs');
const statistical = require('./statistical');

module.exports = {
	help,
	functions: {
		...ifs,
		...max,
		...min,
		...statistical,
	}
};
