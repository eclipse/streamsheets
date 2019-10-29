const ERROR = require('../errors');
const {	convert, date: { ms2serial }, runFunction } = require('../../utils');


const mstoserial = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((ms) => convert.toNumber(ms.value, ERROR.INVALID_PARAM))
		.run((ms) => ms2serial(ms));


module.exports = mstoserial;
