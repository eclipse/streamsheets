const ERROR = require('./errors');
const { ms2serial } = require('./_utils').date;
const { convert, runFunction} = require('./_utils');


const mstoserial = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((ms) => convert.toNumber(ms.value, ERROR.INVALID_PARAM))
		.run((ms) => ms2serial(ms));


module.exports = mstoserial;
