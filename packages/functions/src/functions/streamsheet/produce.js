const publishinternal = require('../../utils/publishinternal');
const { runFunction, sheet: { messageFromBoxOrValue, getMachine } } = require('../../utils');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

const produce = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(2)
		.addMappedArg(() => getMachine(sheet) || Error.code.NO_MACHINE)
		.mapNextArg((streamTerm) => streamTerm)
		.mapNextArg((messageTerm, machine) => {
			const message = messageFromBoxOrValue(machine, sheet, messageTerm);
			if (typeof message === 'string') {
				try {
					return JSON.parse(message);
				} catch (e) {
					return Error.code.INVALID_PARAM;
				}
			}
			return message;
		})
		.run((machine, streamTerm, message) => publishinternal(sheet, streamTerm, message));

module.exports = produce;
