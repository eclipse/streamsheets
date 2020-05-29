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
const createError = require('http-errors');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'error-codes',
	process.env.STREAMSHEETS_LOG_LEVEL
);

const KNOWN_ERRORS = {
	GRAPH_NOT_FOUND: { fn: createError.NotFound },
	NODE_NOT_FOUND: { fn: createError.NotFound },
	MACHINE_NOT_FOUND: { fn: createError.NotFound },
	PARENT_NODE_NOT_FOUND: { fn: createError.NotFound },
	DOMAIN_NOT_FOUND: { fn: createError.NotFound },
	SCENARIO_NOT_FOUND: { fn: createError.NotFound },
	'LOCK_ACQUIRE:NODE_LOCKED': { fn: createError.Conflict },
	'LOCK_RELEASE:NODE_LOCK_NOT_ACQUIRED': { fn: createError.BadRequest },
	TRANSLATION_NOT_FOUND: { fn: createError.NotFound },
	WRONG_MAIL_OR_PASSWORD: { fn: createError.Unauthorized },
	WRONG_MAIL: { fn: createError.Unauthorized, exposeAs: 'WRONG_MAIL_OR_PASSWORD' },
	USER_ALREADY_EXISTS: { fn: createError.Conflict },
	PASSWORDS_DONT_MATCH: { fn: createError.Unauthorized, exposeAs: 'WRONG_MAIL_OR_PASSWORD' },
	NODE_LOCK_NOT_ACQUIRED: { fn: createError.MethodNotAllowed },
	SETTING_NOT_FOUND: { fn: createError.NotFound }
};

const defaultError = createError.InternalServerError;

function createFromInternal(error = {}) {
	let ErrorConstructor;
	let errorMessage = '';
	if (error.isSemantic) {
		const knownError = KNOWN_ERRORS[error.code];
		if (knownError) {
			errorMessage = knownError.exposeAs || error.code;
			ErrorConstructor = knownError.fn;
		}
	}

	if (error.code && !ErrorConstructor) {
		logger.warn('No error-code mapping found for %s', error.code);
	} else if (error.code) {
		logger.debug('emitting error-code %s', error.code);
	}

	if (!ErrorConstructor) {
		ErrorConstructor = defaultError;
	}
	return new ErrorConstructor(errorMessage || 'Internal Server Error');
}

function create(error) {
	logger.warn('create (error) is deprecated, please use createFromInternal(error) instead');
	return createFromInternal(error);
}

module.exports = {
	createFromInternal,
	create
};
