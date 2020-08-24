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
/* eslint-disable no-mixed-operators */
const { serialnumber: { dateLocal2serial, serial2date }} = require('@cedalo/commons');
const Point = require('../../geometry/Point');
const MathUtils = require('../../geometry/MathUtils');
const NumberExpression = require('../expr/NumberExpression');
const StringExpression = require('../expr/StringExpression');
const BooleanExpression = require('../expr/BooleanExpression');
const Numbers = require('../../commons/Numbers');
const Arrays = require('../../commons/Arrays');
const SheetReference = require('../expr/SheetReference');
const Cell = require('./Cell');
const SheetName = require('./SheetName');
const CellRange = require('./CellRange');
const GraphUtils = require('../GraphUtils');

const TYPE = 'Data';

const getSheetFromExpression = (expr) => {
	const term = expr.getTerm();
	const operand = term && term.operand;
	return operand && operand instanceof SheetReference && operand._item;
};

/**
 * Generic data provider for a worksheet. This provider simply saves its cell data in row
 * arrays. Each row array contains an array of cell arrays.
 *
 * @class DataProvider
 * @constructor
 */
module.exports = class DataProvider {
	constructor(sheet) {
		this._rows = [];
		this._sheet = sheet;
		this._names = [];
		this._graphs = [];
	}

	newInstance() {
		return new DataProvider();
	}

	copy() {
		const copy = this.newInstance();
		let i;

		for (i = 0; i < this._rows.length; i += 1) {
			copy._rows[i] = this.copyRow(this._rows[i]);
		}

		return copy;
	}

	copyRow(row) {
		let i;

		if (row === undefined) {
			return undefined;
		}

		const newRow = [];

		for (i = 0; i < row.length; i += 1) {
			if (row[i] !== undefined) {
				newRow[i] = row[i].copy();
			}
		}

		return newRow;
	}

	validateName(name) {
		if (name.length === 0) {
			return 'Invalid Name';
		}

		let ret = true;

		this._names.forEach((lname) => {
			if (lname.getName() === name) {
				ret = 'Name exists';
			}
		});

		return ret;
	}

	getType() {
		return DataProvider.TYPE;
	}

	setSheet(sheet) {
		this._sheet = sheet;
	}

	getSheet() {
		return this._sheet;
	}

	getRowCount() {
		return this._rows.length;
	}

	getNames() {
		return this._names;
	}

	getOrCreateName(name) {
		const nameObj = this._names.find((lname) => lname.getName() === name);
		return nameObj || this.addName(new SheetName(name));
	}

	getName(name) {
		return this._names.find((lname) => lname.getName() === name);
	}

	addName(name) {
		this._names.push(name);
		name.evaluate(this._sheet);
		return name;
	}

	deleteName(name) {
		Arrays.remove(this._names, name);
	}

	getGraphs() {
		return this._graphs;
	}

	getOrCreateGraph(name) {
		const nameObj = this.getGraph(name);
		return nameObj || this.addGraph(new SheetName(name));
	}

	getGraph(name) {
		return this._graphs.find((lname) => lname.getName() === name);
	}

	addGraph(name) {
		const nameDef = this.getGraph(name.getName());
		if (nameDef) {
			this._graphs[this._graphs.indexOf(nameDef)] = name;
		} else {
			this._graphs.push(name);
		}
		name.evaluate(this._sheet);
		return name;
	}

	deleteGraph(name) {
		Arrays.remove(this._graphs, name);
	}

	get(pos) {
		return this.getRC(pos.x, pos.y);
	}

	clear() {
		this._rows = [];
	}

	getRC(column, row) {
		const rowdata = this.getRow(row);
		return rowdata ? rowdata[column] : undefined;
	}

	getRCExpression(column, row) {
		const data = this.getRC(column, row);
		return data ? data.getExpression() : undefined;
	}

	getUsedRange() {
		const range = new CellRange(this._sheet);
		let i;
		let j;
		const n = this.getRowCount();
		let row;

		for (i = 0; i < n; i += 1) {
			row = this.getRow(i);
			if (row !== undefined) {
				if (range.getY1() === undefined) {
					range.setY1(i);
				}

				for (j = 0; j < row.length; j += 1) {
					if (row[j] !== undefined) {
						if (range.getX1() === undefined) {
							range.setX1(j);
						} else {
							range.setX1(Math.min(j, range.getX1()));
						}
						if (range.getX2() === undefined) {
							range.setX2(j);
						} else {
							range.setX2(Math.max(j, range.getX2()));
						}
					}
				}
			}
		}

		range.setY2(n - 1);

		return range;
	}

	setArray(data) {
		const pos = new Point(0, 0);

		data.forEach((row, rowIndex) => {
			pos.y = rowIndex;
			row.forEach((ldata, columnIndex) => {
				pos.x = columnIndex;
				this.setString(pos, ldata ? ldata.toString() : '');
			});
		});
	}

	hasRow(row) {
		return this.getRow(row) !== undefined;
	}

	getRows() {
		return this._rows;
	}

	setRows(rows) {
		this._rows = rows;
	}

	getRowSize(index) {
		const row = this._rows[index];
		if (row === undefined) {
			return 0;
		}
		return row.length;
	}

	getRow(row) {
		return this._rows[row];
	}

	setRow(index, row) {
		this._rows[index] = row;
	}

	createRC(column, row) {
		return this.create({ x: column, y: row });
	}

	create(pos) {
		let rowdata = this.getRow(pos.y);
		if (!rowdata) {
			rowdata = [];
			this.setRow(pos.y, rowdata);
		}

		let cell = rowdata[pos.x];
		if (!cell) {
			cell = new Cell();
			rowdata[pos.x] = cell;
		}

		return cell;
	}

	setRC(x, y, expression, format) {
		const pos = new Point(x, y);
		return this.set(pos, expression, format);
	}

	setString(pos, text) {
		let data;

		if (text.toLowerCase() === 'true') {
			data = new BooleanExpression(true);
		} else if (text.toLowerCase() === 'false') {
			data = new BooleanExpression(false);
		} else if (Numbers.canBeNumber(text)) {
			data = new NumberExpression(text);
		} else {
			data = new StringExpression(text);
		}

		this.set(pos, data);
	}

	set(pos, expression, format) {
		let rowdata = this._rows[pos.y];
		if (!rowdata) {
			rowdata = [];
			this._rows[pos.y] = rowdata;
		}

		let cell = rowdata[pos.x];
		if (!cell) {
			cell = new Cell();
		}

		if (expression !== undefined) {
			cell.setExpression(expression);
		}

		if (format !== undefined) {
			cell.setFormat(format);
		}

		this.setTo(pos, cell);

		return cell;
	}

	// supports setting expression to undefined in order to remove it
	setExpression(pos, expression) {
		this._rows[pos.y] = this._rows[pos.y] || [];
		const rowdata = this._rows[pos.y];
		const cell = rowdata[pos.x] || new Cell();
		cell.setExpression(expression);
		this.setTo(pos, cell);
		return cell;
	}

	setRCTo(x, y, cell) {
		const pos = new Point(x, y);

		this.setTo(pos, cell);
	}

	setTo(pos, cell) {
		let rowdata = this.getRow(pos.y);
		if (!rowdata) {
			if (!cell) {
				return;
			}
			rowdata = [];
			this._rows[pos.y] = rowdata;
		}

		if (cell !== undefined && (!this._sheet || !this._sheet.isCalcOnDemand())) {
			cell.calc(this._sheet);
		}

		rowdata[pos.x] = cell;
	}

	addRow(row) {
		this._rows.push(row);
	}

	insertRowsAt(range, max) {
		Arrays.insertEmpty(this._rows, range.getY1(), range.getHeight(), this._sheet.getRowCount());
		this.updateExpressions(
			new CellRange(this._sheet, 0, range.getY1(), this._sheet.getColumnCount(), range.getY2()),
			true,
			true
		);
		this.createEmpty(range, 'rowformat');
	}

	insertColumnsAt(range, max) {
		let rowdata;
		let i;
		const n = this._rows.length;

		for (i = 0; i < n; i += 1) {
			rowdata = this._rows[i];
			if (rowdata) {
				Arrays.insertEmpty(rowdata, range.getX1(), range.getWidth(), this._sheet.getColumnCount());
			}
		}
		this.updateExpressions(
			new CellRange(this._sheet, range.getX1(), 0, range.getX2(), this._sheet.getRowCount()),
			true,
			false
		);
		this.createEmpty(range, 'colformat');
	}

	createFormattedCellsHorizontal(row, range, deleteCells) {
		for (let j = range.getX1(); j < this._sheet.getColumnCount(); j += 1) {
			let colFormat = this._sheet.getColumns().getSectionFormat(j);
			let colTextFormat = this._sheet.getColumns().getSectionTextFormat(j);
			let colAttributes = this._sheet.getColumns().getSectionAttributes(j);
			let cell = this.getRC(j, row);
			if (cell === undefined || cell.getFormat() === undefined) {
				if (colFormat) {
					cell = this.createRC(j, row);
					cell.setFormat(colFormat.copy());
				} else {
					if (deleteCells) {
						colFormat = this._sheet.getColumns().getSectionFormat(j - range.getWidth());
					} else {
						colFormat = this._sheet.getColumns().getSectionFormat(j + range.getWidth());
					}
					if (colFormat) {
						cell = this.createRC(j, row);
						const format = this._sheet.getFormatAtRC(j, row);
						cell.setFormat(format.copy());
					}
				}
			}
			if (cell === undefined || cell.getTextFormat() === undefined) {
				if (colTextFormat) {
					cell = this.createRC(j, row);
					cell.setTextFormat(colTextFormat.copy());
				} else {
					if (deleteCells) {
						colTextFormat = this._sheet.getColumns().getSectionTextFormat(j - range.getWidth());
					} else {
						colTextFormat = this._sheet.getColumns().getSectionTextFormat(j + range.getWidth());
					}
					if (colTextFormat) {
						cell = this.createRC(j, row);
						const format = this._sheet.getTextFormatAtRC(j, row);
						cell.setTextFormat(format.copy());
					}
				}
			}
			if (cell === undefined || cell.getAttributes() === undefined) {
				if (colAttributes) {
					cell = this.createRC(j, row);
					cell.setAttributes(colAttributes.copy());
				} else {
					if (deleteCells) {
						colAttributes = this._sheet.getColumns().getSectionAttributes(j - range.getWidth());
					} else {
						colAttributes = this._sheet.getColumns().getSectionAttributes(j + range.getWidth());
					}
					if (colAttributes) {
						cell = this.createRC(j, row);
						const format = this._sheet.getCellAttributesAtRC(j, row);
						cell.setAttributes(format.copy());
					}
				}
			}
		}
	}

	createFormattedCellsVertical(row, range, deleteCells) {
		for (let j = range.getX1(); j <= range.getX2(); j += 1) {
			let rowFormat = this._sheet.getRows().getSectionFormat(row);
			let rowTextFormat = this._sheet.getRows().getSectionTextFormat(row);
			let rowAttributes = this._sheet.getRows().getSectionAttributes(row);
			let cell = this.getRC(j, row);
			if (cell === undefined || cell.getFormat() === undefined) {
				if (rowFormat) {
					cell = this.createRC(j, row);
					cell.setFormat(rowFormat.copy());
				} else {
					if (deleteCells) {
						rowFormat = this._sheet.getRows().getSectionFormat(row - range.getHeight());
					} else {
						rowFormat = this._sheet.getRows().getSectionFormat(row + range.getHeight());
					}
					if (rowFormat) {
						cell = this.createRC(j, row);
						const format = this._sheet.getFormatAtRC(j, row);
						cell.setFormat(format.copy());
					}
				}
			}
			if (cell === undefined || cell.getTextFormat() === undefined) {
				if (rowTextFormat) {
					cell = this.createRC(j, row);
					cell.setTextFormat(rowTextFormat.copy());
				} else {
					if (deleteCells) {
						rowTextFormat = this._sheet.getRows().getSectionTextFormat(row - range.getHeight());
					} else {
						rowTextFormat = this._sheet.getRows().getSectionTextFormat(row + range.getHeight());
					}
					if (rowTextFormat) {
						cell = this.createRC(j, row);
						const format = this._sheet.getTextFormatAtRC(j, row);
						cell.setTextFormat(format.copy());
					}
				}
			}
			if (cell === undefined || cell.getAttributes() === undefined) {
				if (rowAttributes) {
					cell = this.createRC(j, row);
					cell.setAttributes(rowAttributes.copy());
				} else {
					if (deleteCells) {
						rowAttributes = this._sheet.getRows().getSectionAttributes(row - range.getHeight());
					} else {
						rowAttributes = this._sheet.getRows().getSectionAttributes(row + range.getHeight());
					}
					if (rowAttributes) {
						cell = this.createRC(j, row);
						const format = this._sheet.getCellAttributesAtRC(j, row);
						cell.setAttributes(format.copy());
					}
				}
			}
		}
	}

	insertRangeHorizontal(range, max) {
		let rowdata;
		let i;
		let j;

		for (i = range.getY1(); i <= range.getY2(); i += 1) {
			// need to identify formatted cells, that need to be created due to formatted columns
			this.createFormattedCellsHorizontal(i, range, false);
			rowdata = this._rows[i];
			if (rowdata) {
				Arrays.insertEmpty(rowdata, range.getX1(), range.getWidth(), this._sheet.getColumnCount());
			}
		}

		this.updateExpressions(range, true, false);
		this.createEmpty(range, 'colformat');
	}

	insertRangeVertical(range, max) {
		let rowdata;
		let i = this._sheet.getRowCount();
		let j;

		for (; i >= range.getY1(); i -= 1) {
			this.createFormattedCellsVertical(i, range, false);
			rowdata = this._rows[i];
			if (rowdata) {
				for (j = range.getX1(); j <= range.getX2(); j += 1) {
					const cell = this.getRC(j, i);
					this.setRCTo(j, i + range.getHeight(), cell);
					this.setRCTo(j, i, undefined);
				}
			}
		}
		this.updateExpressions(range, true, true);
		this.createEmpty(range, 'rowformat');
	}

	deleteRowAt(index) {
		Arrays.removeElements(this._rows, index, 1);

		this.updateExpressions(new CellRange(this._sheet, 0, index, this._sheet.getColumnCount(), index), false, true);
	}

	deleteRowsAt(range) {
		Arrays.removeElements(this._rows, range.getY1(), range.getHeight());
		this.updateExpressions(
			new CellRange(this._sheet, 0, range.getY1(), this._sheet.getColumnCount(), range.getY2()),
			false,
			true
		);
	}

	deleteColumnsAt(range) {
		let rowdata;
		let i;
		const n = this._rows.length;

		for (i = 0; i < n; i += 1) {
			rowdata = this._rows[i];
			if (rowdata) {
				Arrays.removeElements(rowdata, range.getX1(), range.getWidth());
			}
		}
		this.updateExpressions(
			new CellRange(this._sheet, range.getX1(), 0, range.getX2(), this._sheet.getRowCount()),
			false,
			false
		);
	}

	deleteRangeHorizontal(range) {
		let rowdata;
		let i;

		for (i = range.getY1(); i <= range.getY2(); i += 1) {
			// need to identify formatted cells, that need to be created due to formatted columns
			this.createFormattedCellsHorizontal(i, range, true);
			rowdata = this._rows[i];
			if (rowdata) {
				Arrays.removeElements(rowdata, range.getX1(), range.getWidth());
			}
		}
		this.updateExpressions(range, false, false);
	}

	deleteRangeVertical(range) {
		let rowdata;
		let rowdata2;
		let i;
		let j;

		for (i = range.getY1() + range.getHeight(); i < this._sheet.getRowCount(); i += 1) {
			// need to identify formatted cells, that need to be created due to formatted rows
			this.createFormattedCellsVertical(i, range, true);
			rowdata = this._rows[i];
			rowdata2 = this._rows[i - range.getHeight()];
			// if (rowdata) {
			for (j = range.getX1(); j <= range.getX2(); j += 1) {
				const cell = this.getRC(j, i);
				if (cell || rowdata2) {
					this.setRCTo(j, i - range.getHeight(), cell);
				}
				if (cell && rowdata) {
					this.setRCTo(j, i, undefined);
				}
			}
			// }
		}
		this.updateExpressions(range, false, true);
	}

	updateExpressions(range, insert, vertical) {
		if (this.getSheet().getStreamSheetContainer() === undefined) {
			return;
		}

		const update = (sheet, expr) => {
			expr.evaluate(sheet);

			if (expr.hasFormula() && expr.getTerm()) {
				expr.getTerm().traverse(
					(term) => {
						const { operand } = term;
						if (operand && operand instanceof SheetReference) {
							if (operand._name) {
								// TODO
							} else if (operand._range) {
								const refRange = operand._range;
								if (refRange.getSheet() === this._sheet) {
									if (vertical) {
										if (
											!insert &&
											refRange._y1 >= range.getY1() &&
											refRange._y2 <= range.getY2() &&
											refRange._x1 - this._sheet.getColumns().getInitialSection() >= range.getX1() &&
											refRange._x2 - this._sheet.getColumns().getInitialSection() <= range.getX2()
										) {
											operand._range = undefined;
										} else {
											if (
												refRange.getX1() - this._sheet.getColumns().getInitialSection() >=
													range.getX1() &&
												refRange.getX1() - this._sheet.getColumns().getInitialSection() <=
													range.getX2()
											) {
												if (insert) {
													if (
														refRange._y1 >=
														range.getY1()
													) {
														refRange._y1 += range.getHeight();
													}
												} else if (
													refRange._y1 >
													range.getY1()
												) {
													refRange._y1 -= range.getHeight();
												}
											}
											if (
												refRange.getX2() - this._sheet.getColumns().getInitialSection() >=
													range.getX1() &&
												refRange.getX2() - this._sheet.getColumns().getInitialSection() <=
													range.getX2()
											) {
												if (
													refRange._y2 >=
													range.getY1()
												) {
													refRange._y2 += insert ? range.getHeight() : -range.getHeight();
												}
											}
										}
									} else if (
										!insert &&
										refRange._x1 - this._sheet.getColumns().getInitialSection() >= range.getX1() &&
										refRange._x2 - this._sheet.getColumns().getInitialSection() <= range.getX2() &&
										refRange._y1 >= range.getY1() &&
										refRange._y2 <= range.getY2()
									) {
										operand._range = undefined;
									} else {
										if (
											refRange.getY1() >=
												range.getY1() &&
											refRange.getY1() <=
												range.getY2()
										) {
											if (insert) {
												if (
													refRange._x1 - this._sheet.getColumns().getInitialSection() >=
													range.getX1()
												) {
													refRange._x1 += range.getWidth();
												}
											} else if (
												refRange._x1 - this._sheet.getColumns().getInitialSection() >
												range.getX1()
											) {
												refRange._x1 -= range.getWidth();
											}
										}
										if (
											refRange.getY2() >=
												range.getY1() &&
											refRange.getY2() <=
												range.getY2()
										) {
											if (
												refRange._x2 - this._sheet.getColumns().getInitialSection() >=
												range.getX1()
											) {
												refRange._x2 += insert ? range.getWidth() : -range.getWidth();
											}
										}
									}
									if (operand._range !== undefined) {
										if (
											refRange._x1 < this._sheet.getColumns().getInitialSection() ||
											refRange._y1 < 0 ||
											refRange._x2 < this._sheet.getColumns().getInitialSection() ||
											refRange._y2 < 0 ||
											refRange._x1 - this._sheet.getColumns().getInitialSection() >=
												this._sheet.getColumnCount() ||
											refRange._x2 - this._sheet.getColumns().getInitialSection() >=
												this._sheet.getColumnCount() ||
											refRange._y1 >=
												this._sheet.getRowCount() ||
											refRange._y2 >=
												this._sheet.getRowCount()
										) {
											operand._range = undefined;
										}
									}
								}
							}
						}
						return true;
					} /* , cell */
				);
				expr.correctFormula(sheet);
			}
			return true;
		};

		this.getSheet()
			.getStreamSheetContainer()
			.getStreamSheetsContainer()
			.enumerateProcessSheets((sheet) => {
				const dataSheet = sheet.getDataProvider();
				dataSheet.enumerate((column, row, cell) => {
					const expr = cell.getExpression();
					if (expr === undefined) {
						return;
					}
					update(sheet, expr);
				});
				dataSheet._names.forEach((name) => {
					const expr = name.getExpression();
					if (expr !== undefined && expr.hasFormula()) {
						update(sheet, expr);
					}
				});

				const updateGraph = (item) => {
					const attrFormula = item.getItemAttributes().getAttribute('sheetformula');
					if (attrFormula) {
						const expr = attrFormula.getExpression();
						if (expr !== undefined && expr.hasFormula()) {
							update(sheet, expr);
							item._noFormulaUpdate = true;
							item.expressions.forEach(exp => {
								update(sheet, exp);
							});
						}
					}
				};

				GraphUtils.traverseItem(sheet.getCells(), (item) => updateGraph(item));

				// dataSheet._graphs.forEach((name) => {
				// 	const expr = name.getExpression();
				// 	if (expr !== undefined && expr.hasFormula()) {
				// 		update(sheet, expr);
				// 	}
				// });
			});
		const graph = this.getSheet().getGraph();
		graph.getSheetNames().forEach((name) => {
			const expr = name.getExpression();
			if (expr !== undefined && expr.hasFormula()) {
				update(graph, expr);
			}
		});
	}

	remove(cell) {
		const rowdata = this._rows[cell.y];
		if (rowdata) {
			rowdata[cell.x] = undefined;
		}
	}

	createEmpty(range, condition) {
		let formatDef;
		let textFormatDef;
		let attributeDef;

		for (let i = range.getX1(); i <= range.getX2(); i += 1) {
			for (let j = range.getY1(); j <= range.getY2(); j += 1) {
				if ((condition === 'colformat' && i) || (condition === 'rowformat' && j)) {
					switch (condition) {
						case 'colformat':
							formatDef = this._sheet.getFormatAtRC(range.getX1() - 1, j);
							textFormatDef = this._sheet.getTextFormatAtRC(range.getX1() - 1, j);
							attributeDef = this._sheet.getCellAttributesAtRC(range.getX1() - 1, j);
							break;
						case 'rowformat':
							formatDef = this._sheet.getFormatAtRC(i, range.getY1() - 1);
							textFormatDef = this._sheet.getTextFormatAtRC(i, range.getY1() - 1);
							attributeDef = this._sheet.getCellAttributesAtRC(i, range.getY1() - 1);
							break;
					}
				} else {
					formatDef = this._sheet.getDefaultFormat();
					textFormatDef = this._sheet.getDefaultTextFormat();
					attributeDef = this._sheet.getDefaultCellAttributes();
				}
				const format = this._sheet.getFormatAtRC(i, j);
				if (!format.hasEqualDefinedValues(formatDef)) {
					// if (range.isRowRange()) {
					// 	const section = this._sheet.getRows().getOrCreateSectionAt(j);
					// 	section.setFormat(formatDef.copy());
					// } else if (range.isColumnRange()) {
					// 	const section = this._sheet.getColumns().getOrCreateSectionAt(i);
					// 	section.setFormat(formatDef.copy());
					// } else {
					const cell = this.createRC(i, j);
					cell.setFormat(formatDef.copy());
					// }
				}
				const textFormat = this._sheet.getTextFormatAtRC(i, j);
				if (!textFormat.hasEqualDefinedValues(textFormatDef)) {
					// if (range.isRowRange()) {
					// 	const section = this._sheet.getRows().getOrCreateSectionAt(j);
					// 	section.setTextFormat(textFormatDef.copy());
					// } else if (range.isColumnRange()) {
					// 	const section = this._sheet.getColumns().getOrCreateSectionAt(i);
					// 	section.setTextFormat(textFormatDef.copy());
					// } else {
					const cell = this.createRC(i, j);
					cell.setTextFormat(textFormatDef.copy());
					// }
				}
				const attributes = this._sheet.getCellAttributesAtRC(i, j);
				if (!attributes.hasEqualDefinedValues(attributeDef)) {
					// if (range.isRowRange()) {
					// 	const section = this._sheet.getRows().getOrCreateSectionAt(j);
					// 	section.setAttributes(attributeDef.copy());
					// } else if (range.isColumnRange()) {
					// 	const section = this._sheet.getColumns().getOrCreateSectionAt(i);
					// 	section.setAttributes(attributeDef.copy());
					// } else {
					const cell = this.createRC(i, j);
					cell.setAttributes(attributeDef.copy());
					// }
				}
			}
		}
	}

	clearContent() {
		this.enumerate((column, row, cell) => {
			cell.clearContent();
		});
	}

	clearFormats() {
		this.enumerate((column, row, cell) => {
			cell.setFormat(undefined);
			cell.setTextFormat(undefined);
		});
	}

	pasteData(data, targetRange, action) {
		const sourceRange = data.range;

		const updateExpression = (sheet, expr, xOff, yOff, absolute) => {
			expr.evaluate(sheet);
			const term = expr.getTerm();
			if (term !== undefined) {
				term.traverse((lterm) => {
					const { operand } = lterm;
					if (operand && operand instanceof SheetReference) {
						if (operand._name) {
							// TODO
						} else if (operand._range) {
							const range = operand._range;
							const rangeSheet = range.getSheet();
							const targetSheet = targetRange.getSheet();
							const sourceSheet = sourceRange.getSheet();
							const initC = rangeSheet.getColumns().getInitialSection();
							// if copy or reference is within source range
							if (
								data.cut === false ||
								(range._x1 - initC >= sourceRange._x1 &&
									range._x2 - initC <= sourceRange._x2 &&
									range._y1 >= sourceRange._y1 &&
									range._y2 <= sourceRange._y2)
							) {
								if (sourceSheet === rangeSheet) {
									if (data.cut) {
										// moved range to another sheet
										if (sourceSheet !== targetSheet) {
											range.setSheet(targetSheet);
											operand.setItem(targetSheet);
										}
									} else {
										range.setSheet(targetSheet);
										operand.setItem(targetSheet);
									}
								}
								if (absolute === false || targetSheet === rangeSheet ||
									(data.cut && absolute && sourceSheet === rangeSheet)) {
									if (range._x1R || absolute) {
										range._x1 += xOff;
									}
									if (range._y1R || absolute) {
										range._y1 += yOff;
									}
									if (range._x2R || absolute) {
										range._x2 += xOff;
									}
									if (range._y2R || absolute) {
										range._y2 += yOff;
									}
								}
								if (
									range._x1 < initC ||
									range._y1 < 0 ||
									range._x2 < initC ||
									range._y2 < 0 ||
									range._x1 - initC >= rangeSheet.getColumnCount() ||
									range._x2 - initC >= rangeSheet.getColumnCount() ||
									range._y1 >= rangeSheet.getRowCount() ||
									range._y2 >= rangeSheet.getRowCount()
								) {
									operand._range = undefined;
								}
							}
						}
					}
					return true;
				});
			}
			expr.correctFormula(sheet);
		};

		const updateCell = (sheet, cell, xOff, yOff, absolute) => {
			const expr = cell.getExpression();
			if (expr !== undefined && expr.hasFormula()) {
				updateExpression(sheet, expr, xOff, yOff, absolute);
			}
		};

		const invalidateExpression = (expr) => {
			const term = expr.getTerm();
			if (term !== undefined) {
				term.traverse((lterm) => {
					const { operand } = lterm;
					if (operand && operand instanceof SheetReference) {
						if (operand._name) {
							// TODO need to invalidate name definition, if target in name range
						} else if (operand._range) {
							const range = operand._range;
							const rangeSheet = range.getSheet();
							const initC = rangeSheet.getColumns().getInitialSection();
							if (targetRange.getSheet() === rangeSheet) {
								if (
									range._x1 - initC < sourceRange._x1 ||
									range._x2 - initC > sourceRange._x2 ||
									range._y1 < sourceRange._y1 ||
									range._y2 > sourceRange._y2
								) {
									if (
										range._x1 - initC >= targetRange._x1 &&
										range._x2 - initC <= targetRange._x2 &&
										range._y1 >= targetRange._y1 &&
										range._y2 <= targetRange._y2
									) {
										operand._range = undefined;
									}
								}
							}
						}
					}
					return true;
				});
				expr.correctFormula(targetRange.getSheet());
			}
		};

		const invalidateCell = (cell) => {
			const expr = cell.getExpression();
			if (expr !== undefined && expr.hasFormula()) {
				invalidateExpression(expr);
			}
		};

		const transfer = (sourceCell, sourceAttributes, x, y, offsetX, offsetY) => {
			let targetCell = this.getRC(x, y);
			if (sourceCell) {
				const copy = sourceCell.copy();
				switch (action) {
					case 'all':
						this.setRCTo(x, y, copy);
						updateCell(targetRange.getSheet(), copy, offsetX, offsetY, false);
						break;
					case 'formulas':
						if (targetCell) {
							targetCell.setExpression(copy.getExpression());
							updateCell(targetRange.getSheet(), targetCell, offsetX, offsetY, false);
						} else {
							copy.clearFormat();
							this.setRCTo(x, y, copy);
							updateCell(targetRange.getSheet(), copy, offsetX, offsetY, false);
						}
						break;
					case 'values':
						copy.clearFormula();
						if (targetCell) {
							targetCell.setExpression(copy.getExpression());
							targetCell.setValue(sourceCell.getValue());
						} else {
							copy.clearFormat();
							this.setRCTo(x, y, copy);
						}
						break;
					case 'formats':
						if (targetCell) {
							targetCell.setFormat(copy.getFormat());
							targetCell.setTextFormat(copy.getTextFormat());
							targetCell.setAttributes(copy.getAttributes());
						} else {
							copy.clearContent();
							this.setRCTo(x, y, copy);
						}
						break;
				}
			} else {
				switch (action) {
					case 'all':
						// TODO: if row or column format create cell with empty format
						this.setRCTo(x, y, undefined);
						targetCell = undefined;
						break;
					case 'formula':
						if (targetCell) {
							targetCell.clearContent();
						}
						break;
					case 'values':
						if (targetCell) {
							targetCell.clearContent();
						}
						break;
					case 'formats':
						// TODO: if row or column format create cell with empty format
						if (targetCell) {
							targetCell.clearFormat();
						}
						break;
				}
			}
			switch (action) {
				case 'all':
				case 'formats': {
					const targetFormat = targetRange.getSheet().getFormatAtRC(x, y);
					const targetTextFormat = targetRange.getSheet().getTextFormatAtRC(x, y);
					const targetAttributes = targetRange.getSheet().getCellAttributesAtRC(x, y);
					if (!targetFormat.isEqual(sourceAttributes.format, true)) {
						if (!targetCell) {
							targetCell = this.createRC(x, y);
						}
						targetCell.setFormat(sourceAttributes.format.copy());
					}
					if (!targetTextFormat.isEqual(sourceAttributes.textFormat, true)) {
						if (!targetCell) {
							targetCell = this.createRC(x, y);
						}
						targetCell.setTextFormat(sourceAttributes.textFormat.copy());
					}
					if (!targetAttributes.isEqual(sourceAttributes.attributes, true)) {
						if (!targetCell) {
							targetCell = this.createRC(x, y);
						}
						targetCell.setAttributes(sourceAttributes.attributes.copy());
					}
					break;
				}
			}
		};

		const getSourceFormat = (cell, pos, sourceData) => {
			// cell has no own format
			if (cell && cell.getFormat()) {
				return cell.getFormat();
			}
			let format = sourceData.defaultCell.getFormat();
			let section = sourceData.columns[pos.x];
			if (section && section.getFormat()) {
				format = section.getFormat();
			}
			section = sourceData.rows[pos.y];
			if (section && section.getFormat()) {
				format = section.getFormat();
			}
			return format;
		};

		const getSourceTextFormat = (cell, pos, sourceData) => {
			// cell has no own textformat
			if (cell && cell.getTextFormat()) {
				return cell.getTextFormat();
			}
			let format = sourceData.defaultCell.getTextFormat();
			let section = sourceData.columns[pos.x];
			if (section && section.getTextFormat()) {
				format = section.getTextFormat();
			}
			section = sourceData.rows[pos.y];
			if (section && section.getTextFormat()) {
				format = section.getTextFormat();
			}
			return format;
		};

		const getSourceCellAttributes = (cell, pos, sourceData) => {
			// cell has no own format
			if (cell && cell.getAttributes()) {
				return cell.getAttributes();
			}
			let format = sourceData.defaultCell.getAttributes();
			let section = sourceData.columns[pos.x];
			if (section && section.getAttributes()) {
				format = section.getAttributes();
			}
			section = sourceData.rows[pos.y];
			if (section && section.getAttributes()) {
				format = section.getAttributes();
			}
			return format;
		};

		const getAttributes = (cell, pos, datap) => {
			const attrs = {};
			attrs.format = getSourceFormat(cell, pos, datap);
			attrs.textFormat = getSourceTextFormat(cell, pos, datap);
			attrs.attributes = getSourceCellAttributes(cell, pos, datap);
			return attrs;
		};

		const sourceData = data.data;
		const sourceColumn = sourceRange.getX1();
		const sourceRow = sourceRange.getY1();
		const targetColumn = targetRange.getX1();
		const targetRow = targetRange.getY1();
		let sourceAttributes;

		sourceData.evaluate(this.getSheet());

		if (sourceRange.getWidth() === 1 && sourceRange.getHeight() === 1) {
			const sourcePos = { x: 0, y: 0 };
			const cell = sourceData.get(sourcePos);
			sourceAttributes = getAttributes(cell, sourcePos, data);
			targetRange.enumerateCells(false, (pos) => {
				transfer(cell, sourceAttributes, pos.x, pos.y, pos.x - sourceColumn, pos.y - sourceRow);
			});
		} else {
			targetRange.enumerateCells(false, (pos) => {
				const sourcePos = { x: pos.x - targetColumn, y: pos.y - targetRow };
				const cell = sourceData.get(sourcePos);
				sourceAttributes = getAttributes(cell, sourcePos, data);
				transfer(cell, sourceAttributes, pos.x, pos.y, targetColumn - sourceColumn, targetRow - sourceRow);
			});
		}

		if (data.cut && action !== 'formats') {
			this.getSheet()
				.getStreamSheetContainer()
				.getStreamSheetsContainer()
				.enumerateProcessSheets((sheet) => {
					// invalidate references that point into target range
					const dataSheet = sheet.getDataProvider();
					dataSheet.enumerate((lcolumn, lrow, cell) => {
						if (
							!(
								lcolumn >= targetRange._x1 &&
								lcolumn <= targetRange._x2 &&
								lrow >= targetRange._y1 &&
								lrow <= targetRange._y2
							)
						) {
							invalidateCell(cell);
						}
					});
					// update references that point into source range
					dataSheet.enumerate((lcolumn, lrow, cell) => {
						if (
							!(
								lcolumn >= targetRange._x1 &&
								lcolumn <= targetRange._x2 &&
								lrow >= targetRange._y1 &&
								lrow <= targetRange._y2
							)
						) {
							updateCell(sheet, cell, targetColumn - sourceColumn, targetRow - sourceRow, true);
						}
					});
					dataSheet._names.forEach((name) => {
						const expr = name.getExpression();
						if (expr !== undefined && expr.hasFormula()) {
							invalidateExpression(expr);
							updateExpression(sheet, expr, targetColumn - sourceColumn, targetRow - sourceRow, true);
						}
					});

					const updateGraph = (item) => {
						const attrFormula = item.getItemAttributes().getAttribute('sheetformula');

						if (attrFormula) {
							const expr = attrFormula.getExpression();
							if (expr !== undefined && expr.hasFormula()) {
								invalidateExpression(expr);
								updateExpression(sheet, expr, targetColumn - sourceColumn, targetRow - sourceRow, true);
								item._noFormulaUpdate = true;
								item.expressions.forEach(exp => {
									updateExpression(sheet, exp, targetColumn - sourceColumn, targetRow - sourceRow, true);
								});
							}
						}
					};

					GraphUtils.traverseItem(sheet.getCells(), (item) => updateGraph(item));

					// dataSheet._graphs.forEach((name) => {
					// 	const expr = name.getExpression();
					// 	if (expr !== undefined && expr.hasFormula()) {
					// 		invalidateExpression(expr);
					// 		updateExpression(sheet, expr, targetColumn - sourceColumn, targetRow - sourceRow, true);
					// 	}
					// });
				});
			const graph = this.getSheet().getGraph();
			graph.getSheetNames().forEach((name) => {
				const expr = name.getExpression();
				// need to pass sheet to updateExpression() or otherwise reference in name gets lost...
				const sheet = expr && expr.hasFormula() && getSheetFromExpression(expr);
				if (sheet) {
					invalidateExpression(expr);
					updateExpression(sheet, expr, targetColumn - sourceColumn, targetRow - sourceRow, true);
				}
			});
		}
	}

	/**
	 * Enumerate all cells.
	 * @param {function(column, row, cell)} callback Callback that is called for each existing cell.
	 */
	enumerate(callback) {
		let i;
		let j;
		let m;
		const n = this.getRowCount();
		let rowdata;

		for (i = 0; i < n; i += 1) {
			rowdata = this._rows[i];
			if (rowdata) {
				for (j = 0, m = rowdata.length; j < m; j += 1) {
					const coldata = rowdata[j];
					if (coldata !== undefined) {
						if (callback(j, i, coldata) === false) {
							return;
						}
					}
				}
			}
		}
	}

	enumerateFirstFinal(callback) {
		let i;
		let j;
		let m;
		const n = this.getRowCount();
		let rowdata;
		let coldata;

		for (i = 0; i < n; i += 1) {
			rowdata = this.getRow(i);
			if (rowdata) {
				for (j = 1, m = rowdata.length; j < m; j += 1) {
					coldata = rowdata[j];
					if (coldata !== undefined) {
						if (callback(j, i, coldata) === false) {
							return;
						}
					}
				}
				[coldata] = rowdata;
				if (coldata !== undefined) {
					if (callback(0, i, coldata) === false) {
						return;
					}
				}
			}
		}
	}

	/**
	 * Enumerate cells in given column. Only used cells are enumerated.
	 * @param {Number} column Column to enumerate.
	 * @param {function} callback Function to call for cells. Passed arguments are the row index and the cell.
	 */
	enumerateColumn(column, callback) {
		let i;
		const n = this.getRowCount();
		let rowdata;

		for (i = 0; i < n; i += 1) {
			rowdata = this.getRow(i);
			if (rowdata) {
				const coldata = rowdata[column];
				if (coldata !== undefined) {
					if (callback(i, coldata) === false) {
						return;
					}
				}
			}
		}
	}

	/**
	 * Retrieve next cell, that contains a value, if given cell is empty or does not contain a value, if given cell
	 * is filled
	 * @param {Point) pos Cell location to start from.
	 * @param {String} direction Direction search as string ('left', 'up', 'right' 'bottom')
	 * @returns {number} Index of identified cell.
	 */
	getNextOrLastUsedCell(pos, direction) {
		let i;
		let rowdata;
		let cell;
		let used;
		let max;
		let last;

		switch (direction) {
			case 'left':
				cell = this.getRC(this._sheet.getPreviousSelectableColumn(pos.x, pos.y), pos.y);
				used = cell === undefined || cell.getExpression() === undefined;
				rowdata = this.getRow(pos.y);
				i = pos.x;
				while (i >= 0) {
					last = i;
					i = this._sheet.getPreviousSelectableColumn(i, pos.y);
					if (i === last) {
						return i;
					}
					if (rowdata) {
						const coldata = rowdata[i];
						if (used) {
							if (coldata && coldata.getExpression()) {
								return i;
							}
						} else if (!coldata || !coldata.getExpression()) {
							return this._sheet.getNextSelectableColumn(i, pos.y);
						}
					}
				}
				return 0;
			case 'right':
				max = this._sheet.getColumnCount() + 1;
				cell = this.getRC(this._sheet.getNextSelectableColumn(pos.x, pos.y), pos.y);
				used = cell === undefined || cell.getExpression() === undefined;
				rowdata = this.getRow(pos.y);
				i = pos.x;
				while (i < max) {
					last = i;
					i = this._sheet.getNextSelectableColumn(i, pos.y);
					if (i === last) {
						return i;
					}
					if (rowdata) {
						const coldata = rowdata[i];
						if (used) {
							if (coldata && coldata.getExpression()) {
								return i;
							}
						} else if (!coldata || !coldata.getExpression()) {
							return this._sheet.getPreviousSelectableColumn(i, pos.y);
						}
					}
				}
				return max;
			case 'up':
				cell = this.getRC(pos.x, this._sheet.getPreviousSelectableRow(pos.y, pos.x));
				used = cell === undefined || cell.getExpression() === undefined;
				i = pos.y;
				while (i >= 0) {
					last = i;
					i = this._sheet.getPreviousSelectableRow(i, pos.x);
					if (i === last) {
						return i;
					}
					rowdata = this.getRow(i);
					if (used) {
						if (rowdata) {
							const coldata = rowdata[pos.x];
							if (coldata && coldata.getExpression()) {
								return i;
							}
						}
					} else if (rowdata) {
						const coldata = rowdata[pos.x];
						if (!coldata || !coldata.getExpression()) {
							return this._sheet.getNextSelectableRow(i, pos.x);
						}
					} else {
						return this._sheet.getNextSelectableRow(i, pos.x);
					}
				}
				return 0;
			case 'down':
				max = this.getRowCount() + 1;
				cell = this.getRC(pos.x, this._sheet.getNextSelectableRow(pos.y, pos.x));
				used = cell === undefined || cell.getExpression() === undefined;
				i = pos.y;
				while (i < max) {
					last = i;
					i = this._sheet.getNextSelectableRow(i, pos.x);
					if (i === last) {
						return i;
					}
					rowdata = this.getRow(i);
					if (used) {
						if (rowdata) {
							const coldata = rowdata[pos.x];
							if (coldata && coldata.getExpression()) {
								return i;
							}
						}
					} else if (rowdata) {
						const coldata = rowdata[pos.x];
						if (!coldata || !coldata.getExpression()) {
							return this._sheet.getPreviousSelectableRow(i, pos.x);
						}
					} else {
						return this._sheet.getPreviousSelectableRow(i, pos.x);
					}
				}
				return this._sheet.getRowCount() - 1;
		}

		return 0;
	}

	calc(item) {
		this.enumerate((c, r, cell) => {
			cell.calc(item);
			return true;
		});
	}

	evaluate(item) {
		this.enumerate((c, r, cell) => {
			cell.evaluate(item);
			return true;
		});

		this._names.forEach((name) => {
			name.evaluate(item);
		});

		this._graphs.forEach((name) => {
			name.evaluate(item);
		});
	}

	invalidateTerms() {
		this.enumerate((c, r, cell) => {
			cell.invalidateTerm();
			return true;
		});

		this._names.forEach((name) => {
			name.invalidateTerm();
		});

		this._graphs.forEach((name) => {
			name.invalidateTerm();
		});
	}

	save(writer) {
		writer.writeStartElement('data');
		writer.writeStartArray('r');

		const sheet = this.getSheet();
		const rowCount = sheet.getRowCount();
		const columnCount = sheet.getColumnCount();
		let cancel;

		this._rows.forEach((rowdata, rowIndex) => {
			if (rowdata && rowIndex < rowCount) {
				writer.writeStartElement('r');
				writer.writeAttributeNumber('n', rowIndex, 0);
				writer.writeStartArray('c');
				cancel = true;
				rowdata.forEach((coldata, colIndex) => {
					if (coldata !== undefined && colIndex < columnCount && coldata.saveNeeded(writer)) {
						writer.writeStartElement('c');
						writer.writeAttributeNumber('n', colIndex, 0);
						coldata.save(writer);
						writer.writeEndElement();
						cancel = false;
					}
				});
				writer.writeEndArray('c');
				writer.writeEndElement(cancel);
			}
		});

		writer.writeEndArray('r');

		writer.writeEndElement();
	}

	read(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'r': {
					const row = Number(reader.getAttribute(child, 'n'));
					const rowData = [];
					let hasCell = false;
					reader.iterateObjects(child, (lname, grandchild) => {
						switch (lname) {
							case 'c': {
								const column = Number(reader.getAttribute(grandchild, 'n'));
								const cellNode = reader.getObject(grandchild, 'cell');
								if (cellNode !== undefined) {
									const cellData = new Cell();
									cellData.read(reader, cellNode);
									if (cellData.hasContent() || cellData.hasFormat()) {
										rowData[column] = cellData;
										hasCell = true;
									}
								}
								break;
							}
							default:
								break;
						}
					});
					if (hasCell) {
						this._rows[row] = rowData;
					}
					break;
				}
				default:
					break;
			}
		});
	}

	JSDateToExcelDate(inDate) {
		return dateLocal2serial(inDate);
	}

	excelDateToJSDate(serial) {
		return serial2date(serial);
	}

	getCellValueSeries(source, target) {
		const horizontal = target.getX2() !== source.getX2();
		let cell;
		let cells;
		let cellsAlpha;
		let val;
		let sum;
		let sumAlpha;
		let lastVal;
		let firstVal;
		let lastValAlpha;
		let firstValAlpha;
		const sections = [];
		const up = horizontal ? source.getX1() < target.getX1() : source.getY1() < target.getY1();

		for (
			let i = horizontal ? source.getY1() : source.getX1();
			i <= (horizontal ? source.getY2() : source.getX2());
			i += 1
		) {
			cells = 0;
			cellsAlpha = 0;
			sum = 0;
			sumAlpha = 0;
			lastVal = undefined;
			lastValAlpha = undefined;
			let monthDiff;
			let lastMonthDiff;
			let noDate = false;
			for (
				let j = horizontal ? source.getX1() : source.getY1();
				j <= (horizontal ? source.getX2() : source.getY2());
				j += 1
			) {
				let pos;
				if (horizontal) {
					pos = { x: j, y: i };
				} else {
					pos = { x: i, y: j };
				}
				cell = this.get(pos);
				if (cell) {
					const expr = cell.getExpression();
					if (expr && !expr.hasFormula()) {
						val = cell.getValue();
						if (Numbers.isNumber(val)) {
							const attr = this.getSheet()
								.getTextFormatAt(pos)
								.getLocalCulture()
								.getValue();
							const date = attr && attr.length && attr.indexOf('date') !== -1;
							if (date) {
								const dateVal = this.excelDateToJSDate(val);
								if (lastVal !== undefined) {
									const lastDateVal = this.excelDateToJSDate(lastVal);
									lastMonthDiff = monthDiff;
									if (dateVal.getDate() === lastDateVal.getDate()) {
										monthDiff =
											dateVal.getMonth() -
											lastDateVal.getMonth() +
											(dateVal.getFullYear() - lastDateVal.getFullYear()) * 12;
										if (lastMonthDiff && lastMonthDiff !== monthDiff) {
											noDate = true;
										}
									}
								}
							}
							if (lastVal !== undefined) {
								sum += val - lastVal;
							}
							lastVal = val;
							if (firstVal === undefined) {
								firstVal = val;
							}
							cells += 1;
						} else if (typeof val === 'string') {
							const number = Number((val.match(/\d+$/) || []).pop());
							if (Numbers.isNumber(number)) {
								if (lastValAlpha !== undefined) {
									sumAlpha += number - lastValAlpha;
								}
								lastValAlpha = number;
								if (firstValAlpha === undefined) {
									firstValAlpha = number;
								}
								cellsAlpha += 1;
							}
						}
					}
				}
			}
			sections[i] = {
				step: cells > 1 ? sum / (cells - 1) : 0,
				final: lastVal,
				first: firstVal,
				stepAlpha: cellsAlpha > 1 ? sumAlpha / (cellsAlpha - 1) : 1,
				finalAlpha: lastValAlpha,
				firstAlpha: firstValAlpha,
				monthDiff: noDate === false ? monthDiff : undefined
			};
		}

		const cellData = [];

		sections.forEach((section, index) => {
			let repeat;
			let repeatAlpha;

			if (horizontal) {
				repeat = up ? 1 : target.getWidth();
			} else {
				repeat = up ? 1 : target.getHeight();
			}
			repeatAlpha = repeat;

			for (
				let i = horizontal ? target.getX1() : target.getY1();
				i <= (horizontal ? target.getX2() : target.getY2());
				i += 1
			) {
				let pos;
				if (horizontal) {
					pos = { x: source.getX1() + ((i - target.getX1()) % source.getWidth()), y: index };
				} else {
					pos = { x: index, y: source.getY1() + ((i - target.getY1()) % source.getHeight()) };
				}
				cell = this.get(pos);
				if (cell) {
					const expr = cell.getExpression();
					if (expr && !expr.hasFormula()) {
						val = cell.getValue();
						if (Numbers.isNumber(val)) {
							let set = false;
							if (section.monthDiff) {
								const attr = this.getSheet()
									.getTextFormatAt(pos)
									.getLocalCulture()
									.getValue();
								const date = attr && attr.length && attr.indexOf('date') !== -1;
								if (date) {
									const dateVal = this.excelDateToJSDate(val);
									if (up) {
										const finalDateVal = this.excelDateToJSDate(section.final);
										if (finalDateVal.getDate() === dateVal.getDate()) {
											set = true;
											dateVal.setMonth(
												(finalDateVal.getMonth() + section.monthDiff * repeat) % 12
											);
											dateVal.setFullYear(
												finalDateVal.getFullYear() +
													Math.floor(finalDateVal.getMonth() + section.monthDiff * repeat) /
														12
											);
											val = this.JSDateToExcelDate(dateVal);
											repeat += 1;
										}
									} else {
										const firstDateVal = this.excelDateToJSDate(section.first);
										if (firstDateVal.getDate() === dateVal.getDate()) {
											set = true;
											dateVal.setMonth(
												(firstDateVal.getMonth() - section.monthDiff * repeat) % 12
											);
											dateVal.setFullYear(
												firstDateVal.getFullYear() +
													Math.floor(firstDateVal.getMonth() - section.monthDiff * repeat) /
														12
											);
											val = this.JSDateToExcelDate(dateVal);
											repeat -= 1;
										}
									}
								}
							}
							if (!set) {
								if (up) {
									val = section.final + section.step * repeat;
									repeat += 1;
								} else {
									val = section.first - section.step * repeat;
									repeat -= 1;
								}
							}
							val = MathUtils.roundTo(val, 10);
						} else if (typeof val === 'string') {
							const number = (val.match(/\d+$/) || []).pop();
							if (number !== undefined && number.length) {
								let newValue;
								val = val.substring(0, val.length - number.length);
								if (up) {
									newValue = section.finalAlpha + section.stepAlpha * repeatAlpha;
									repeatAlpha += 1;
								} else {
									newValue = section.firstAlpha - section.stepAlpha * repeatAlpha;
									repeatAlpha -= 1;
								}
								newValue = MathUtils.roundTo(newValue, 10);
								val += newValue;
							}
						} else {
							val = undefined;
						}
						if (val !== undefined) {
							const data = {};
							if (horizontal) {
								data.reference = this.getSheet()
									.getOwnSelection()
									.cellToString(i, index);
							} else {
								data.reference = this.getSheet()
									.getOwnSelection()
									.cellToString(index, i);
							}
							data.value = val;
							cellData.push(data);
						}
					}
				}
			}
		});

		return cellData;
	}

	static get TYPE() {
		return TYPE;
	}
};
