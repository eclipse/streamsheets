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
const { convert } = require('@cedalo/commons');
const { isType } = require('@cedalo/machine-core');

// update operations
const operators = {
	'+': (nr) => (value = 0) => value + nr,
	'-': (nr) => (value = 0) => value - nr,
	'=': (val) => (oldval) => (oldval == null ? val : oldval)
};
const set = (val) => () => val;
const noop = () => (value) => value;
const operator = (str) => {
	const op = operators[str.charAt(0)];
	if (op) {
		const val = str.substring(1).trim();
		return op(convert.toNumber(val, val));
	}
	return set(str);
};

// client might send string value quoted! TODO: is this the right place to handle it?
const unquote = (str) => {
	if (str.startsWith('"')) str = str.substring(1);
	if (str.endsWith('"')) str = str.substring(0, str.length - 1);
	return str;
};

const valueOperator = (cell) => {
	const value = cell.value;
	if (value != null) return isType.string(value) ? operator(unquote(value.trim())) : set(value);
	return noop();
};
const formulaOperator = (cell) => {
	const term = cell.term;
	return term ? () => term.value : set(undefined);
};
const cellOperator = (cell) => (cell.hasFormula ? formulaOperator(cell) : valueOperator(cell));

module.exports = {
	createUpdateFunction: (cell) => (cell ? cellOperator(cell) : noop())
};
