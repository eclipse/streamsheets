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

/**
 * Command to format the cells within an array of ranges
 *
 * @class FormatCellsCommand
 * @param {Array} ranges Array of CellRange objects.
 */
module.exports = class TextFormatCellsCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const ranges = toCellRanges(data.ranges, graph);
		if (ranges && ranges.length) {
			const map = new Dictionary().setMap(data.map);
			cmd = new TextFormatCellsCommand(ranges, map).initWithObject(data);
		}
		return cmd;
	}

	constructor(ranges, map) {
		super();

		this._ranges = ranges.map((range) => range.copy());
		this._map = map;
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
		data.references = this._ranges.map((range) =>
			range
				.copy()
				.shiftToSheet()
				.toString()
		);
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
				applyMap(oldFormats.sheet, sheet.getDefaultTextFormat());
				if (oldFormats.rows) {
					rows.enumerateSections((rowSection, index) =>
						applyMap(
							oldFormats.rows[index],
							rowSection.getTextFormat()
						)
					);
				}
				if (oldFormats.cols) {
					columns.enumerateSections((columnSection, index) =>
						applyMap(
							oldFormats.cols[index],
							columnSection.getTextFormat()
						)
					);
				}
			} else if (range.isRowRange() && oldFormats.rows) {
				range.enumerateRows((index) =>
					applyMap(
						oldFormats.rows[index],
						rows.getSectionTextFormat(index)
					)
				);
			} else if (range.isColumnRange() && oldFormats.cols) {
				range.enumerateColumns((index) =>
					applyMap(
						oldFormats.cols[index],
						columns.getSectionTextFormat(index)
					)
				);
			}

			// now check, if cell needs specific format or remove old, if equal
			oldFormats.cells.forEach(({ x, y, map }) => {
				const cell = data.getRC(x, y);
				if (cell) {
					// get format for cell
					let cellFormat = sheet.getTextFormatAtRC(x, y, true);
					if (cellFormat) {
						const format = cellFormat.copy();
						applyMap(map, format);
						// remove cell format, if equal to row or column format
						cellFormat = sheet.getTextFormatAtRC(x, y, false);
						cell.setTextFormat(
							map.isEmpty() || cellFormat.isEqual(format, true)
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
		let format;

		this._ranges.forEach((range) => {
			if (range.isSheetRange()) {
				format = sheet.getDefaultTextFormat();
				oldFormats.sheet = toValuesMap(
					createRetainMap(format, this._map)
				);
				format.applyMap(this._map);
				oldFormats.rows = [];
				rows.enumerateSections((rowSection, index) => {
					const oldTextFormat = rowSection.getTextFormat();
					if (oldTextFormat)
						oldFormats.rows[index] = toValuesMap(
							oldTextFormat.toMap()
						);
					rowSection.setTextFormat(undefined);
				});
				oldFormats.cols = [];
				columns.enumerateSections((columnSection, index) => {
					const oldTextFormat = columnSection.getTextFormat();
					if (oldTextFormat)
						oldFormats.cols[index] = toValuesMap(
							oldTextFormat.toMap()
						);
					columnSection.setTextFormat(undefined);
				});
			} else if (range.isRowRange()) {
				oldFormats.rows = [];
				range.enumerateRows((index) => {
					format = sheet
						.getRows()
						.getOrCreateSectionTextFormat(index);
					oldFormats.rows[index] = toValuesMap(
						createRetainMap(format, this._map)
					);
					format.applyMap(this._map);
				});
			} else if (range.isColumnRange()) {
				oldFormats.cols = [];
				range.enumerateColumns((index) => {
					format = sheet
						.getColumns()
						.getOrCreateSectionTextFormat(index);
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
				const oldFormat = cell && cell.getTextFormat();
				const oldFormatMap = oldFormat
					? toValuesMap(createRetainMap(oldFormat, this._map))
					: new Dictionary();
				oldFormats.cells.push({ x, y, map: oldFormatMap });

				// get format for cell
				cellFormat = sheet.getTextFormatAt(pos, true);
				if (cellFormat) {
					format = cellFormat.copy();
					// apply to format
					format.applyMap(this._map);
					// remove cell format, if equal to row or column format
					cellFormat = sheet.getTextFormatAt(pos, false);
					if (cellFormat.isEqual(format, true)) {
						if (cell) {
							cell.setTextFormat(undefined);
						}
					} else {
						cell = data.create(pos);
						cell.setTextFormat(format);
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
