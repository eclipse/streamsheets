const {	date: { ms2serial }, runFunction } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;


const mstoserial = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((ms) => convert.toNumber(ms.value, ERROR.INVALID_PARAM))
		.run((ms) => ms2serial(ms));


module.exports = mstoserial;
