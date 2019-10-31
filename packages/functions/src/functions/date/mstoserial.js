const {	date: { ms2serial }, runFunction } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');


const mstoserial = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((ms) => convert.toNumber(ms.value, Error.code.INVALID_PARAM))
		.run((ms) => ms2serial(ms));


module.exports = mstoserial;
