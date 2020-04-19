const help = require('./help');
const math = require('./math');
const sum = require('./sum');
const { ARCTAN, ARCTAN2, COS, PI, SIN, TAN } = require('@cedalo/parser').Functions;

module.exports = {
	help,
	functions: {
		...math,
		...sum,
		ARCTAN,
		ARCTAN2,
		COS,
		PI,
		SIN,
		TAN
	}
};
