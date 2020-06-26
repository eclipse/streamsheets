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
const ERROR_CODES = require('./ErrorCodes');

const conflict = (message, fieldErrors) => ({ message, code: ERROR_CODES.CONFLICT, fieldErrors, own: true });
const notFound = (message, code) => ({ message, code, own: true });
const invalid = (message, fieldErrors) => ({ message, code: ERROR_CODES.INVALID, fieldErrors, own: true });

module.exports = {
	conflict,
	notFound,
	invalid
};
