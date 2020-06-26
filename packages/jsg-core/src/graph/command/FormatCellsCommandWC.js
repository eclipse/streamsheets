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
const CellRange = require('../model/CellRange');
const { toCellRanges } = require('./utils');

const rangeAsString = (range, shiftIt = true) =>
	shiftIt ? range.shiftToSheet().toString() : range.toString();
const getRangeIndex = (range, shiftIt) =>
	rangeAsString(range, shiftIt).split(':')[0];

const mapProperties = ({ index, reference, properties, oldFormat }) => {
	reference = reference || index;
	properties = properties || oldFormat;
	return { reference, properties };
};

// how to determine correct column index?
const columnAsNr = (reference, sheet) =>
	CellRange.getColumnFromString(reference) -
	sheet.getColumns().getInitialSection() -
	1;

const getOldStyles = (styles) => {
	const props = {};
	if (styles) {
		Object.entries(styles).forEach(([key, value]) => {
			if (value != null) props[key] = value.old;
		});
	}
	return props;
};

/**
 * Command to format the cells within an array of ranges
 *
 * @class FormatCellsCommand
 * @param {Array} ranges Array of CellRange objects.
 */
module.exports = class FormatCellsCommandWC extends Command {
	static createFromObject(data = {}, { graph }) {
		const ranges = toCellRanges(data.ranges, graph);
		const map = data.map
			? new Dictionary().setMap(data.map)
			: new Dictionary();
		return ranges && ranges.length
			? new FormatCellsCommandWC(ranges, map).initWithObject(data)
			: undefined;
	}

	constructor(ranges, map) {
		super();

		this._map = map;
		this._ranges = ranges.map((range) => range.copy());
		this._formats = undefined;
		this._oldFormats = undefined;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._formats = data.formats;
		cmd._oldFormats = data.oldFormats;
		return cmd;
	}

	// type: called on undo, redo or execute:
	toObject(type) {
		const data = super.toObject(type);
		data.ranges = this._ranges.map((range) => range.toObject());
		data.formats = this._formats;
		data.oldFormats = this._oldFormats;
		// machine server info:
		const formats = type === 'undo' ? this._oldFormats : this._formats;
		data.info = {};
		data.info.cols = formats.cols.map(mapProperties);
		data.info.rows = formats.rows.map(mapProperties);
		data.info.cells = formats.cells.map(mapProperties);
		data.info.properties = formats.properties;
		return data;
	}

	get sheet() {
		const range = this._ranges[0];
		return range ? range.getSheet() : undefined;
	}

	execute() {
		// if formats already exists, command was created by static constructor for undo/redo...
		if (!this._formats) {
			// TODO sheet support
			const { sheet } = this;
			const tmprange = new CellRange(sheet, 0, 0, 0, 0);
			const formats = { cells: [], cols: [], rows: [] };
			formats.properties = this._map.getMap();
			this._ranges.forEach((range) => {
				if (range.isColumnRange()) {
					range.enumerateColumns((index) => {
						const reference = getRangeIndex(
							tmprange.set(index, 1, index, sheet.getRowCount())
						);
						formats.cols.push({ index, reference });
					});
				} else if (range.isRowRange()) {
					range.enumerateRows((index) => {
						const reference = getRangeIndex(
							tmprange.set(
								1,
								index,
								sheet.getColumnCount(),
								index
							)
						);
						formats.rows.push({ index, reference });
					});
				} else {
					range.enumerateCells(false, (pos) => {
						const reference = rangeAsString(
							tmprange.set(pos.x, pos.y)
						);
						formats.cells.push({
							column: pos.x,
							row: pos.y,
							reference
						});
					});
				}
			});
			this._formats = formats;
		}
		this.redo();
	}

	applyFormats(formats) {
		const { sheet } = this;
		const data = sheet.getDataProvider();
		const propsMap =
			formats.properties && new Dictionary().setMap(formats.properties);
		formats.cols.forEach(({ index, oldFormat }) => {
			const format = sheet.getColumns().getOrCreateSectionFormat(index);
			format.applyMap(propsMap || new Dictionary().setMap(oldFormat));
		});
		formats.rows.forEach(({ index, oldFormat }) => {
			const format = sheet.getRows().getOrCreateSectionFormat(index);
			format.applyMap(propsMap || new Dictionary().setMap(oldFormat));
		});
		formats.cells.forEach(({ column, row, oldFormat }) => {
			const cell = data.getRC(column, row) || data.createRC(column, row);
			const format = propsMap || new Dictionary().setMap(oldFormat);
			let cellFormat = sheet.getFormatAtRC(column, row, true);
			if (format) cellFormat.applyMap(format);
			else cellFormat = undefined;
			cell.setFormat(cellFormat);
		});
		sheet.getGraph().markDirty();
	}

	redo() {
		this.applyFormats(this._formats);
	}

	undo() {
		this.applyFormats(this._oldFormats || this._formats);
	}

	handleResponse(response, error) {
		if (!response || error) {
			// console.error('Cannot handle response!!', error);
			return;
		}
		if (!this._oldFormats) {
			const changedprops =
				response.machineserver &&
				response.machineserver.changedProperties;
			if (changedprops) {
				const { sheet } = this;
				const oldFormats = { cells: [], cols: [], rows: [] };
				if (changedprops.cols) {
					changedprops.cols.forEach(({ reference, properties }) => {
						const oldFormat = getOldStyles(
							properties.formats && properties.formats.styles
						);
						oldFormats.cols.push({
							index: columnAsNr(reference, sheet),
							reference,
							oldFormat
						});
					});
				}
				if (changedprops.rows) {
					changedprops.rows.forEach(({ reference, properties }) => {
						const oldFormat = getOldStyles(
							properties.formats && properties.formats.styles
						);
						oldFormats.cols.push({
							index: reference,
							reference,
							oldFormat
						});
					});
				}
				if (changedprops.cells) {
					changedprops.cells.forEach(({ reference, properties }) => {
						const oldFormat = getOldStyles(
							properties.formats && properties.formats.styles
						);
						const rc = CellRange.refToRC(reference, sheet);
						if (rc) {
							const row = rc.row;
							const column =
								rc.column -
								sheet.getColumns().getInitialSection();
							oldFormats.cells.push({
								column,
								row,
								index: reference,
								oldFormat
							});
						}
					});
				}
				this._oldFormats = oldFormats;
			}
		}
	}
};
