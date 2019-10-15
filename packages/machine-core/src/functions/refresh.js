const ERROR = require('./errors');
const runFunction = require('./_utils').runFunction;

const refresh = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.run(() => ERROR.NOT_AVAILABLE);

module.exports = refresh;
