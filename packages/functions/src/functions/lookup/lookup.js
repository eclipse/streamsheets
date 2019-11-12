const {
	excel,
	runFunction,
	sheet: sheetutils,
	terms: { getCellRangeFromTerm, getCellRangesFromTerm }
} = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');
const { SheetIndex, SheetRange } = require('@cedalo/machine-core');


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
			return nr > 0 ? nr : Error.code.VALUE;
		})
		.run((nr) => {
			const term = terms[Math.floor(nr)];
			return term != null ? term.value : Error.code.VALUE;
		});

const column = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg(ref => ref ? indexFromOperand(ref.operand) || Error.code.NAME : undefined)
		.run((idx) => {
			idx = idx || sheetutils.cellFromFunc(column);
			return idx ? idx.col + 1 : Error.code.VALUE;
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
			return ranges && ranges.length ? ranges : Error.code.NAME;
		})
		.mapNextArg(rowoffset => convert.toNumber(rowoffset.value, 1) - 1)
		.mapNextArg(coloffset => convert.toNumber(coloffset.value, 1) - 1)
		.mapNextArg(areanr => ((areanr && areanr.value != null) ? convert.toNumber(areanr.value, 1) - 1 : 0))
		.validate((ranges, rowoffset, coloffset, areanr) =>
			Error.ifTrue((rowoffset < 0 || coloffset < 0 || areanr < 0), Error.code.VALUE))
		.validate((ranges, rowoffset, coloffset, areanr) => {
			const range = ranges[areanr];
			return Error.ifTrue(!range || (rowoffset >= range.height || coloffset >= range.width), Error.code.REF);
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
// == MATCH ==
//
// range must be in ascending order
const findLargest = (range, pivot) => {
	let relidx = 0;
	let matchidx = 0;
	let lastvalue;
	range.some((cell) => {
		const value = cell && cell.value;
		const isAscending = lastvalue == null || lastvalue < value;
		const stop = value > pivot || !isAscending;
		relidx += stop ? 0 : 1;
		lastvalue = value;
		matchidx = !isAscending ? 0 : relidx;
		return stop;
	});
	return matchidx;
};
// range must be in descending order
const findSmallest = (range, pivot) => {
	let relidx = 0;
	let matchidx = 0;
	let lastvalue;
	range.some((cell) => {
		const value = cell && cell.value;
		const isDescending = lastvalue == null || value < lastvalue;
		const stop = value < pivot || !isDescending;
		relidx += stop ? 0 : 1;
		lastvalue = value;
		matchidx = !isDescending ? 0 : relidx;
		return stop;
	});
	return matchidx;
};
// here we support regex!
const findFirstEqual = (range, pivot) => {
	let relidx = 0;
	let matchidx = 0;
	const regex = typeof pivot === 'string' ? excel.toExcelRegEx(pivot) : null;
	range.some((cell) => {
		relidx += 1;
		const value = cell && cell.value;
		matchidx = (regex && regex.test(value)) || value === pivot ? relidx : 0;
		return matchidx > 0;
	});
	return matchidx;
};
const match = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.mapNextArg(pivot => pivot.value)
		.mapNextArg((range) => {
			const cellrange = getCellRangeFromTerm(range, sheet, true);
			return cellrange || Error.code.NAME;
		})
		.run((pivot, range) => {
			const type = term2number(terms[2], 1);
			// eslint-disable-next-line no-nested-ternary
			const findInRange = type < 0 ? findSmallest : (type > 0 ? findLargest : findFirstEqual);
			const idx = findInRange(range, pivot);
			return idx > 0 ? idx : Error.code.NA;
		});


//
// == OFFSET ==
//
const offset = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.mapNextArg(range => getCellRangeFromTerm(range, sheet) || Error.code.NAME)
		.mapNextArg(row => term2number(row, Error.code.VALUE))
		.mapNextArg(col => term2number(col, Error.code.VALUE))
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
			const error = Error.ifTrue(!startidx
				|| !endidx
				|| !sheet.isValidIndex(startidx)
				|| !sheet.isValidIndex(endidx), Error.code.REF);
			return error || [startidx, endidx];
		})
		.run((startidx, endidx) => {
			// we return a CellRangeReference...
			const offRange = createSheetRange(startidx, endidx, sheet);
			// DL-1425: if range references only one cell we returns its value in cell otherwise an error...
			if (offRange.width === 1 && offRange.height === 1) {
				const cell = offRange.cellAt(offRange.start);
				offset.term.cellValue = cell ? cell.value : 0;
			} else {
				offset.term.cellValue = Error.code.VALUE;
			}
			return offRange;
		});

const row = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg(ref => ref ? indexFromOperand(ref.operand) || Error.code.NAME : undefined)
		.run((idx) => {
			idx = idx || sheetutils.cellFromFunc(row);
			return idx ? idx.row : Error.code.VALUE;
		});
//
// == VLOOKUP ==
//
const _match = (value, search, exactly) => {
	if (value != null) {
		if (exactly) return value === search;
		value = (typeof value === 'number') ? Math.round(value) : value;
		search = (typeof value === 'number') ? Math.round(search) : search;
		return excel.wmatch(convert.toString(value), convert.toString(search));
	}
	return false;
};
const vlookup = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.withMaxArgs(4)
		.mapNextArg(lookup => lookup.value)
		.mapNextArg(range => getCellRangeFromTerm(range, sheet) || Error.code.NAME)
		.mapNextArg((coloffset) => {
			coloffset = term2number(coloffset, 1);
			return coloffset > 0 ? coloffset - 1 : Error.code.REF;
		})
		.mapNextArg((exactly) => {
			exactly = exactly && convert.toBoolean(exactly.value);
			return exactly != null ? !exactly : true;
		})
		.run((lookup, range, coloffset, exactly) => {
			let cellvalue;
			const firstcol = range.start.col;
			range.someByCol((cell, idx) => {
				let stop = idx.col > firstcol;
				if (cell && _match(cell.value, lookup, exactly)) {
					idx.set(idx.row, idx.col + coloffset);
					if (range.contains(idx)) {
						stop = true;
						cell = range.sheet.cellAt(idx);
						cellvalue = cell ? cell.value : '';
					}
				}
				return stop;
			});
			return cellvalue != null ? cellvalue : Error.code.NV;
		});

module.exports = {
	CHOOSE: choose,
	COLUMN: column,
	INDEX: index,
	MATCH: match,
	OFFSET: offset,
	ROW: row,
	VLOOKUP: vlookup
};
