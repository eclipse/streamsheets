const { ERROR: PARSER_ERROR } = require('@cedalo/parser').ReturnCodes;

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
	ERR: '#ERR',
	// ARGS: '#ARG_NUM',
	// FORMAT: '#FORMAT!',      <-- SHOULD WE SIGNAL A FORMAT STRING ERROR?
	FUNC_EXEC: '#FUNC_EXEC',
	// INVALID: '#INVALID',
	INVALID_LOOP_PATH: '#INVALID_LOOP_PATH',
	INVALID_PARAM: '#INVALID_PARAM',
	INVALID_PATH: '#INVALID_PATH',
	LIST: '#NO_LIST',
	NO_CONSUMER: '#NO_CONSUMER',
	NO_PRODUCER: '#NO_PRODUCER',
	DISCONNECTED: '#DISCONNECTED',
	TOPIC_INVALID: '#TOPIC_INVALID',
	NO_MACHINE: '#NO_MACHINE',
	NO_MACHINE_OPCUA: '#NO_OPCUA_MACHINE',
	NO_MSG: '#NO_MSG',
	NO_MSG_DATA: '#NO_MSG_DATA',
	NO_MSG_ID: '#NO_MSG_ID',
	NO_TOPIC: '#NO_TOPIC',
	NO_STREAMSHEET: '#NO_STREAMSHEET',
	NOT_AVAILABLE: '#NOT_AVAILABLE',
	NV: '#NV',
	OUTBOX: '#NO_OUTBOX',
	PROCSHEET: '#PROCESS_SHEET',
	RANGE: '#RANGE',
	RANGE_INVALID: '#RANGE_INVALID',
	SELF_REF: '#SELF_REF',
	SOURCE: '#SOURCE',
	TARGET: '#TARGET',
	TYPE_PARAM: '#TYPE_PARAM'
};

const FUNC_ERROR = Object.assign({}, PARSER_ERROR, ERRORS, EXCEL_ERRORS);

const ERROR_VALS = Object.values(FUNC_ERROR);

const ifNot = (condition, error) => (!condition ? error : undefined);
const ifTrue = (condition, error) => (condition ? error : undefined);
const ifOneTrue = (conditions, errors) => {
	let error;
	conditions.some((cond, index) => {
		error = ifTrue(cond, errors[index]);
		return error != null;
	});
	return error;
};
const isError = (value) => (value != null && ERROR_VALS.includes(value) ? value : undefined);
const containsError = (values) => values.some((value) => isError(value));

module.exports = {
	...FUNC_ERROR,
	isError,
	containsError,
	ifNot,
	ifTrue,
	ifOneTrue
};
