const help = require('./help');
const lookup = require('./lookup');

module.exports = {
	help,
	functions: {
		...lookup
	}
};
