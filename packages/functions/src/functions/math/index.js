const math = require('./math');
const sum = require('./sum');
const { ARCTAN, ARCTAN2, COS, PI, SIN, TAN } = require('@cedalo/parser').Functions;

module.exports = {
	...math,
	ARCTAN,
	ARCTAN2,
	COS,
	PI,
	SIN,
	SUM: sum,
	TAN
};
