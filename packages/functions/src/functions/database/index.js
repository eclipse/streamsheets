const help = require('./help');
const database = require('./database');

module.exports = {
	help,
	functions: { ...database }
};
