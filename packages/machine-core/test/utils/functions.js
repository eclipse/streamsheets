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
const { SheetRange } = require('../..');
const { FunctionErrors } = require('@cedalo/error-codes');

// SOME SIMPLE FUNCTIONS FOR TESTING PURPOSE ONLY:
const termValue = (term, defVal) => term && term.value != null ? term.value : defVal;
const concat = (sheet, ...terms) =>terms.reduce((res, term) => term ? res + termValue(term, '')  : res, '');
const column = (/* sheet, ...terms */) => {
	const term = column.term;
	return term && (term.cell.col + 1);
};
const row = (/* sheet, ...terms */) => {
	const term = row.term;
	return term && term.cell.row;
};
const sum = (sheet, ...terms) =>
	terms.reduce((total, term) => {
		if (FunctionErrors.isError(total)) return total;
		const value = term && term.value;
		if (value) {
			if (value instanceof SheetRange) {
				value.iterate((cell) => {
					total += cell ? cell.value : 0;
				});
			} else if (FunctionErrors.isError(value)) {
				return value;
			} else {
				total += value;
			}
		}
		return total;
	}, 0);

const dummy = (/* sheet, ...terms */) => true;
const json = () => ({ key: 'key', value: 42 });

module.exports = {
	COLUMN: column,
	CONCAT: concat,
	COPYVALUES: dummy,
	INBOXDATA: dummy,
	JSON: json,
	OUTBOXDATA: dummy,
	READ: dummy,
	ROW: row,
	SETVALUE: dummy,
	SUM: sum,
	SWAPVALUES: dummy,
	WRITE: dummy
};
