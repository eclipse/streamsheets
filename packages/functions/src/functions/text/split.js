const { runFunction } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const split = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.withMaxArgs(3)
		.mapNextArg(str => convert.toString(str.value, ERROR.INVALID_PARAM))
		.mapNextArg(sep => convert.toString(sep.value, ''))
		.mapNextArg(index => (index != null ? convert.toNumber(index.value, 1) : 1))
		.run((str, sep, index) => {
			const parts = sep !== '' ? str.split(sep) : [str];
			index = Math.max(0, Math.min(index - 1, parts.length - 1));
			return parts[index];
		});

module.exports = split;
