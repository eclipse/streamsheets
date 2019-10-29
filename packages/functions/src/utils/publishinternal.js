const ERROR = require('../functions/errors');
const { ensure } = require('./validation');
const { Streams } = require('@cedalo/machine-core');

const publishinternal = (s, ...t) =>
	ensure(s, t)
		.withArgs(2, ['streamTerm', 'message'])
		.withProducer()
		.check(({ message }) => ERROR.isError(message) || ERROR.ifNot(message, ERROR.NO_MSG))
		.check(({ message }) => ERROR.ifTrue(message.message === null || message.message === undefined))
		.isProcessing()
		.run(({ streamId, message }) => {
			Streams.publish(streamId, message);
			return true;
		});

module.exports = publishinternal;
