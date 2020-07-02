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
const SheetIndex = require('../machine/SheetIndex');
const { Operand } = require('@cedalo/parser');
const State = require('../State');
const MachineTaskMessagingClient = require('./MachineTaskMessagingClient');

// if there is a formula, the cell has to be send to the client, even if value === ''
const isEmptyCell = (cell) => cell.term == null && cell.value === '';


// either pass SheetIndex or col & row number...
const cellDescriptor = (cell, row, col) => {
	const descr = cell ? cell.description() : {};
	descr.reference = typeof row === 'number' ? `${SheetIndex.columnAsStr(col)}${row}` : row.toString();
	return descr;
};

const cellDescriptorAsObject = (cell, row, col) => {
	const descr = cell ? cell.description() : {};
	const index = typeof row === 'number' ? `${SheetIndex.columnAsStr(col)}${row}` : row.toString();
	return { [index]: descr };
};

const updateNamedCellRefs = (machine, oldName, newName) =>
	machine.streamsheets.forEach((streamsheet) => {
		const updateCells = [];
		streamsheet.sheet.iterate((cell, row, col) => {
			if (cell.term && cell.references && cell.references.includes(oldName)) {
				const newTerm = cell.term.copy();
				newTerm.traverse(
					(term) => {
						if (term.hasOperandOfType(Operand.TYPE.REFERENCE) && term.operand.name === oldName) {
							term.operand.name = newName;
						}
						return true;
					},
					null,
					false
				);
				cell.term = newTerm;
				updateCells.push({ cell, row, col });
			}
		});
		streamsheet.onSheetCellsUpdated(updateCells);
	});

const collectMachineStats = machine => ({
	stats: { ...machine.stats },
	streamsheets: machine.streamsheets.map(streamsheet => ({
		id: streamsheet.id,
		name: streamsheet.name,
		stats: { ...streamsheet.stats }
	}))
});

const mapSheetCells = (sheet, fn) => {
	const cells = [];
	sheet.iterate((cell, rowidx, colidx) => {
		if (cell && !isEmptyCell(cell)) cells.push(fn(cell, rowidx, colidx));
	});
	return cells;	
};
const reduceSheetCells = (sheet, fn, acc) => {
	sheet.iterate((cell, rowidx, colidx) => {
		if (cell && !isEmptyCell(cell)) acc = fn(acc, cell, rowidx, colidx);
	});
	return acc;
};
const getSheetCellsAsList = (sheet) => mapSheetCells(sheet, cellDescriptor);
const getSheetCellsAsObject = (sheet) => {
	const cellidx = SheetIndex.create(1, 0);
	return reduceSheetCells(sheet, (acc, cell, rowidx, colidx) => {
		cellidx.set(rowidx, colidx);
		acc[cellidx.toString()] = cell.description();
		return acc;
	}, {});
};
	
const publishIf = (...fns) => (event) => {
	if(fns.reduce((valid, fn) => valid && fn(), true)) MachineTaskMessagingClient.publishEvent(event);
};
const isNotRunning = (machine) => () => machine.state !== State.RUNNING;
const isNotStepping = (machine) => () => !machine.isManualStep;


const getCellFromReference = (str, sheet) => {
	const parts = str.split('!');
	if (parts.length === 2) {
		const machine = sheet.machine;
		const streamsheet = machine ? machine.getStreamSheetByName(parts[0]) : undefined;
		str = parts[1];
		sheet = streamsheet ? streamsheet.sheet : undefined;
	}
	return { sheet, cell: sheet ? sheet.cellAt(str) : undefined };
};


module.exports = {
	cellDescriptor,
	cellDescriptorAsObject,
	collectMachineStats,
	getCellFromReference,
	getSheetCellsAsList,
	getSheetCellsAsObject,
	isNotRunning,
	isNotStepping,
	mapSheetCells,
	publishIf,
	reduceSheetCells,
	updateNamedCellRefs
};
