const help = require('./help');
const olap = require('./olap');

module.exports = {
	help,
	functions: {
		...olap
	}
};
