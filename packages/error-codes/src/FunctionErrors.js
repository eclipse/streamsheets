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
const ErrorInfo = require('./ErrorInfo');

const EXCEL_ERRORS = {
	DIV0: '#DIV0',
	NA: '#NA!',
	NAME: '#NAME?',
	// NULL: '#NULL',
	NUM: '#NUM!',
	REF: '#REF!',
	VALUE: '#VALUE!'
};
const ERRORS = {
	ARGS: '#ARG_NUM',
	DISCONNECTED: '#DISCONNECTED',
	ERR: '#ERR',
	FUNC_EXEC: '#FUNC_EXEC',
	INVALID: 'INVALID',
	INVALID_LOOP_PATH: '#INVALID_LOOP_PATH',
	INVALID_PARAM: '#INVALID_PARAM',
	INVALID_PATH: '#INVALID_PATH',
	LIMIT: '#LIMIT',
	NO_CONSUMER: '#NO_CONSUMER',
	NO_PRODUCER: '#NO_PRODUCER',
	// TODO: remove -> machine always exists
	NO_MACHINE: '#NO_MACHINE',
	NO_MACHINE_OPCUA: '#NO_OPCUA_MACHINE',
	NO_MACHINE_HTTP_SERVER: '#NO_HTTP_SERVER_MACHINE',
	NO_MSG: '#NO_MSG',
	NO_MSG_DATA: '#NO_MSG_DATA',
	NO_STREAMSHEET: '#NO_STREAMSHEET',
	RANGE: '#RANGE',
	RESPONSE: '#RESPONSE',
	WAITING: '#WAITING'
	
	// DEPRECATED:
	// LIST: '#NO_LIST',
	// NO_MSG_ID: '#NO_MSG_ID',
	// OUTBOX: '#NO_OUTBOX',
	// NO_TOPIC: '#NO_TOPIC',
	// PROCSHEET: '#PROCESS_SHEET',
	// RANGE_INVALID: '#RANGE_INVALID',
	// SELF_REF: '#SELF_REF',
	// SOURCE: '#SOURCE',
	// TARGET: '#TARGET',
	// TOPIC_INVALID: '#TOPIC_INVALID',
	// TYPE_PARAM: '#TYPE_PARAM',
};

const allErrors = {};
let errorValues = [];

class FunctionErrors {
	static of(...errors) {
		const funcErrors = new FunctionErrors();
		return funcErrors.add(Object.assign({}, ...errors));
	}

	get code() {
		return allErrors;
	}

	add(errors = {}) {
		Object.assign(allErrors, errors);
		errorValues = Object.values(allErrors);
		return this;
	}

	isError(value) {
		return value != null && (value.isErrorInfo || errorValues.includes(value)) ? value : undefined;
	}

	isErrorCode(value, code) {
		if (value != null) return value.isErrorInfo ? value.code === code : value === code;
		return false;
	}
	// getErrorCode(value) {
	// 	if (value == null) return undefined;
	// 	if (value.isErrorInfo) return value.code;
	// 	return errorValues.includes(value) ? value : undefined;
	// }

	containsError(values) {
		return values.some((value) => this.isError(value));
	}

	ifNot(condition, error) {
		return !condition ? error : undefined;
	}

	ifTrue(condition, error) {
		return condition ? error : undefined;
	}

	localizeError(error, locale) {
		return ErrorInfo.localize(error, locale);
	}
}

module.exports = FunctionErrors.of(ERRORS, EXCEL_ERRORS);
