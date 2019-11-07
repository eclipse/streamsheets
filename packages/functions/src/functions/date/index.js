const date = require('./date');
const help = require('./help');
const mstoserial = require('./mstoserial');
const serialtoms = require('./serialtoms');
const { DAY, HOUR, MINUTE, MONTH, NOW, SECOND, WEEKDAY, YEAR } = require('@cedalo/parser').Functions;

module.exports = {
	help,
	functions: {
		...date,
		MSTOSERIAL: mstoserial,
		SERIALTOMS: serialtoms,
		DAY,
		HOUR,
		MINUTE,
		MONTH,
		NOW,
		SECOND,
		WEEKDAY,
		YEAR
	}
};
