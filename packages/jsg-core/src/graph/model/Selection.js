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
const Arrays = require('../../commons/Arrays');
const Point = require('../../geometry/Point');
const CellRange = require('./CellRange');

/**
 * Class to handle a worksheet selection. The selection contains one or multiple ranges of
 * selected cells. It
 * also contains an active cell. The active cell is the cell selected for editing.
 *
 * @class Selection
 * @constructor
 * @param {WorksheetView} worksheet Worksheet that contains the selection.
 */
module.exports = class Selection {
	constructor(sheet) {
		this._sheet = sheet;
		this._ranges = [];
		this._colors = [];
	}

	newInstance() {
		return new Selection();
	}

	copy() {
		let i;
		const copy = this.newInstance();

		for (i = 0; i < this._ranges.length; i += 1) {
			copy._ranges.push(this._ranges[i].copy());
		}

		if (this._activeCell) {
			copy._activeCell = this._activeCell.copy();
		}

		copy._sheet = this._sheet;

		return copy;
	}

	getWorksheet() {
		return this._sheet;
	}

	/**
	 * Retrieve the current active Cell.
	 *
	 * @method getActiveCell
	 * @return {Point} Cell coordinate of active cell.
	 */
	getActiveCell() {
		return this._activeCell;
	}

	getActiveRange() {
		return this._activeRange;
	}

	setActiveRange(index) {
		this._activeRange = index;
	}

	/**
	 * Set the  active Cell.
	 *
	 * @method setActiveCell
	 * @param {Point} Cell New coordinate of active cell.
	 */
	setActiveCell(cell) {
		if (this._activeCell === undefined) {
			this._activeCell = new Point(0, 0);
		}

		if (cell.x === -1) {
			this._activeCell.x = 0;
		} else {
			this._activeCell.x = cell.x;
		}

		if (cell.y === -1) {
			this._activeCell.y = 0;
		} else {
			this._activeCell.y = cell.y;
		}
	}

	selectRange(range) {
		this.removeAll();
		this.setActiveCell({ x: range.getX1(), y: range.getY1() });
		this.add(range);
	}

	selectCell(cell) {
		this.removeAll();
		this.setActiveCell(cell);
		this.add(new CellRange(this.getWorksheet(), cell.x, cell.y, cell.x, cell.y));
	}

	getSize() {
		return this._ranges.length;
	}

	getRanges() {
		return this._ranges;
	}

	add(range, color) {
		this._ranges.push(range);
		if (color) {
			range._color = color;
		}
	}

	update(index, rangeSource) {
		const range = this._ranges[index];

		if (range) {
			range.setTo(rangeSource);
		}
	}

	hasSelection() {
		return this._ranges.length > 0;
	}

	getAt(index) {
		return this._ranges[index];
	}

	setAt(index, range) {
		this._ranges[index] = range;
	}

	getColors() {
		return this._colors;
	}

	setColors(colors) {
		this._colors = colors;
	}

	clear() {
		Arrays.removeAll(this._ranges);
		this._activeCell = undefined;
		Arrays.removeAll(this._colors);
	}

	remove(index) {
		if (index < this._ranges.length) {
			const deleteItem = this._ranges[index];
			if (deleteItem !== undefined && deleteItem != null) {
				Arrays.remove(this._ranges, deleteItem);
			}
		}

		if (index < this._colors.length) {
			const deleteColor = this._colors[index];
			if (deleteColor !== undefined && deleteColor != null) {
				Arrays.removeAt(this._colors, index);
			}
		}
	}

	removeAll() {
		Arrays.removeAll(this._ranges);
		Arrays.removeAll(this._colors);
	}

	validate() {
		let i;
		let n;

		if (this._activeCell === undefined) {
			return false;
		}

		const rows = this.getWorksheet().getRowCount();

		if (this._activeCell.y > rows - 1) {
			return false;
		}

		for (i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			if (range.getY1() > rows - 1 || range.getY2() > rows - 1) {
				return false;
			}
		}

		return true;
	}

	getActiveRangeIndex() {
		let i;
		let n;

		if (this._activeCell === undefined) {
			return 0;
		}

		if (this._activeRange) {
			return this._activeRange;
		}

		for (i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			if (
				this._activeCell.x >= range.getX1() &&
				this._activeCell.x <= range.getX2() &&
				this._activeCell.y >= range.getY1() &&
				this._activeCell.y <= range.getY2()
			) {
				return i;
			}
		}

		return 0;
	}

	areRowsSelected() {
		let i;
		let n;

		for (i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			if (range.isRowRange()) {
				return true;
			}
		}

		return false;
	}

	areColumnsSelected() {
		let i;
		let n;

		for (i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			if (range.isColumnRange()) {
				return true;
			}
		}

		return false;
	}

	retainAttributes() {
		function unionCondition(attr1, attr2) {
			return attr1 && attr2 && attr1.getExpression().isEqualTo(attr2.getExpression());
		}

		let attributes;

		/* eslint-disable no-loop-func */
		for (let i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			range.enumerateCells(false, (pos) => {
				const cellAttributes = range.getSheet().getCellAttributesAt(pos);
				if (attributes === undefined) {
					attributes = cellAttributes.toFlatList();
				} else {
					attributes.retainAll(cellAttributes, unionCondition);
				}
			});
		}
		/* eslint-enable no-loop-func */

		return attributes;
	}

	retainTextFormat() {
		function unionCondition(attr1, attr2) {
			return attr1 && attr2 && attr1.getExpression().isEqualTo(attr2.getExpression());
		}

		let formats;
		/* eslint-disable no-loop-func */
		for (let i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			range.enumerateCells(false, (pos) => {
				const textFormat = range.getSheet().getTextFormatAt(pos);
				if (formats === undefined) {
					formats = textFormat.toFlatList();
				} else {
					formats.retainAll(textFormat, unionCondition);
				}
			});
		}
		/* eslint-enable no-loop-func */

		return formats;
	}

	retainFormat() {
		function unionCondition(attr1, attr2) {
			return attr1 && attr2 && attr1.getExpression().isEqualTo(attr2.getExpression());
		}

		let formats;
		/* eslint-disable no-loop-func */
		for (let i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			range.enumerateCells(false, (pos) => {
				const format = range.getSheet().getFormatAt(pos);
				if (formats === undefined) {
					formats = format.toFlatList();
				} else {
					formats.retainAll(format, unionCondition);
				}
			});
		}
		/* eslint-enable no-loop-func */

		return formats;
	}

	applyAttributes(map, listpath) {
		let i;
		let n;

		for (i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			range.applyAttributes(map, listpath);
		}
	}

	setAttribute(attribute) {
		let i;
		let n;
		const data = this.getWorksheet().getDataProvider();

		for (i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			range.enumerateCells(true, (pos) => {
				let cell = data.get(pos);
				if (cell === undefined) {
					cell = data.create(pos);
				}
				cell.getOrCreateAttributes().addAttribute(attribute);
			});
		}
	}

	removeAttribute(name) {
		let i;
		let n;
		const data = this.getWorksheet().getDataProvider();

		for (i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			range.enumerateCells(true, (pos) => {
				const cell = data.get(pos);
				if (cell !== undefined) {
					const attr = cell.getAttributes();
					if (attr !== undefined) {
						attr.removeAttributeAtPath(name);
					}
				}
			});
		}
	}

	merge() {
		let i;
		let n;

		// TODO check intersections

		for (i = 0, n = this._ranges.length; i < n; i += 1) {
			const range = this._ranges[i];
			range.merge();
		}
	}

	refToString() {
		let str;

		str = this.getWorksheet()
			.getName()
			.getValue();

		str += '!';
		str += this.toString();

		return str;
	}

	activeCellToString() {
		if (this._activeCell === undefined) {
			return '';
		}

		return this.cellToString(this._activeCell.x, this._activeCell.y);
	}

	cellToString(column, row) {
		let str = '';
		const sheet = this.getWorksheet();
		const x = column + sheet.getColumns().getInitialSection();
		const y = row;

		if (x < 0) {
			str += sheet.getColumns().getSectionTitle(x - sheet.getColumns().getInitialSection());
		} else {
			let dividend = x + 1;
			let modulo;
			let columnName = '';

			while (dividend > 0) {
				modulo = (dividend - 1) % 26;
				columnName = String.fromCharCode(65 + modulo).toString() + columnName;
				dividend = parseInt((dividend - modulo) / 26, 0);
			}
			str += columnName;
		}

		str += y + 1;

		return str;
	}

	toJson() {
		const range = this._ranges[0];
		const sheet = this.getWorksheet().getDataProvider();
		const parents = [];
		const parentNames = [];
		let data;
		let level = 0;

		parents.push({});

		for (let i = range.getY1(); i <= range.getY2(); i += 1) {
			const row = sheet.getRow(i);
			if (row) {
				for (let j = range.getX1(); j <= range.getX2(); j += 1) {
					let cell = row[j];
					if (cell && cell.getValue()) {
						const name = String(cell.getValue());
						if (name.length) {
							let value = '';
							cell = row[j + 1];
							if (cell) {
								value = cell.getValue();
							}
							level = j - range.getX1();
							parentNames[level] = name;
							if (parents[level] === undefined) {
								data[parentNames[level - 1]] = {};
								data = data[parentNames[level - 1]];
								parents[level] = data;
							} else {
								data = parents[level];
							}
							data[name] = value;
							break;
						}
					}
				}
			}
		}

		return JSON.stringify(parents[0]);
	}

	toString(params) {
		if (this._ranges.length === 0) {
			return '';
		}
		const range = this._ranges[0].copy();
		range._x1 += range
			.getSheet()
			.getColumns()
			.getInitialSection();
		range._x2 += range
			.getSheet()
			.getColumns()
			.getInitialSection();
		range._y1 += range
			.getSheet()
			.getRows()
			.getInitialSection();
		range._y2 += range
			.getSheet()
			.getRows()
			.getInitialSection();

		return range.toString(params);
	}

	toStringByIndex(index, params) {
		if (this._ranges.length === 0) {
			return '';
		}
		const range = this._ranges[index].copy();
		range._x1 += range
			.getSheet()
			.getColumns()
			.getInitialSection();
		range._x2 += range
			.getSheet()
			.getColumns()
			.getInitialSection();
		range._y1 += range
			.getSheet()
			.getRows()
			.getInitialSection();
		range._y2 += range
			.getSheet()
			.getRows()
			.getInitialSection();

		return range.toString(params);
	}

	toStringMulti() {
		let str = '';
		let copy;

		this._ranges.forEach((range) => {
			copy = range.copy();
			copy.shiftToSheet();
			str += copy.toString();
			str += ';';
		});

		return str + this.activeCellToString();
	}

	static fromStringMulti(str, sheet) {
		const selection = new Selection(sheet);

		if (str === undefined) {
			return selection;
		}

		const parts = str.split(';');
		const active = parts.pop();
		let range;

		parts.forEach((part) => {
			range = CellRange.parse(part, sheet, false);
			if (range) {
				range.shiftFromSheet();
				selection.add(range);
			}
		});

		const cell = CellRange.refToRC(active, sheet);

		if (cell !== undefined) {
			selection.setActiveCell(
				new Point(
					cell.column - sheet.getColumns().getInitialSection(),
					cell.row
				)
			);
		}

		return selection;
	}

	// saves only first range in selection
	save(writer, cut, id) {
		const sheet = this.getWorksheet();
		const data = sheet.getDataProvider();
		const range = this._ranges[0];

		writer.writeStartElement('selection');

		writer.writeAttributeNumber('id', id);
		writer.writeAttributeNumber('cut', cut ? 1 : 0);
		writer.writeAttributeString('range', this.toStringByIndex(0));
		writer.writeAttributeString('sheetid', sheet.getId());

		writer.writeStartElement('defaultcell');
		sheet._defaultCell.save(writer);
		writer.writeEndElement();

		writer.writeStartElement('columns');
		writer.writeStartArray('column');

		for (let i = range.getX1(); i <= range.getX2(); i += 1) {
			const section = sheet.getColumns().getSectionAt(i);
			if (section) {
				section.save(writer, i);
			}
		}

		writer.writeEndArray('column');
		writer.writeEndElement();

		writer.writeStartElement('rows');
		writer.writeStartArray('row');

		for (let i = range.getY1(); i <= range.getY2(); i += 1) {
			const section = sheet.getRows().getSectionAt(i);
			if (section) {
				section.save(writer, i);
			}
		}

		writer.writeEndArray('row');
		writer.writeEndElement();

		writer.writeStartElement('cells');
		writer.writeStartArray('cell');

		this._ranges[0].enumerateCells(false, (pos) => {
			let cell = data.get(pos);
			if (cell !== undefined) {
				writer.writeStartElement('cell');
				writer.writeAttributeNumber('c', pos.x, 0);
				writer.writeAttributeNumber('r', pos.y, 0);

				if (cell._expr && cell._expr._formula) {
					cell = cell.copy();
					cell.evaluate(sheet);
					let formula = cell._expr.toLocaleString('en', {item: sheet, useName: true, forceName: true});
					if (formula.length && formula[0] === '=') {
						formula = formula.substring(1);
						cell._expr._formula = formula;
					}
				}

				cell.save(writer);
				writer.writeEndElement();
			}
		});

		writer.writeEndArray('cell');
		writer.writeEndElement();

		writer.writeEndElement();
	}

	saveText() {
		const sheet = this.getWorksheet().getDataProvider();
		let text = '';
		const range = this._ranges[0];

		for (let i = range.getY1(); i <= range.getY2(); i += 1) {
			const row = sheet.getRow(i);
			if (row) {
				for (let j = range.getX1(); j <= range.getX2(); j += 1) {
					const cell = row[j];
					if (cell && cell.getValue()) {
						text += String(cell.getValue());
					}
					text += '\t';
				}
			}
			text += '\r';
		}

		return text;
	}
};
