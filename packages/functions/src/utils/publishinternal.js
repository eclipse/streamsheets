const { ensure } = require('./validation');
const mcore = require('../machinecore');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

let Streams;
mcore.getAsync().then((mod) => {
	Streams = mod.Streams;
});

const publishinternal = (s, ...t) =>
	ensure(s, t)
		.withArgs(2, ['streamTerm', 'message'])
		.withProducer()
		.check(({ message }) => Error.isError(message) || Error.ifNot(message, Error.code.NO_MSG))
		.check(({ message }) => Error.ifTrue(message.message === null || message.message === undefined))
		.isProcessing()
		.run(({ streamId, message }) => {
			Streams.publish(streamId, message);
			return true;
		});

module.exports = publishinternal;
