/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
module.exports = {
	// TYPES:
	'ERROR': 'Error',
	'WARNING': 'Warning',
	// INFO PROPERTIES:
	'code': 'Error-Code',
	'description': 'Description',
	'paramIndex': 'Parameter',
	'message': 'Message',
	// ERROR CODES:
	'#ARG_NUM': 'Missing arguments',
	'#DISCONNECTED': 'One of your Streams is not connected',
	'#DIV0': 'Division by zero is forbidden',
	'#ERR': 'Request or parsing error',
	'#FUNC_EXEC': 'Internal error',
	'INVALID': 'Function is deprecated',
	'#INVALID_LOOP_PATH': 'Specified loop path is invalid',
	'#INVALID_PARAM': 'Specified parameter is invalid',
	'#INVALID_PATH': 'Specified path is invalid',
	'#LIMIT': 'Specified limit reached',
	'#NO_CONSUMER': 'Unknown consumer used',
	'#NO_PRODUCER': 'Unknown producer used',
	'#NO_MACHINE': 'Machine not available',
	'#NO_OPCUA_MACHINE': 'Machine OPCUA setting not active',
	'#NO_MSG': 'Referenced message does not exist',
	'#NO_MSG_DATA': 'No data a specified message path',
	'#NO_STREAMSHEET': 'Referenced streamsheet does not exist',
	'#NA!': 'Value not available',
	'#NAME?': 'Unknown formula or identifier',
	'#NUM!': 'Invalid number value',
	'#RANGE': 'Invalid cell range',
	'#REF!': 'Invalid reference',
	'#RESPONSE': 'Error in request response',
	'#VALUE!': 'Wrong value type',
	'#WAITING': 'Waiting for a Streamsheet to finish'

	// '#NO_LIST': '',
	// '#NO_MSG_ID': '',
	// '#NO_OUTBOX': '',
	// '#NO_TOPIC': '',
	// '#NOT_AVAILABLE': '',
	// '#PROCESS_SHEET': '',
	// '#RANGE_INVALID': '',
	// '#SELF_REF': '',
	// '#SOURCE': '',
	// '#TARGET': '',
	// '#TOPIC_INVALID': '',
	// '#TYPE_PARAM': '',
};
