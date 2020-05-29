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
const { toCellRanges } = require('./utils');
const Dictionary = require('../../commons/Dictionary');
const Command = require('./Command');
const Expression = require('../expr/Expression');

const expressionValue = (value) =>
	value instanceof Expression ? value.getValue() : value;

const applyMap = (map, toFormat) => {
	if (map && toFormat) toFormat.applyMap(map);
};

const getCellAt = (x, y, cells) => {
	const cell = cells[x];
	return cell ? cell[y] : undefined;
};

const createCellAt = (x, cells) => {
	cells[x] = cells[x] || {};
	return cells[x];
};

const retain = (pivotMap) => (map) => {
	const retained = new Dictionary();
	if (pivotMap && map)
		pivotMap.iterate((key) => retained.put(key, map.get(key)));
	return retained;
};

// const retainMap = (pivotMap) => (map) => map ? retain(pivotMap, map) : undefined;
const formatToMap = (format) => (format ? format.toMap(true) : undefined);

/**
 * Command to set the cell attributes within an array of ranges
 *
 * @class CellAttributesCommand
 * @param {Array} ranges Array of CellRange objects.
 */
module.exports = class CellAttributesCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		const map = new Dictionary().setMap(data.map);
		const ranges = toCellRanges(data.ranges, graph);
		return ranges && ranges.length
			? new CellAttributesCommand(ranges, map).initWithObject(data)
			: undefined;
	}

	constructor(ranges, map) {
		super();
		this._map = map.copy();
		this._ranges = ranges.map((range) => range.copy());
		this._oldFormats = { cells: {}, rows: [], cols: [] };
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldFormats = data.oldFormats;
		if (data.oldFormats.sheet)
			cmd._oldFormats.sheet = new Dictionary().setMap(
				data.oldFormats.sheet
			);
		if (data.oldFormats.rows)
			cmd._oldFormats.rows = data.oldFormats.rows.map((row) =>
				new Dictionary().setMap(row)
			);
		if (data.oldFormats.cols)
			cmd._oldFormats.cols = data.oldFormats.cols.map((col) =>
				new Dictionary().setMap(col)
			);
		Object.keys(data.oldFormats.cells).forEach((x) => {
			Object.keys(data.oldFormats.cells[x]).forEach((y) => {
				createCellAt(x, cmd._oldFormats.cells)[
					y
				] = new Dictionary().setMap(data.oldFormats.cells[x][y]);
			});
		});
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.map = this._map.getMap();
		data.ranges = this._ranges.map((range) => range.toObject());
		data.references = this._ranges.map((range) =>
			range
				.copy()
				.shiftToSheet()
				.toString()
		);
		// oldformats
		data.oldFormats = { cells: {} };
		if (this._oldFormats.sheet)
			data.oldFormats.sheet = this._oldFormats.sheet.getMap();
		if (this._oldFormats.rows)
			data.oldFormats.rows = this._oldFormats.rows.map((row) =>
				row.getMap()
			);
		if (this._oldFormats.cols)
			data.oldFormats.cols = this._oldFormats.cols.map((col) =>
				col.getMap()
			);
		Object.keys(this._oldFormats.cells).forEach((x) => {
			Object.keys(this._oldFormats.cells[x]).forEach((y) => {
				createCellAt(x, data.oldFormats.cells)[
					y
				] = this._oldFormats.cells[x][y].getMap();
			});
		});

		return data;
	}

	get sheet() {
		const range = this._ranges[0];
		return range ? range.getSheet() : undefined;
	}

	undo() {
		const sheet = this._ranges[0].getSheet();
		const data = sheet.getDataProvider();
		const rows = sheet.getRows();
		const columns = sheet.getColumns();
		const oldFormats = this._oldFormats;

		this._ranges.forEach((range) => {
			if (range.isSheetRange()) {
				applyMap(oldFormats.sheet, sheet.getDefaultCellAttributes());
				if (oldFormats.rows) {
					rows.enumerateSections((rowSection, index) =>
						applyMap(
							oldFormats.rows[index],
							rowSection.getAttributes()
						)
					);
				}
				if (oldFormats.cols) {
					columns.enumerateSections((columnSection, index) =>
						applyMap(
							oldFormats.cols[index],
							columnSection.getAttributes()
						)
					);
				}
			} else if (range.isRowRange() && oldFormats.rows) {
				range.enumerateRows((index) => {
					applyMap(
						oldFormats.rows[index],
						rows.getSectionAttributes(index)
					);
				});
			} else if (range.isColumnRange() && oldFormats.cols) {
				range.enumerateColumns((index) => {
					applyMap(
						oldFormats.cols[index],
						columns.getSectionAttributes(index)
					);
				});
			}

			// now check, if cell needs specific format or remove old, if equal
			range.enumerateCells(false, (pos) => {
				const { x, y } = pos;
				const cell = data.getRC(x, y);
				if (cell) {
					// get format for cell
					let cellAttributes = sheet.getCellAttributesAt(pos);
					if (cellAttributes) {
						const format = cellAttributes.copy();
						applyMap(getCellAt(x, y, oldFormats.cells), format);
						// remove cell format, if equal to row or column format
						cellAttributes = sheet.getCellAttributesAt(pos, false);
						cell.setAttributes(
							cellAttributes.isEqual(format, true)
								? undefined
								: format
						);
					}
				}
			});
		});
		this._ranges[0]
			.getSheet()
			.getGraph()
			.markDirty();
	}

	redo() {
		const sheet = this._ranges[0].getSheet();
		const data = sheet.getDataProvider();
		const rows = sheet.getRows();
		const columns = sheet.getColumns();
		const oldFormats = this._oldFormats;
		const createRetainMap = retain(this._map);
		let cell;
		let format;

		this._ranges.forEach((range) => {
			if (range.isSheetRange()) {
				format = sheet.getDefaultCellAttributes();
				oldFormats.sheet = createRetainMap(formatToMap(format)).map(
					expressionValue
				);
				format.applyMap(this._map);
				oldFormats.rows = [];
				oldFormats.cols = [];
				rows.enumerateSections((rowSection, index) => {
					const oldFormat = rowSection.getAttributes();
					if (oldFormat)
						oldFormats.rows[index] = formatToMap(oldFormat).map(
							expressionValue
						);
					rowSection.setAttributes(undefined);
				});
				columns.enumerateSections((columnSection, index) => {
					const oldFormat = columnSection.getAttributes();
					if (oldFormat)
						oldFormats.cols[index] = formatToMap(oldFormat).map(
							expressionValue
						);
					columnSection.setAttributes(undefined);
				});
			} else if (range.isRowRange()) {
				range.enumerateRows((index) => {
					format = sheet
						.getRows()
						.getOrCreateSectionAttributes(index);
					oldFormats.rows = [];
					oldFormats.rows[index] = createRetainMap(
						formatToMap(format)
					).map(expressionValue);
					format.applyMap(this._map);
				});
			} else if (range.isColumnRange()) {
				range.enumerateColumns((index) => {
					format = sheet
						.getColumns()
						.getOrCreateSectionAttributes(index);
					oldFormats.cols = [];
					oldFormats.cols[index] = createRetainMap(
						formatToMap(format)
					).map(expressionValue);
					format.applyMap(this._map);
				});
			}

			let cellAttributes;

			// now check, if cell needs specific format or remove old, if equal
			range.enumerateCells(false, (pos) => {
				// get format for cell
				cellAttributes = sheet.getCellAttributesAt(pos);
				if (cellAttributes) {
					createCellAt(pos.x, oldFormats.cells)[
						pos.y
					] = createRetainMap(formatToMap(cellAttributes)).map(
						expressionValue
					);
					format = cellAttributes.copy();
					// apply to format
					format.applyMap(this._map);

					// remove cell format, if equal to row or column format
					cellAttributes = sheet.getCellAttributesAt(pos, false);
					if (cellAttributes.isEqual(format, true)) {
						cell = data.get(pos);
						if (cell) {
							cell.setAttributes(undefined);
						}
					} else {
						cell = data.create(pos);
						cell.setAttributes(format);
					}
				}
			});
		});

		this._ranges[0]
			.getSheet()
			.getGraph()
			.markDirty();
	}

	execute() {
		this.redo();
	}
};
