const help = require('./help');
const engineering = require('./engineering');

module.exports = {
	help,
	functions: {
		...engineering
	}
};
