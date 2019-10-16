const ERROR = require('./errors');
const { getMachine } = require('./utils');
const runFunction = require('./_utils').runFunction;

const getcycletime = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.addMappedArg(() => getMachine(sheet) || ERROR.NO_MACHINE)
		.run(machine => machine.cycletime);


module.exports = getcycletime;
