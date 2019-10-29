const ERROR = require('../errors');
const { convert, runFunction, sheet: { getMachine } } = require('../../utils');


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
