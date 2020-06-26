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

const ERROR = FunctionErrors.code;

const checkParam = (terms, index) => terms.length > index && terms[index].value !== null;

// simply copied from original olap.js => seems not to be OLAP dependent...
const select = (sheet, ...terms) => {
	if (!sheet || !terms || terms.length < 1) {
		return ERROR.ARGS;
	}

	const target = checkParam(terms, 1) ? terms[1].value : '';

	return target;
};
select.displayName = true;

module.exports = select;
