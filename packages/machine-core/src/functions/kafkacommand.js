const ERROR = require('./errors');
const { requestinternallegacy } = require('./request');
const Message = require('../machine/Message');
const {
	getMachine
} = require('./utils');

const kafkacommand = (sheet, ...terms) => {
	let error = terms.length < 4 && terms.length > 8 ? ERROR.ARGS : undefined;
	if (!error && sheet.isProcessing) {
		const machine = getMachine(sheet);
		error = ERROR.ifNot(machine, ERROR.NO_MACHINE);
		const [
			streamTerm,
			commandTerm,
			targetBoxTerm,
			timeoutTerm
		] = terms;
		const config = {
			type: 'COMMAND',
			ksqlCommand: commandTerm && commandTerm.value,
			timeout: timeoutTerm && timeoutTerm.value
		};
		if (error) return error;
		return requestinternallegacy(kafkacommand.term, sheet, streamTerm, new Message(config), targetBoxTerm);
	}
	return error || true; // not processing, so its ok...
};

module.exports = kafkacommand;
