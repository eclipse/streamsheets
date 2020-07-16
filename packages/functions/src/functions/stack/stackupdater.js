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
const opfunc = (str, op) => {
	const val = str.substring(1).trim();
	return op(convert.toNumber(val, val));
};
const termfunc = (term) => term ? () => term.value : set(undefined);

const operator = (str) => {
	const op = operators[str.charAt(0)];
	return op ? opfunc(str, op) : set(str);
};
const valueOperator = (cell) => {
	const value = cell.value;
	if (value != null) return isType.string(value) ? operator(value.trim()) : set(value);
	return noop();
};
const formulaOperator = (cell) => {
	// DL-4076: now requires to support that formula might returns an operator string
	const cellvalue = cell.value;
	const op = isType.string(cellvalue) && operators[cellvalue.charAt(0)];
	return op ? opfunc(cellvalue, op) : termfunc(cell.term);
};
const cellOperator = (cell) => (cell.hasFormula ? formulaOperator(cell) : valueOperator(cell));

module.exports = {
	createUpdateFunction: (cell) => (cell ? cellOperator(cell) : noop())
};
