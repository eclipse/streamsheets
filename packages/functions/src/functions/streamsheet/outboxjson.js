const { runFunction, sheet: { getMachine, getMessagesFromBox } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const getOutbox = (sheet) => {
	const machine = getMachine(sheet);
	return machine && machine.outbox;
};


const outboxjson = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.addMappedArg(() => getOutbox(sheet) || ERROR.INVALID_PARAM)
		.mapNextArg(inclMetaData => convert.toBoolean(inclMetaData && inclMetaData.value, false))
		.run((outbox, inclMetaData) => getMessagesFromBox(outbox, inclMetaData));


module.exports = outboxjson;
