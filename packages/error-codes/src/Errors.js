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
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'error-codes',
	process.env.STREAMSHEETS_LOG_LEVEL
);
const CODES = require('./codes');

function createInternal(key, optionalMessage) {
	if (!CODES[key]) {
		logger.error('error CODES[key]:', key);
	}
	const errorObject = {
		isSemantic: true,
		code: CODES[key] || 'UNKNOWN'
	};

	if (optionalMessage) {
		errorObject.message = optionalMessage;
	}

	return errorObject;
}

module.exports = {
	createInternal
};
