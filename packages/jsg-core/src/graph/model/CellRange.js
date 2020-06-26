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
const JSG = require('../../JSG');

/**
 * Class to handle a worksheet range.
 *
 * @constructor
 * @class CellRange
 * @param {WorksheetNode} worksheet Worksheet that contains the range.
 */
module.exports = class CellRange {
	constructor(worksheet, x1, y1, x2, y2, x1R, y1R, x2R, y2R) {
		this._worksheet = worksheet;

		this.set(x1, y1, x2, y2);

		// relative/absolute flag
		this._x1R = x1R || true;
		this._x2R = x2R || true;
		this._y1R = y1R || true;
		this._y2R = y2R || true;
	}

	newInstance() {
		return new CellRange();
	}

	copy() {
		const copy = this.newInstance();

		copy._worksheet = this._worksheet;

		copy._x1 = this._x1;
		copy._x2 = this._x2;
		copy._y1 = this._y1;
		copy._y2 = this._y2;
		copy._x1R = this._x1R;
		copy._x2R = this._x2R;
		copy._y1R = this._y1R;
		copy._y2R = this._y2R;

		return copy;
	}

	setTo(range) {
		this._worksheet = range._worksheet;

		this._x1 = range._x1;
		this._x2 = range._x2;
		this._y1 = range._y1;
		this._y2 = range._y2;
		this._x1R = range._x1R;
		this._x2R = range._x2R;
		this._y1R = range._y1R;
		this._y2R = range._y2R;
		return this;
	}

	toObject() {
		const obj = {};

		obj.id = this._worksheet.getId();

		obj.x1 = this._x1;
		obj.x2 = this._x2;
		obj.y1 = this._y1;
		obj.y2 = this._y2;
		obj.x1R = this._x1R;
		obj.x2R = this._x2R;
		obj.y1R = this._y1R;
		obj.y2R = this._y2R;

		return obj;
	}

	isEqualTo(other) {
		return this._x1 === other._x1 && this._x2 === other._x2 && this._y1 === other._y1 && this._y2 === other._y2;
	}

	isSingleCell() {
		return Math.abs(this._x1 - this._x2) === 0 && Math.abs(this._y1 - this._y2) === 0;
	}

	isValid() {
		return (
			this._worksheet !== undefined &&
			this._x1 !== undefined &&
			this._y1 !== undefined &&
			this._x2 !== undefined &&
			this._y2 !== undefined
		);
	}

	set(x1, y1, x2, y2) {
		this._x1 = x1;
		if (x2 === undefined) {
			this._x2 = x1;
		} else {
			this._x2 = x2;
		}
		this._y1 = y1;
		if (y2 === undefined) {
			this._y2 = y1;
		} else {
			this._y2 = y2;
		}
		this.sort();
		return this;
	}

	sort() {
		if (this._x1 > this._x2) {
			const x1 = this._x1;
			const x1R = this._x1R;
			this._x1 = this._x2;
			this._x1R = this._x2R;
			this._x2 = x1;
			this._x2R = x1R;
		}

		if (this._y1 > this._y2) {
			const y1 = this._y1;
			const y1R = this._y1R;
			this._y1 = this._y2;
			this._y1R = this._y2R;
			this._y2 = y1;
			this._y2R = y1R;
		}
	}

	contains(cell) {
		return cell.x >= this._x1 && cell.x <= this._x2 && cell.y >= this._y1 && cell.y <= this._y2;
	}

	intersects(range) {
		return this._x1 <= range._x2 && range._x1 <= this._x2 && this._y1 <= range._y2 && range._y1 <= this._y2;
	}

	getSheet() {
		return this._worksheet;
	}

	setSheet(sheet) {
		this._worksheet = sheet;
		return this;
	}

	getX1() {
		return this._x1;
	}

	setX1(x1) {
		this._x1 = x1;
		this.sort();
		return this;
	}

	getY1() {
		return this._y1;
	}

	setY1(y1) {
		this._y1 = y1;
		this.sort();
		return this;
	}

	getWidth() {
		return this._x2 - this._x1 + 1;
	}

	getHeight() {
		return this._y2 - this._y1 + 1;
	}

	setWidth() {
		this._x2 = this._x1;
		return this;
	}

	setHeight() {
		this._y2 = this._y1;
		return this;
	}

	getX2() {
		return this._x2;
	}

	setX2(x2) {
		this._x2 = x2;
		this.sort();
		return this;
	}

	getY2() {
		return this._y2;
	}

	setY2(y2) {
		this._y2 = y2;
		this.sort();
		return this;
	}

	isSheetRange() {
		return (
			this.getWidth() === this._worksheet.getColumnCount() && this.getHeight() === this._worksheet.getRowCount()
		);
	}

	isRowRange() {
		return this.getWidth() === this._worksheet.getColumnCount();
	}

	isColumnRange() {
		return this.getHeight() === this._worksheet.getRowCount();
	}

	deleteCellContent(action) {
		const sheet = this._worksheet;
		const dataProvider = sheet.getDataProvider();
		let format;

		action = action || 'values';

		const defaultCell = sheet.createDefaultCell();

		if (action === 'formats' || action === 'all') {
			if (this.isSheetRange()) {
				sheet.resetDefaultFormat();
			}
			const formatDef = sheet.getDefaultFormat();
			if (this.isRowRange()) {
				this.enumerateRows((index) => {
					format = sheet.getRows().getSectionFormat(index);
					if (format) {
						sheet.getRows().setSectionFormat(index, undefined);
					}
					if (!defaultCell.getFormat().hasEqualDefinedValues(formatDef)) {
						sheet.getRows().getOrCreateSectionFormat(index);
					}
					format = sheet.getRows().getSectionTextFormat(index);
					if (format) {
						sheet.getRows().setSectionTextFormat(index, undefined);
					}
					if (!defaultCell.getTextFormat().hasEqualDefinedValues(formatDef)) {
						sheet.getRows().getOrCreateSectionTextFormat(index);
					}
					format = sheet.getRows().getSectionAttributes(index);
					if (format) {
						sheet.getRows().setSectionAttributes(index, undefined);
					}
					if (!defaultCell.getAttributes().hasEqualDefinedValues(formatDef)) {
						sheet.getRows().getOrCreateSectionAttributes(index);
					}
				});
			}
			if (this.isColumnRange()) {
				this.enumerateColumns((index) => {
					format = sheet.getColumns().getSectionFormat(index);
					if (format) {
						sheet.getColumns().setSectionFormat(index, undefined);
					}
					if (!defaultCell.getFormat().hasEqualDefinedValues(formatDef)) {
						sheet.getColumns().getOrCreateSectionFormat(index);
					}
				});
			}
		}

		this.enumerateCells(false, (pos) => {
			let cell = dataProvider.get(pos);
			if (cell) {
				switch (action) {
					case 'all':
						dataProvider.setTo(pos, undefined);
						// cell.clearAll();
						break;
					case 'formats':
						if (cell.hasContent()) {
							cell.clearFormat();
						} else {
							dataProvider.setTo(pos, undefined);
						}
						break;
					case 'values':
					default:
						if (cell.hasFormat()) {
							cell.clearContent();
						} else {
							dataProvider.setTo(pos, undefined);
						}
						break;
				}
			}
			// create cell to overwrite format, if necessary
			if (action === 'formats' || action === 'all') {
				format = sheet.getFormatAt(pos);
				if (!defaultCell.getFormat().hasEqualDefinedValues(format)) {
					cell = dataProvider.create(pos);
					cell.getOrCreateFormat();
				}
				format = sheet.getTextFormatAt(pos);
				if (!defaultCell.getTextFormat().hasEqualDefinedValues(format)) {
					cell = dataProvider.create(pos);
					cell.getOrCreateTextFormat();
				}
				format = sheet.getCellAttributesAt(pos);
				if (!defaultCell.getAttributes().hasEqualDefinedValues(format)) {
					cell = dataProvider.create(pos);
					cell.getOrCreateAttributes();
				}
			}
		});

		JSG.clipSheet = undefined;
	}

	deleteRows() {
		const dataProvider = this._worksheet.getCells().getDataProvider();

		dataProvider.deleteRowsAt(this);
		this._worksheet.getRows().removeSectionsAt(this._y1, this.getHeight());
	}

	deleteColumns() {
		const dataProvider = this._worksheet.getCells().getDataProvider();

		dataProvider.deleteColumnsAt(this);
		this._worksheet.getColumns().removeSectionsAt(this._x1, this.getWidth());
	}

	deleteCellsHorizontal() {
		const dataProvider = this._worksheet.getCells().getDataProvider();

		dataProvider.deleteRangeHorizontal(this);
	}

	deleteCellsVertical() {
		const dataProvider = this._worksheet.getCells().getDataProvider();

		dataProvider.deleteRangeVertical(this);
	}

	insertRows() {
		const dataProvider = this._worksheet.getCells().getDataProvider();

		this._worksheet.getRows().insertSectionsAt(this._y1, this.getHeight(), this._worksheet.getRowCount());
		dataProvider.insertRowsAt(this);
	}

	insertColumns() {
		const dataProvider = this._worksheet.getCells().getDataProvider();

		this._worksheet.getColumns().insertSectionsAt(this._x1, this.getWidth(), this._worksheet.getColumnCount());
		dataProvider.insertColumnsAt(this);
	}

	insertCellsHorizontal() {
		const dataProvider = this._worksheet.getCells().getDataProvider();

		dataProvider.insertRangeHorizontal(this);
	}

	insertCellsVertical() {
		const dataProvider = this._worksheet.getCells().getDataProvider();

		dataProvider.insertRangeVertical(this);
	}

	merge() {
		this._worksheet.getCells()._merged.push(this);
	}

	applyFormat() {}

	containsValues(rangeToIgnore) {
		const dataProvider = this._worksheet.getCells().getDataProvider();
		let values = false;

		this.enumerateCells(false, (pos) => {
			if (
				pos.x < rangeToIgnore.getX1() ||
				pos.x > rangeToIgnore.getX2() ||
				pos.y < rangeToIgnore.getY1() ||
				pos.y > rangeToIgnore.getY2()
			) {
				const cell = dataProvider.get(pos);
				if (cell && cell.hasContent() && cell.getValue() !== '') {
					values = true;
				}
			}
		});

		return values;
	}

	enumerateShifted(callback) {
		const data = this.getSheet().getDataProvider();
		const cInit = this._worksheet.getColumns().getInitialSection();
		let i;
		let j;

		/* eslint-disable no-mixed-operators */
		for (i = 0; i < this.getWidth(); i += 1) {
			for (j = 0; j < this.getHeight(); j += 1) {
				const cell = data.getRC(this._x1 + i - cInit, this._y1 + j);
				callback(cell, i, j);
			}
		}
	}

	enumerateCells(skipRowsOrColumns, callback) {
		let j;
		let k;
		const cell = JSG.ptCache.get();

		if (
			!skipRowsOrColumns ||
			(this.getHeight() !== this._worksheet.getRowCount() && this.getWidth() !== this._worksheet.getColumnCount())
		) {
			for (j = this._x1; j <= this._x2; j += 1) {
				for (k = this._y1; k <= this._y2; k += 1) {
					cell.set(j, k);
					callback.call(this, cell);
				}
			}
		}

		JSG.ptCache.release(cell);
	}

	enumerateColumns(callback) {
		let j;

		for (j = this._x1; j <= this._x2; j += 1) {
			if (this.getHeight() === this._worksheet.getRowCount()) {
				callback.call(this, j);
			}
		}
	}

	enumerateRows(callback) {
		let j;

		for (j = this._y1; j <= this._y2; j += 1) {
			if (this.getWidth() === this._worksheet.getColumnCount()) {
				callback.call(this, j);
			}
		}
	}

	/**
	 * Saves this Range instance.
	 *
	 * @method save
	 * @param {Writer} writer Writer to use for streaming.
	 */
	save(writer) {
		writer.writeStartElement('range');
		writer.writeEndElement();
	}

	toString(params) {
		const getColumnString = (columnNumber) => {
			let columnName = '';

			if (columnNumber < 0) {
				columnName = this._worksheet
					.getColumns()
					.getSectionTitle(columnNumber - this._worksheet.getColumns().getInitialSection());
			} else {
				let dividend = columnNumber + 1;
				let modulo;

				while (dividend > 0) {
					modulo = (dividend - 1) % 26;
					columnName = String.fromCharCode(65 + modulo).toString() + columnName;
					dividend = parseInt((dividend - modulo) / 26, 0);
				}
			}
			return columnName;
		};

		let str = '';

		const all = this.isRowRange() && this.isColumnRange();

		if (all || !this.isRowRange()) {
			if (this._x1R === false) {
				str += '$';
			}

			str += getColumnString(this._x1);
		}

		if (all || !this.isColumnRange()) {
			if (this._y1R === false) {
				str += '$';
			}
			str += this._y1 + 1;
		}

		if (this.getWidth() > 1 || this.getHeight() > 1) {
			str += ':';
			if (all || !this.isRowRange()) {
				if (this._x2R === false) {
					str += '$';
				}

				str += getColumnString(this._x2);
			}

			if (all || !this.isColumnRange()) {
				if (this._y2R === false) {
					str += '$';
				}
				str += this._y2 + 1;
			}
		}

		if (params && params.rangeColors) {
			// mark range for edit control
			str = `~span${str}~/span`;
		}

		if (params && params.useName && (params.forceName || params.item !== this.getSheet())) {
			return `${this.getSheet()
				.getName()
				.getValue()}!${str}`;
		}

		return str;
	}

	shiftToSheet() {
		this._x1 += this._worksheet.getColumns().getInitialSection();
		this._x2 += this._worksheet.getColumns().getInitialSection();

		return this;
	}

	shiftFromSheet() {
		this._x1 -= this._worksheet.getColumns().getInitialSection();
		this._x2 -= this._worksheet.getColumns().getInitialSection();

		return this;
	}

	static parse(rangeText, sheet, allowExternalRef = true, noLimit = false) {
		if (rangeText === undefined) {
			return undefined;
		}

		const range = new CellRange(sheet);

		const cutIndex = rangeText.indexOf('!');
		if (cutIndex !== -1) {
			if (allowExternalRef === false) {
				return undefined;
			}
			const graph = range._worksheet.getGraph();
			const name = rangeText.substring(0, cutIndex);
			const namedItem = graph.getItemByName(name);
			if (namedItem === undefined) {
				return undefined;
			}
			range._worksheet = namedItem;
			rangeText = rangeText.substring(cutIndex + 1);
		}

		const cells = rangeText.split(':');

		const start = CellRange.refToRC(cells[0], range._worksheet, noLimit);
		if (start === undefined) {
			return undefined;
		}
		if (start.row === undefined) {
			if (cells.length === 1) {
				return undefined;
			}
			start.row = 0;
			start.rowRel = true;
		}
		if (start.column === undefined) {
			if (cells.length === 1) {
				return undefined;
			}
			start.column = range._worksheet.getColumns().getInitialSection();
			start.colRel = true;
		}

		range._x1 = start.column;
		range._y1 = start.row;
		range._x1R = start.colRel;
		range._y1R = start.rowRel;

		if (cells.length > 1) {
			const end = CellRange.refToRC(cells[1], range._worksheet, noLimit);
			if (end === undefined) {
				return undefined;
			}
			if (end.row === undefined) {
				end.row = range._worksheet.getRowCount() - 1;
				end.rowRel = true;
			}
			if (end.column === undefined) {
				end.column = range._worksheet.getColumnCount() + range._worksheet.getColumns().getInitialSection() - 1;
				end.colRel = true;
			}
			range._x2 = end.column;
			range._y2 = end.row;
			range._x2R = end.colRel;
			range._y2R = end.rowRel;
		} else {
			range._x2 = start.column;
			range._y2 = start.row;
			range._x2R = start.colRel;
			range._y2R = start.rowRel;
		}

		range.sort();

		return range;
	}

	static getColumnFromString(reference) {
		let colVal = 0;

		for (let j = 0; j < reference.length; j += 1) {
			colVal =
				26 * colVal +
				reference
					.charAt(j)
					.toUpperCase()
					.charCodeAt(0) -
				65 +
				1;
		}

		return colVal;
	}

	static refToRC(reference, sheet, noLimit = false) {
		let i = 0;
		let j;
		let colVal = 0;
		let rowVal = 0;
		let row;
		let col;
		let absCnt = 0;

		if (sheet === undefined) {
			return undefined;
		}

		while (i < reference.length) {
			if (reference.charAt(i) >= '0' && reference.charAt(i) <= '9') {
				break;
			}
			if ((reference.charAt(i) < 'A' || reference.charAt(i) > 'Z') && reference.charAt(i) !== '$') {
				return undefined;
			}
			absCnt += reference.charAt(i) === '$' ? 1 : 0;
			i += 1;
		}

		// if (i === 0 || i === reference.length || i > 2 + absCnt) {
		// 	return undefined;
		// }

		const endOfCol = reference.charAt(i - 1) === '$' ? i - 1 : i;
		const colRel = reference[0] !== '$';
		const rowRel = reference.charAt(i - 1) !== '$';

		// skip $ of col, if any
		j = reference[0] === '$' ? 1 : 0;

		// j now points to first character of column address
		// check column names for negative columns
		const initC = sheet.getColumns().getInitialSection();
		if (initC < 0) {
			let k = initC;
			let name;
			let colref;

			for (k; k < 0; k += 1) {
				name = sheet.getColumns().getSectionTitle(k - initC);
				if (name !== undefined) {
					colref = reference.slice(j, endOfCol);
					if (colref === name) {
						col = k + 1;
						break;
					}
				}
			}
		}

		if (col === undefined) {
			if (i > 2 + absCnt) {
				return undefined;
			}
			if (i !== 0) {
				for (j; j < endOfCol; j += 1) {
					colVal =
						26 * colVal +
						reference
							.charAt(j)
							.toUpperCase()
							.charCodeAt(0) -
						65 +
						1; // 65 -> 'A'
				}

				col = colVal > 0 ? colVal : 1;
			}
		}

		if (i === reference.length) {
			return {
				row: undefined,
				rowRel: undefined,
				column: col - 1,
				colRel
			};
		}

		// check for negative reference
		const neg = reference.charAt(i) === '-';
		if (neg) {
			i += 1;
		}

		for (i; i < reference.length; i += 1) {
			// 48 -> '0'
			if (reference.charCodeAt(i) < 48 || reference.charCodeAt(i) > 57) {
				return undefined;
			}
			rowVal = rowVal * 10 + reference.charCodeAt(i) - 48;
		}

		row = rowVal;
		if (neg) {
			row = -row;
		}

		if (noLimit === false && row > sheet.getRowCount()) {
			return undefined;
		}

		return {
			row: row - 1,
			rowRel,
			column: col === undefined ? undefined : col - 1,
			colRel: col === undefined ? undefined : colRel
		};
	}
};
