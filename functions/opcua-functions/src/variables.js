const { validateStreamSheet } = require('./validation');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { runFunction } = require('@cedalo/functions').utils;

const ERROR = FunctionErrors.code;
const asString = (value) => convert.toString(value);

const setvariable = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((name) => asString(name.value, ERROR.VALUE))
		.mapNextArg((value) => (value != null ? value.value : null))
		.mapNextArg((config) => (config != null ? config.value : null))
		.addMappedArg(() => validateStreamSheet(sheet.streamsheet))
		.run((name, value, config, streamsheet) => {
			streamsheet.notify('event', {
				type: 'opcua',
				action: 'variable',
				data: { name, value, config }
			});
			return true;
		});

const setvariables = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((data) => data.value)
		.addMappedArg(() => validateStreamSheet(sheet.streamsheet))
		.validate((values, streamsheet) => FunctionErrors.ifTrue(values == null || !streamsheet, ERROR.VALUE))
		.run((values, streamsheet) => {
			streamsheet.notify('event', {
				type: 'opcua',
				action: 'variables',
				data: values
			});
			return true;
		});

const deletevariable = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((name) => asString(name.value, ERROR.VALUE))
		.addMappedArg(() => validateStreamSheet(sheet.streamsheet))
		.run((name, streamsheet) => {
			streamsheet.notify('event', {
				type: 'opcua',
				action: 'delete_variable',
				data: { name }
			});
			return true;
		});

module.exports = {
	deletevariable,
	setvariable,
	setvariables
};
