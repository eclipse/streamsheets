const { ensure } = require('./validation');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Streams } = require('@cedalo/machine-core');
// const mcore = require('../machine-core');

// let Streams;
// mcore.getAsync().then((mod) => {
// 	Streams = mod.Streams;
// });

const ERROR = FunctionErrors.code;

const publishinternal = (s, ...t) =>
	ensure(s, t)
		.withArgs(2, ['streamTerm', 'message'])
		.withProducer()
		.check(({ message }) => FunctionErrors.isError(message) || FunctionErrors.ifNot(message, ERROR.NO_MSG))
		.check(({ message }) => FunctionErrors.ifTrue(message.message === null || message.message === undefined))
		.isProcessing()
		.run(({ streamId, message }) => {
			Streams.publish(streamId, message);
			return true;
		});

module.exports = publishinternal;
