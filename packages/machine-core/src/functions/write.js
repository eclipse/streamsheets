const jb = require('./jsonbuilder');
const { getOutbox } = require('./utils');
const { runFunction } = require('./_utils');
const { isType } = require('../utils');
const ERROR = require('./errors');
const { convert, jsonpath } = require('@cedalo/commons');


const TYPES = ['array', 'boolean', 'dictionary', 'number', 'string'];

const messageById = (id, outbox) => (id ? outbox.peek(id, true) : undefined);

const createNewData = (message, keys, value) => {
	const newData = message ? Object.assign({}, message.data) : undefined;
	return newData && (jb.add(newData, keys, value) || ERROR.INVALID_PATH);
};

// eslint-disable-next-line no-nested-ternary
const checkType = (str) => (str ? (TYPES.includes(str) ? str : ERROR.INVALID_PARAM) : str);
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
		value = isEmpty(value) ? false : convert.toBoolean(value, ERROR.TYPE_PARAM);
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
		.addMappedArg(() => getOutbox(sheet) || ERROR.OUTBOX)
		.validate((path) => ERROR.containsError(path) && ERROR.INVALID_PATH)
		.reduce((path, valTerm, typeStr, retval, outbox) => {
			const value = valueOf(valTerm, typeStr);
			if(value != null && !ERROR.isError(value)) {
				const message = messageById(path.shift(), outbox);
				const newData = createNewData(message, path, value);
				return !ERROR.isError(newData) ? [outbox, message, newData, retval] : newData;
			}
			return ERROR.TYPE_PARAM;
		})
		.defaultReturnValue((outbox, message, newData, retval) => retval)
		.run((outbox, message, newData, retval) => {
			outbox.setMessageData(message, newData);
			return retval;
		});


module.exports = write;
