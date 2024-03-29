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
const CODES = require('./src/codes');
const Errors = require('./src/Errors');
const HttpErrors = require('./src/HttpErrors');
const ErrorInfo = require('./src/ErrorInfo');
const FunctionErrors = require('./src/FunctionErrors');

module.exports = {
	CODES,
	Errors,
	HttpErrors,
	ErrorInfo,
	FunctionErrors
};
