const { getMachine } = require('./utils');
const ERROR = require('./errors');
const runFunction = require('./_utils').runFunction;


const popMessage = (id, machine) => id && machine && !!machine.outbox.pop(id);


/** @deprecated ?? */
const remove = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(msgid => msgid.value)
		.addMappedArg(() => getMachine(sheet) || ERROR.NO_MACHINE)
		.run((id, machine) => popMessage(id, machine));


module.exports = remove;
