/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { clone, convert, jsonpath } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { isType, Message } = require('@cedalo/machine-core');
const { jsonbuilder, runFunction, sheet: { getOutbox } } = require('../../utils');

const ERROR = FunctionErrors.code;
const TYPES = ['array', 'boolean', 'dictionary', 'number', 'string'];

const putNewMessage = (id, outbox, ttl) => {
	const msg = new Message({}, id);
	return outbox.put(msg, undefined, ttl) ? msg : undefined;
};
const messageById = (id, outbox, ttl) => (id != null ? outbox.peek(id) || putNewMessage(id, outbox, ttl) : undefined);

const createNewData = (message, keys, value) => {
	const newData = message ? Object.assign({}, message.data) : undefined;
	return newData && (jsonbuilder.add(newData, keys, value) || ERROR.INVALID_PATH);
};
const createNewMetadata = (message, keys, value) => {
	const newData = message ? Object.assign({}, message.metadata) : undefined;
	const valuecp = clone(value) || value;
	return newData && (jsonbuilder.add(newData, keys, valuecp) || ERROR.INVALID_PATH);
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

const getTTL = (seconds) => {
	const ttl = convert.toNumber(seconds);
	return ttl ? ttl * 1000 : undefined;
};

const isMeta = (term) => term.func && term.name && term.name.toUpperCase().endsWith('METADATA');

const write = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(4)
		.mapNextArg((path) => jsonpath.parse(path.value))
		.mapNextArg((valTerm) => valTerm)
		.mapNextArg((type) => checkType(type ? convert.toString(type.value, '').toLowerCase() : ''))
		.mapNextArg((ttl) => ttl ? getTTL(ttl.value) : undefined)
		.addMappedArg((path) => jsonpath.last(path) || terms[0].value)
		.addMappedArg(() => getOutbox(sheet) || ERROR.OUTBOX)
		.addMappedArg(() => isMeta(terms[0]))
		.validate((path) => FunctionErrors.containsError(path) && ERROR.INVALID_PATH)
		.reduce((path, valTerm, typeStr, ttl, retval, outbox, isMetadata) => {
			const value = valueOf(valTerm, typeStr);
			if (value != null && !FunctionErrors.isError(value)) {
				const message = messageById(path.shift(), outbox, ttl);
				const newData = isMetadata
					? createNewMetadata(message, path, value)
					: createNewData(message, path, value);
				return !FunctionErrors.isError(newData)
					? [outbox, message, newData, ttl, retval, isMetadata]
					: newData;
			}
			return ERROR.TYPE_PARAM;
		})
		.defaultReturnValue((outbox, message, newData, ttl, retval) => retval)
		.run((outbox, message, newData, ttl, retval, isMetadata) => {
			if (isMetadata) outbox.setMessageMetadata(message, newData, ttl);
			else outbox.setMessageData(message, newData, ttl);
			return retval;
		});
write.displayName = true;

module.exports = write;
