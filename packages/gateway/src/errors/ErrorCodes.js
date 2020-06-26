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
const ERROR_CODES = {
	USERNAME_IN_USE: 'USERNAME_IN_USE',
	EMAIL_IN_USE: 'EMAIL_IN_USE',
	USER_NOT_FOUND: 'USER_NOT_FOUND',
	USERNAME_INVALID: 'USERNAME_INVALID',
	EMAIL_INVALID: 'EMAIL_INVALID',
	PASSWORD_INVALID: 'PASSWORD_INVALID',
	LOCALE_INVALID: 'LOCALE_INVALID',
	NOT_ALLOWED: 'NOT_ALLOWED',
	CONFLICT: 'CONFLICT',
	INVALID: 'INVALID'
};

module.exports = ERROR_CODES;
