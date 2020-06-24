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
const { jsonpath } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { runFunction, terms: { getJSONFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;

const jsonvalue = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.mapNextArg((json) => getJSONFromTerm(json) || ERROR.VALUE)
		.mapRemaingingArgs((remainingTerms) => remainingTerms.map((term) => term.value))
		.run((json, path) => {
			const value = jsonpath.query(path, json);
			return value != null ? value : ERROR.NA;
		});

module.exports = jsonvalue;
