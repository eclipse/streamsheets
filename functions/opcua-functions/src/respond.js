const {
	sheet: { messageFromBoxOrValue },
	terms: { getRequestIdFromTerm },
	validation: { ensure }
} = require('@cedalo/functions').utils;
const { Message } = require('@cedalo/machine-core');


const respond = (s, ...t) =>
	ensure(s, t)
		.withArgs(1, ['requestIdTerm', 'payloadTerm'])
		.withSheet()
		.withMachine()
		.isProcessing()
		.with(({ requestIdTerm }) => getRequestIdFromTerm(requestIdTerm))
		.with(({ machine, sheet, payloadTerm }) => messageFromBoxOrValue(machine, sheet, payloadTerm, false))
		.run(({ machine }, requestId, payload) => {
			const message = new Message(payload);
			message.metadata.requestId = requestId;
			machine.notifyMessage('respond', { message });
			return true;
		});

module.exports = respond;
