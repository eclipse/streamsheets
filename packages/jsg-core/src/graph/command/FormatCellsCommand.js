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
const Command = require('./Command');
const Dictionary = require('../../commons/Dictionary');
const { createRetainMap, toValuesMap, toCellRanges } = require('./utils');

const applyMap = (map, toFormat) =>
	map && toFormat ? toFormat.applyMap(map) : undefined;

const undoFormat = (x, y, map, sheet) => {
	let cellFormat = sheet.getFormatAtRC(x, y, true);
	if (cellFormat) {
		const format = cellFormat.copy();
		applyMap(map, format);
		// remove cell format, if equal to row or column format
		cellFormat = sheet.getFormatAtRC(x, y, false);
		cellFormat = cellFormat.isEqual(format, true) ? undefined : format;
	}
	return cellFormat;
};

/**
 * Command to format the cells within an array of ranges
 *
 * @class FormatCellsCommand
 * @param {Array} ranges Array of CellRange objects.
 */
module.exports = class FormatCellsCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		const ranges = toCellRanges(data.ranges, graph);
		const map = new Dictionary().setMap(data.map);
		return ranges && ranges.length
			? new FormatCellsCommand(ranges, map).initWithObject(data)
			: undefined;
	}

	constructor(ranges, map) {
		super();

		this._map = map;
		this._ranges = ranges.map((range) => range.copy());
		this._oldFormats = { cells: [] };
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
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
		cmd._oldFormats.cells = data.oldFormats.cells.map(({ x, y, map }) => ({
			x,
			y,
			map: new Dictionary().setMap(map)
		}));
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.map = this._map.getMap();
		data.ranges = this._ranges.map((range) => range.toObject());
		data.oldFormats = this._oldFormats;
		data.oldFormats = { cells: [] };
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
		data.oldFormats.cells = this._oldFormats.cells.map(({ x, y, map }) => ({
			x,
			y,
			map: map.getMap()
		}));
		return data;
	}

	undo() {
		const sheet = this._ranges[0].getSheet();
		const data = sheet.getDataProvider();
		const rows = sheet.getRows();
		const columns = sheet.getColumns();
		const oldFormats = this._oldFormats;

		this._ranges.forEach((range) => {
			if (range.isSheetRange()) {
				applyMap(oldFormats.sheet, sheet.getDefaultFormat());
				if (oldFormats.rows) {
					rows.enumerateSections((section, index) =>
						applyMap(oldFormats.rows[index], section.getFormat())
					);
				}
				if (oldFormats.cols) {
					columns.enumerateSections((section, index) =>
						applyMap(oldFormats.cols[index], section.getFormat())
					);
				}
			} else if (range.isRowRange() && oldFormats.rows) {
				range.enumerateRows((index) =>
					applyMap(
						oldFormats.rows[index],
						rows.getSectionFormat(index)
					)
				);
			} else if (range.isColumnRange() && oldFormats.cols) {
				range.enumerateColumns((index) =>
					applyMap(
						oldFormats.cols[index],
						columns.getSectionFormat(index)
					)
				);
			}

			// now check, if cell needs specific format or remove old, if equal
			oldFormats.cells.forEach(({ x, y, map }) => {
				const cell = data.getRC(x, y);
				if (cell) {
					const oldFormat = map.isEmpty()
						? undefined
						: undoFormat(x, y, map, sheet);
					cell.setFormat(oldFormat);
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
		let format;

		this._ranges.forEach((range) => {
			if (range.isSheetRange()) {
				format = sheet.getDefaultFormat();
				oldFormats.rows = [];
				oldFormats.cols = [];
				oldFormats.sheet = toValuesMap(
					createRetainMap(format, this._map)
				);
				format.applyMap(this._map);
				rows.enumerateSections((rowSection, index) => {
					const oldFormat = rowSection.getFormat();
					if (oldFormat)
						oldFormats.rows[index] = toValuesMap(oldFormat.toMap());
					rowSection.setFormat(undefined);
				});
				columns.enumerateSections((columnSection, index) => {
					const oldFormat = columnSection.getFormat();
					if (oldFormat)
						oldFormats.cols[index] = toValuesMap(oldFormat.toMap());
					columnSection.setFormat(undefined);
				});
			} else if (range.isRowRange()) {
				oldFormats.rows = [];
				range.enumerateRows((index) => {
					format = sheet.getRows().getOrCreateSectionFormat(index);
					oldFormats.rows[index] = toValuesMap(
						createRetainMap(format, this._map)
					);
					format.applyMap(this._map);
				});
			} else if (range.isColumnRange()) {
				oldFormats.cols = [];
				range.enumerateColumns((index) => {
					format = sheet.getColumns().getOrCreateSectionFormat(index);
					oldFormats.cols[index] = toValuesMap(
						createRetainMap(format, this._map)
					);
					format.applyMap(this._map);
				});
			}

			let cellFormat;

			// now check, if cell needs specific format or remove old, if equal
			range.enumerateCells(false, (pos) => {
				// we do not reuse pos, because it is a cached point:
				const { x, y } = pos;
				let cell = data.get(pos);
				const oldFormat = cell && cell.getFormat();
				const oldFormatMap = oldFormat
					? toValuesMap(createRetainMap(oldFormat, this._map))
					: new Dictionary();
				oldFormats.cells.push({ x, y, map: oldFormatMap });

				// get format for cell
				cellFormat = sheet.getFormatAt(pos, true);
				if (cellFormat) {
					format = cellFormat.copy();
					// apply to format
					format.applyMap(this._map);
					// remove cell format, if equal to row or column format
					cellFormat = sheet.getFormatAt(pos, false);
					if (cellFormat.isEqual(format, true)) {
						if (cell) {
							cell.setFormat(undefined);
						}
					} else {
						cell = data.create(pos);
						cell.setFormat(format);
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
