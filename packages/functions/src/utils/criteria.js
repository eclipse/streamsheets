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
const { FunctionErrors } = require('@cedalo/error-codes');
const { SheetIndex } = require('@cedalo/machine-core');
const Criterion = require('./Criterion');
const { getCellRangeFromTerm } = require('./terms');

const ERROR = FunctionErrors.code;


const tmpIndex = SheetIndex.create(0, 0);

const getCellValueAt = (range, offset) => {
	const cell = range.cellAt(tmpIndex.set(range.startIdx.row + offset.row, range.startIdx.col + offset.col));
	return cell != null ? cell.value : undefined;
};
const isFulFilled = (criteria, offset) =>
	criteria.every(([range, criterion]) => {
		const cell = range.cellAt(tmpIndex.set(range.startIdx.row + offset.row, range.startIdx.col + offset.col));
		const val = cell != null ? cell.value : undefined;
		// currently we ignore if value is not available...
		return val != null ? criterion.isFulFilledBy(val) : true;
	});

const getValues = (criteria, valueRange) => {
	// note: much simpler would be to reduce valueRange, but that would lead to wrong offsets!
	// => but we want to  use same logic for all _if() & _ifs() functions!!
	const first = criteria.shift();
	const { 0: firstRange, 1: firstCriterion } = first;
	const start = firstRange.startIdx;
	return firstRange.reduce((values, cell, index) => {
		const val = cell != null ? cell.value : undefined;
		if (val != null && firstCriterion.isFulFilledBy(val)) {
			const offset = index.set(index.row - start.row, index.col - start.col);
			if (isFulFilled(criteria, offset)) {
				const value = valueRange ? getCellValueAt(valueRange, offset) : val;
				if (value != null) values.push(value);
			}
		}
		return values;
	}, []);
};

const getNumbers = (criteria, valueRange) => {
	const values = getValues(criteria, valueRange);
	return values.reduce((numbers, val) => {
		const nr = convert.toNumberStrict(val);
		if (nr != null) numbers.push(nr);
		return numbers;
	}, []);
};

const fromRangeCriterionTerms = (terms, sheet) => {
	const arr = [];
	for (let i = 0; i < terms.length; i += 2) {
		const range = getCellRangeFromTerm(terms[i], sheet);
		const criterion = convert.toString(terms[i + 1].value, '0');
		if (range == null || criterion == null) break;
		arr.push([range, Criterion.of(criterion)]);
	}
	return arr.length === terms.length / 2 ? arr : undefined;
};
const createFromTerms = (terms, sheet) => {
	const error = terms.length % 2 !== 0 ? ERROR.ARGS : undefined;
	const criteria = fromRangeCriterionTerms(terms, sheet);
	return error || criteria || ERROR.INVALID_PARAM;
};

const equalRangeShapes = (criteria, height, width) =>
	criteria.every(([cr]) => cr.width === width && cr.height === height);

module.exports = {
	createFromTerms,
	getValues,
	getNumbers,
	hasEqualRangeShapes: (criteria, pivotrange) => equalRangeShapes(criteria, pivotrange.height, pivotrange.width)
};
