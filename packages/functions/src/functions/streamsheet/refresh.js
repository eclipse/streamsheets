const { runFunction } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const refresh = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.run(() => ERROR.NOT_AVAILABLE);

module.exports = refresh;
