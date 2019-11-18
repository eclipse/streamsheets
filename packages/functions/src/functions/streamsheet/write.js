const { jsonbuilder, runFunction, sheet: { getOutbox } } = require('../../utils');
const { convert, jsonpath } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');
const { isType } = require('@cedalo/machine-core');


const TYPES = ['array', 'boolean', 'dictionary', 'number', 'string'];

const messageById = (id, outbox) => (id ? outbox.peek(id, true) : undefined);

const createNewData = (message, keys, value) => {
	const newData = message ? Object.assign({}, message.data) : undefined;
	return newData && (jsonbuilder.add(newData, keys, value) || Error.code.INVALID_PATH);
};

// eslint-disable-next-line no-nested-ternary
const checkType = (str) => (str ? (TYPES.includes(str) ? str : Error.code.INVALID_PARAM) : str);
const validateArray = (val) => Array.isArray(val) ? val : undefined;
const validateDict = (val) => (isType.object(val) && !Array.isArray(val) ? val : undefined);

const isEmpty = (val) => val == null || val === '';
const asString = convert.from().no.object.toString;

const valueOf = (term, typeStr) => {
	let value = term ? term.value : undefined;
	switch (typeStr) {
	case 'array':
		value = isEmpty(value) ? [] : validateArray(value);
		break;
	case 'dictionary':
		value = isEmpty(value) ? {} : validateDict(value);
		break;
	case 'number':
		value = isEmpty(value) ? 0 : convert.toNumber(value);
		break;
	case 'string':
		value = isEmpty(value) ? '' : asString(value);
		break;
	case 'boolean':
		value = isEmpty(value) ? false : convert.toBoolean(value, Error.code.TYPE_PARAM);
		break;
	default:
		value = value != null ? value : '';
	}
	return value;
};


const write = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(3)
		.mapNextArg((path) => jsonpath.parse(path.value))
		.mapNextArg((valTerm) => valTerm)
		.mapNextArg((type) => checkType(type ? convert.toString(type.value, '').toLowerCase() : ''))
		.addMappedArg((path) => jsonpath.last(path) || terms[0].value)
		.addMappedArg(() => getOutbox(sheet) || Error.code.OUTBOX)
		.validate((path) => Error.containsError(path) && Error.code.INVALID_PATH)
		.reduce((path, valTerm, typeStr, retval, outbox) => {
			const value = valueOf(valTerm, typeStr);
			if(value != null && !Error.isError(value)) {
				const message = messageById(path.shift(), outbox);
				const newData = createNewData(message, path, value);
				return !Error.isError(newData) ? [outbox, message, newData, retval] : newData;
			}
			return Error.code.TYPE_PARAM;
		})
		.defaultReturnValue((outbox, message, newData, retval) => retval)
		.run((outbox, message, newData, retval) => {
			outbox.setMessageData(message, newData);
			return retval;
		});


module.exports = write;
