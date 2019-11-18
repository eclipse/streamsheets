const { runFunction, sheet: { getMachine } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const setcycletime = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((cycletime) => {
			const time = convert.toNumber(cycletime.value);
			return time == null || time < 1 ? ERROR.VALUE : time;
		})
		.addMappedArg(() => getMachine(sheet) || ERROR.NO_MACHINE)
		.run((cycletime, machine) => {
			machine.cycletime = cycletime;
			return true;
		});


module.exports = setcycletime;
