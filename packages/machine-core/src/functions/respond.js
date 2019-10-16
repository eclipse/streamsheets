const { getRequestId, messageFromBoxOrValue } = require('./utils');
const { ensure } = require('./_utils/validation');
const Message = require('../machine/Message');
const Streams = require('../streams/Streams');

const respondinternal = (s, ...t) =>
	ensure(s, t)
		.withSheet()
		.withArgs(3, ['streamTerm', 'message', 'internal'])
		.isProcessing()
		.withConsumer()
		.with(({ sheet, internal: { requestId } }) => getRequestId(requestId, sheet))
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

module.exports = { respond, respondinternal };
