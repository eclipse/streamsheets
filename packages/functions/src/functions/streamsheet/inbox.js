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
const {runFunction, sheet: { getStreamSheet } } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const inbox = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(2)
		.mapNextArg((term) => getStreamSheet(term, sheet) || ERROR.NO_STREAMSHEET)
		.mapNextArg((msgid) => (msgid ? msgid.value || '' : ''))
		.run((streamsheet, messageId) => `[${streamsheet.name}][${messageId}]`);

module.exports = inbox;
