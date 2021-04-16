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
const CellRange = require('../../model/CellRange');
const Selection = require('../../model/Selection');

const newCellRange = (sheet, range) => new CellRange(
	sheet,
	range.x1,
	range.y1,
	range.x2,
	range.y2,
	range.x1R,
	range.y1R,
	range.x2R,
	range.y2R
);

const toCellRange = (range, graph) => {
	const sheet = graph.getItemById(range.id);
	return sheet ? newCellRange(sheet, range) : undefined;
};
const toCellRanges = (ranges, graph) => {
	const sheet = graph.getItemById(ranges[0].id);
	return sheet ? ranges.map(range => newCellRange(sheet, range)) : undefined;
};

const rangeAsString = (range, shiftIt = true) => (shiftIt ? range.shiftToSheet().toString() : range.toString());
const getRangeIndex = (range, shiftIt) => rangeAsString(range, shiftIt).split(':')[0];
const getCellReference = (range, shiftIt = true) => {
	if (shiftIt) range.shiftToSheet();
	return { col: range.getColumnString(range.getX1()), row: range.getY1() + 1 };
};
const toCellsColsRows = (ranges, sheet) => {
	const tmprange = new CellRange(sheet, 0, 0, 0, 0);
	const spreaded = { cells: [], cols: [], rows: [] };
	ranges.forEach((range) => {
		if (range.isSheetRange()) {
			// TODO: sheet support...
		} else if (range.isColumnRange()) {
			range.enumerateColumns((index) => {
				const col = getRangeIndex(tmprange.set(index, 1, index, sheet.getRowCount()));
				spreaded.cols.push({ index, ref: { col } });
			});
		} else if (range.isRowRange()) {
			range.enumerateRows((index) => {
				const row = getRangeIndex(tmprange.set(1, index, sheet.getColumnCount(), index));
				spreaded.rows.push({ index, ref: { row } });
			});
		} else {
			range.enumerateCells(false, (pos) => {
				const ref = getCellReference(tmprange.set(pos.x, pos.y));
				spreaded.cells.push({ ref });
			});
		}
	});
	return spreaded;
};

const getCellRangesFromSelection = (ref, sheet) => {
	const selection = Selection.fromStringMulti(ref, sheet);
	return selection ? selection._ranges : [];
};

module.exports = {
	getCellReference,
	getCellRangesFromSelection,
	toCellRange,
	toCellRanges,
	toCellsColsRows
};
