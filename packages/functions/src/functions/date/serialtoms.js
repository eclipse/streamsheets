const {	date: { serial2ms }, runFunction } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');


const serialtoms = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(serial => convert.toNumber(serial.value) || Error.code.VALUE)
		.run(serial => serial2ms(serial));


module.exports = serialtoms;
