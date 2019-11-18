const { runFunction } = require('../../utils');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

const refresh = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.run(() => Error.code.NOT_AVAILABLE);

module.exports = refresh;
