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
const {
	Criterion,
	runFunction,
	sheet: sheetutils,
	terms: { getCellRangeFromTerm, getCellRangesFromTerm }
} = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { SheetIndex, SheetRange, referenceFromString } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const createSheetRange = (start, end, sheet) => {
	const range = SheetRange.fromStartEnd(start, end);
	range.sheet = sheet;
	return range;
};

const term2number = (term, defval) => term ? convert.toNumber(term.value, defval) : defval;
const indexFromOperand = op => 
	// eslint-disable-next-line no-nested-ternary
	op.isTypeOf('CellReference') ? op.index : (op.isTypeOf('CellRangeReference') ? op.value.start : undefined);


//
// == CHOOSE ==
//
const choose = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.mapNextArg((nrTerm) => {
			const nr = term2number(nrTerm, 0);
			return nr > 0 ? nr : ERROR.VALUE;
		})
		.run((nr) => {
			const term = terms[Math.floor(nr)];
			return term != null ? term.value : ERROR.VALUE;
		});

const column = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg(ref => ref ? indexFromOperand(ref.operand) || ERROR.NAME : undefined)
		.run((idx) => {
			idx = idx || sheetutils.cellFromFunc(column);
			return idx ? idx.col + 1 : ERROR.VALUE;
		});
	
//
// == INDEX ==
//
const index = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.withMaxArgs(4)
		.mapNextArg((ranges) => {
			ranges = getCellRangesFromTerm(ranges, sheet, true);
			return ranges && ranges.length ? ranges : ERROR.NAME;
		})
		.mapNextArg(rowoffset => convert.toNumber(rowoffset.value, 1) - 1)
		.mapNextArg(coloffset => convert.toNumber(coloffset.value, 1) - 1)
		.mapNextArg(areanr => ((areanr && areanr.value != null) ? convert.toNumber(areanr.value, 1) - 1 : 0))
		.validate((ranges, rowoffset, coloffset, areanr) =>
			FunctionErrors.ifTrue((rowoffset < 0 || coloffset < 0 || areanr < 0), ERROR.VALUE))
		.validate((ranges, rowoffset, coloffset, areanr) => {
			const range = ranges[areanr];
			return FunctionErrors.ifTrue(!range || (rowoffset >= range.height || coloffset >= range.width), ERROR.REF);
		})
		.run((ranges, rowoffset, coloffset, areanr) => {
			let value = '';
			const range = ranges[areanr];
			const targetIdx = range.start.copy();
			if (targetIdx.set(targetIdx.row + rowoffset, targetIdx.col + coloffset)) {
				// get target cell:
				const cell = range.sheet.cellAt(targetIdx);
				value = (cell && cell.isDefined) ? cell.value : value;
				index.term.cellIndex = targetIdx;
			}
			return value;
		});

//
// == INDIRECT ==
//
const convertRC = (str) => {
	const colidx = str.toUpperCase().indexOf('C');
	const row = parseInt(str.substring(1, colidx), 10);
	const col = parseInt(str.substring(colidx + 1), 10) - 1;
	return `${SheetIndex.columnAsStr(col)}${row}`;	
};
const refStrFromRC = (rcstr) => rcstr.split(':').map(convertRC).join(':');
const indirect = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(ref => ref)
		.mapNextArg((isA1Style) => isA1Style ? convert.toBoolean(isA1Style.value, true) : true)
		.run((ref, isA1Style) =>  {
			const scope = ref.operand._streamsheetId ? ref.operand.sheet : sheet;
			const val = isA1Style ? ref.value : refStrFromRC(ref.value);
			ref = typeof val === 'string' ? referenceFromString(val, scope) : undefined;
			return ref ? ref.value : ERROR.REF
		});

//
// == MATCH ==
//
const getRelativeIndex = (range, idx) => {
	const start = range.start;
	const col = idx.col - start.col;
	const row = idx.row - start.row;
	return col !== 0 ? col : row;
};
// range must be in ascending order
const findLargest = (range, pivot) => {
	let matchidx = 0;
	if (pivot != null) {
		let lastvalue;
		const type = typeof pivot;
		range.some((cell, idx) => {
			let stop = false;
			const value = cell && cell.value;
			// eslint-disable-next-line valid-typeof
			if (value != null && (typeof value === type)) {
				const isAscending = lastvalue == null || lastvalue < value;
				stop = value > pivot || !isAscending;
				if (!stop) {
					lastvalue = value;
					matchidx = !isAscending ? 0 : getRelativeIndex(range, idx) + 1;
				}
			}
			return stop;
		});
	}
	return matchidx;
};
const findSmallest = (range, pivot) => {
	let matchidx = 0;
	if (pivot != null) {
		let lastvalue;
		const type = typeof pivot;
		range.some((cell, idx) => {
			let stop = false;
			const value = cell && cell.value;
			// eslint-disable-next-line valid-typeof
			if (value != null && (typeof value === type)) {
				const isDescending = lastvalue == null || value < lastvalue;
				stop = value < pivot || !isDescending;
				if (!stop) {
					lastvalue = value;
					matchidx = !isDescending ? 0 : getRelativeIndex(range, idx) + 1;
				}
			}
			return stop;
		});
	}
	return matchidx;
};
// here we support regex!
const findFirstEqual = (range, pivot) => {
	let matchidx = 0;
	if (pivot != null) {
		let relidx = 0;
		const criterion = typeof pivot === 'string' ? Criterion.ofMatch(pivot) : null;
		range.some((cell) => {
			relidx += 1;
			const value = cell && cell.value;
			matchidx = (criterion && criterion.isFulFilledBy(value)) || value === pivot ? relidx : 0;
			return matchidx > 0;
		});
	}
	return matchidx;
};
const isCellRangeFlat = (range) => range.width > 1 ? range.height === 1 : range.height >= 1;
const match = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.mapNextArg(pivot => pivot.value)
		.mapNextArg((range) => {
			const cellrange = getCellRangeFromTerm(range, sheet, true);
			// eslint-disable-next-line no-nested-ternary
			return cellrange ? (isCellRangeFlat(cellrange) ? cellrange : ERROR.NA) : ERROR.NAME;
		})
		.run((pivot, range) => {
			const type = term2number(terms[2], 1);
			// eslint-disable-next-line no-nested-ternary
			const findInRange = type < 0 ? findSmallest : (type > 0 ? findLargest : findFirstEqual);
			const idx = findInRange(range, pivot);
			return idx > 0 ? idx : ERROR.NA;
		});


//
// == OFFSET ==
//
const offset = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.mapNextArg(range => getCellRangeFromTerm(range, sheet) || ERROR.NAME)
		.mapNextArg(row => term2number(row, ERROR.VALUE))
		.mapNextArg(col => term2number(col, ERROR.VALUE))
		.mapNextArg(height => term2number(height, -1))
		.mapNextArg(width => term2number(width, -1))
		.reduce((range, row, col, height, width) => {
			const cellindex = range.start;
			const startidx = SheetIndex.create(cellindex.row + row, cellindex.col + col);
			const endidx = startidx
				? SheetIndex.create(
					startidx.row + (height < 0 ? range.height : height) - 1,
					startidx.col + (width < 0 ? range.width : width) - 1)
				: null;
			// check new indices (against sheet of function!!):
			const error = FunctionErrors.ifTrue(!startidx
				|| !endidx
				|| !sheet.isValidIndex(startidx)
				|| !sheet.isValidIndex(endidx), ERROR.REF);
			return error || [startidx, endidx];
		})
		.run((startidx, endidx) => {
			// we return a CellRangeReference...
			let offRange = createSheetRange(startidx, endidx, sheet);
			const { start, height, width } = offRange;
			// DL-1425: if range references only one cell we return its value...
			if (width === 1 && height === 1) {
				const cell = offRange.cellAt(start);
				offRange = cell ? cell.value : undefined;
				// we need cellIndex to create SheetRange from within other terms
				offset.term.cellIndex = start;
			}
			return offRange;
		});

const row = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg(ref => ref ? indexFromOperand(ref.operand) || ERROR.NAME : undefined)
		.run((idx) => {
			idx = idx || sheetutils.cellFromFunc(row);
			return idx ? idx.row : ERROR.VALUE;
		});
//
// == VLOOKUP ==
//
const doLookup = (search, range, exactly) => {
	let lastIndex;
	let lastValue;
	const firstcol = range.start.col;
	const searchType = typeof search;
	const criterion = !exactly && Criterion.ofMatch(convert.toString(search));
	range.someByCol((cell, idx) => {
		let stop = idx.col > firstcol;
		if (!stop && cell) {
			const value = cell.value;
			if (value === search) {
				stop = true;
				lastIndex = idx.copy();
				// eslint-disable-next-line
			} else if (!exactly && searchType === typeof value) {
				if (criterion && criterion.isFulFilledBy(convert.toString(value))) {
					stop = true;
					lastIndex = idx.copy();
				} else if (value < search) {
					if (lastValue == null || value > lastValue) {
						lastValue = value;
						lastIndex = idx.copy();
					}
				}
			}
		}
		return stop;
	});
	return lastIndex
};
const vlookup = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.withMaxArgs(4)
		.mapNextArg(lookup => lookup.value)
		.mapNextArg(range => getCellRangeFromTerm(range, sheet) || ERROR.NAME)
		.mapNextArg((coloffset) => {
			coloffset = term2number(coloffset, 1);
			return coloffset > 0 ? coloffset - 1 : ERROR.REF;
		})
		.mapNextArg((exactly) => {
			exactly = exactly && convert.toBoolean(exactly.value);
			return exactly != null ? !exactly : false;
		})
		.run((lookup, range, coloffset, exactly) => {
			let cellvalue;
			const idx = doLookup(lookup, range, exactly);
			if (idx) {
				idx.set(idx.row, idx.col + coloffset);
				if (range.contains(idx)) {
					const cell = range.sheet.cellAt(idx);
					cellvalue = cell ? cell.value : '';
				}
			}
			return cellvalue != null ? cellvalue : ERROR.NA;
		});

module.exports = {
	CHOOSE: choose,
	COLUMN: column,
	INDEX: index,
	INDIRECT: indirect,
	MATCH: match,
	OFFSET: offset,
	ROW: row,
	VLOOKUP: vlookup
};
