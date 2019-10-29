const date = require('./date');
const mstoserial = require('./mstoserial');
const serialtoms = require('./serialtoms');
const { DAY, HOUR, MINUTE, MONTH, NOW, SECOND, WEEKDAY, YEAR } = require('@cedalo/parser').Functions;

module.exports = {
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
};
