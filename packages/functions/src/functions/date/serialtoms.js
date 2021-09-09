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
const {	convert, serialnumber: { serial2ms } } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { runFunction } = require('../../utils');

const ERROR = FunctionErrors.code;

const serialtoms = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((serial) => convert.toNumber(serial.value) || ERROR.VALUE)
		.mapNextArg((utc) => convert.toBoolean(utc && utc.value, false))
		.run(serial2ms);

module.exports = serialtoms;
