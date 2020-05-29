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
const EXCEL_ERRORS = {
	DIV0: '#DIV0',
	NA: '#NA!',
	NAME: '#NAME?',
	NULL: '#NULL',
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
	LIST: '#NO_LIST',
	NO_CONSUMER: '#NO_CONSUMER',
	NO_PRODUCER: '#NO_PRODUCER',
	NO_MACHINE: '#NO_MACHINE',
	NO_MACHINE_OPCUA: '#NO_OPCUA_MACHINE',
	NO_MSG: '#NO_MSG',
	NO_MSG_DATA: '#NO_MSG_DATA',
	NO_MSG_ID: '#NO_MSG_ID',
	NO_STREAMSHEET: '#NO_STREAMSHEET',
	NO_TOPIC: '#NO_TOPIC',
	NOT_AVAILABLE: '#NOT_AVAILABLE',
	OUTBOX: '#NO_OUTBOX',
	PROCSHEET: '#PROCESS_SHEET',
	RANGE: '#RANGE',
	RANGE_INVALID: '#RANGE_INVALID',
	RESPONSE: '#RESPONSE',
	SELF_REF: '#SELF_REF',
	SOURCE: '#SOURCE',
	TARGET: '#TARGET',
	TOPIC_INVALID: '#TOPIC_INVALID',
	TYPE_PARAM: '#TYPE_PARAM'
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
		return value != null && (errorValues.includes(value) ? value : undefined);
	}

	containsError(values) {
		return values.some((value) => this.isError(value));
	}

	ifNot(condition, error) {
		return !condition ? error : undefined;
	}

	ifTrue(condition, error) {
		return condition ? error : undefined;
	}
	ifOneTrue(conditions, errors) {
		let error;
		conditions.some((cond, index) => {
			error = this.ifTrue(cond, errors[index]);
			return error != null;
		});
		return error;
	}
	errorAt(index, error) {
		return `${error}_${index}`;
	}
}

module.exports = FunctionErrors.of(ERRORS, EXCEL_ERRORS);
