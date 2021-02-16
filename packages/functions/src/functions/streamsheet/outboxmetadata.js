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
const { FunctionErrors } = require('@cedalo/error-codes');
const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;

const outboxmetadata = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		// .addMappedArg(() => idstr(terms.shift().value) || ERROR.NO_MSG_ID)
		// .addMappedArg(() => createJSONPath(sheet, terms))
		.run((messageId, jsonpath) => `[${messageId}]${jsonpath}`);


module.exports = outboxmetadata;
