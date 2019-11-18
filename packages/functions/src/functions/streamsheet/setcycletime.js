const { runFunction, sheet: { getMachine } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');


const setcycletime = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((cycletime) => {
			const time = convert.toNumber(cycletime.value);
			return time == null || time < 1 ? Error.code.VALUE : time;
		})
		.addMappedArg(() => getMachine(sheet) || Error.code.NO_MACHINE)
		.run((cycletime, machine) => {
			machine.cycletime = cycletime;
			return true;
		});


module.exports = setcycletime;
