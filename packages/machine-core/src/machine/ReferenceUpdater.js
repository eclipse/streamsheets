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
const addOffsetToSheeetIndex = (offset) => (index) => {
	index.set(
		!index.isRowAbsolute ? index.row + offset.row : index.row,
		!index.isColAbsolute ? index.col + offset.col : index.col
	);
};
const applyPivotToSheetIndex = (pivot) => (index) => {
	index.set(
		!index.isRowAbsolute && pivot.row != null && index.row >= pivot.row ? index.row + pivot.count : index.row,
		!index.isColAbsolute && pivot.col != null && index.col >= pivot.col ? index.col + pivot.count : index.col
	);
};
const addOffsetIfIndexInRange = (range, addOffset) => (index) => {
	if (range.contains(index)) {
		addOffset(index);
	}
};
const updateTerm = (indexUpdater, sheet) => (term) => {
	if (sheet == null || term.operand.sheet === sheet) {
		if (term.operand.isTypeOf('CellReference')) {
			indexUpdater(term.operand.index);
		} else if (term.operand.isTypeOf('CellRangeReference')) {
			const range = term.operand.range;
			indexUpdater(range.start);
			indexUpdater(range.end);
		}
	}
	return true;
};

const updateCell = (cell, updater) => cell.term && cell.term.traverse(updater, null, false);

const updateAllReferences = (machine, termUpdater) => {
	if (machine) {
		machine.namedCells.forEach(cell => updateCell(cell, termUpdater));
		machine.streamsheets.forEach((streamsheet) => {
			const sheet = streamsheet.sheet;
			sheet.graphCells.forEach(cell => updateCell(cell, termUpdater));
			sheet.namedCells.forEach(cell => updateCell(cell, termUpdater));
			sheet.iterate(cell => updateCell(cell, termUpdater));
		});
	}
};


class ReferenceUpdater {
	static updateRow(sheet, index, count) {
		const applyPivot = applyPivotToSheetIndex({ row: index, count });
		const termUpdater = updateTerm(applyPivot, sheet);
		updateAllReferences(sheet.machine, termUpdater);
	}

	static updateColumn(sheet, index, count) {
		const applyPivot = applyPivotToSheetIndex({ col: index, count });
		const termUpdater = updateTerm(applyPivot, sheet);
		updateAllReferences(sheet.machine, termUpdater);
	}

	static updateCell(cell, offset) {
		const addOffset = addOffsetToSheeetIndex(offset);
		const termUpdater = updateTerm(addOffset);
		updateCell(cell, termUpdater);
	}

	static updateAllCellReferences(sheet, range, offset) {
		const addOffset = addOffsetToSheeetIndex(offset);
		const adjust = addOffsetIfIndexInRange(range, addOffset);
		const termUpdater = updateTerm(adjust);
		updateAllReferences(sheet.machine, termUpdater);
	}
}

module.exports = ReferenceUpdater;
