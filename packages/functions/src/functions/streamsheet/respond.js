const {
	sheet: { messageFromBoxOrValue },
	terms: { getRequestIdFromTerm },
	validation: { ensure }
} = require('../../utils');
const mcore = require('../../machinecore');

let Message;
let Streams;
mcore.getAsync().then((mod) => {
	Message = mod.Message;
	Streams = mod.Streams;
});



const respondinternal = (s, ...t) =>
	ensure(s, t)
		.withSheet()
		.withArgs(3, ['streamTerm', 'message', 'internal'])
		.isProcessing()
		.withConsumer()
		.with(({ sheet, internal: { requestId } }) => getRequestIdFromTerm(requestId, sheet))
		.run(({ streamId, message }, requestId) => {
			Streams.respond(streamId, { message: new Message(message), requestId });
			return true;
		});

// =RESPOND(B7,"REST Alexa Stream",C4)
const respond = (s, ...t) =>
	ensure(s, t)
		.withSheet()
		.withArgs(3, ['streamTerm', 'requestIdTerm', 'messageTerm'])
		.isProcessing()
		.withMachine()
		.with(({ machine, sheet, messageTerm }) => messageFromBoxOrValue(machine, sheet, messageTerm))
		.run(({ streamTerm, requestIdTerm }, message) =>
			respondinternal(s, streamTerm, message, { requestId: requestIdTerm })
		);

module.exports = { RESPOND: respond, respondinternal };
