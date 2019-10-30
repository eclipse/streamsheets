const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const validateStreamSheet = (streamsheet) => {
	const machine = streamsheet && streamsheet.machine;
	const error = FunctionErrors.ifTrue(streamsheet == null, ERROR.NO_STREAMSHEET)
		|| FunctionErrors.ifTrue(!machine, ERROR.NO_MACHINE)
		|| FunctionErrors.ifTrue(!machine.isOPCUA, ERROR.NO_MACHINE_OPCUA);
	return error || streamsheet;
};

module.exports = {
	validateStreamSheet
};
