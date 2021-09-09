/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { NullTerm, Term } = require('@cedalo/parser');
const {	runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;

const deleteCell = (cell, index) => cell.sheet.setCellAt(index, undefined);
const clearValue = (cell) => cell.setInternalValue(null);
const clearFormula = (cell) => {
	cell.term = cell.value == null ? new NullTerm() : Term.fromValue(cell.value);
};
const clearFormats = () => {};

// eslint-disable-next-line no-bitwise
const has = (type) => (nr) => (type & nr) === nr;

const createFns = (type) => {
	const fns = [];
	if (type === 7) fns.push(deleteCell);
	else {
		const typeHas = has(type);
		if (typeHas(1)) fns.push(clearValue);
		if (typeHas(2)) fns.push(clearFormula);
		if (typeHas(4)) fns.push(clearFormats);
	}
	return (cell, index) => fns.forEach((fn) => fn(cell, index));
};

const iterateRange = (range, fns) => {
	range.iterate((cell, index) => (cell ? fns(cell, index) : undefined));
	return true;
};

const clearcells = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((range) => getCellRangeFromTerm(range, sheet) || ERROR.VALUE)
		.mapNextArg((type) => (type ? convert.toNumber(type.value, 1) : 1))
		.run((range, type) => {
			return type > 0 && type < 8 ? iterateRange(range, createFns(type)) : ERROR.VALUE;
		});

module.exports = clearcells;
