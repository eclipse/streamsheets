const help = require('./help');
const stack = require('./stack');

module.exports = {
	help,
	functions: {
		...stack
	}
};
