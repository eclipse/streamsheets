const ERROR = require('./errors');
const { serial2ms } = require('./_utils').date;
const { runFunction } = require('./_utils');
const { convert } = require('@cedalo/commons');


const serialtoms = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(serial => convert.toNumber(serial.value) || ERROR.VALUE)
		.run(serial => serial2ms(serial));


module.exports = serialtoms;
