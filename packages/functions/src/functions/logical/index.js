const help = require('./help');
const logical = require('./logical');

module.exports = {
	help,
	functions: {
		...logical
		// IF is inherent with parser! => condition term!!
	}
};
