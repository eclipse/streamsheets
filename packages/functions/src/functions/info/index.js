const help = require('./help');
const info = require('./info');

module.exports = {
	help,
	functions: {
		...info
	}
};
