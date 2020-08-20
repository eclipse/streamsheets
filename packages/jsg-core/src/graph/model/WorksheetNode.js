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
const { NumberFormatter } = require('@cedalo/number-format');
const { Term, BinaryOperator, Reference, Locale } = require('@cedalo/parser');
const { parse, isValid } = require('date-fns');
const de = require('date-fns/locale/de').default;
const enGB = require('date-fns/locale/en-GB').default;
const enUS = require('date-fns/locale/en-US').default;

const JSG = require('../../JSG');
const Expression = require('../expr/Expression');
const ItemAttributes = require('../attr/ItemAttributes');
const NotificationCenter = require('../notifications/NotificationCenter');
const Notification = require('../notifications/Notification');
const Numbers = require('../../commons/Numbers');
const Rectangle = require('../../geometry/Rectangle');

const RowHeaderNode = require('./RowHeaderNode');
const CellsNode = require('./CellsNode');
const ContentNode = require('./ContentNode');
const Cell = require('./Cell');
const DataProvider = require('./DataProvider');
const HeaderSection = require('./HeaderSection');
const CellRange = require('./CellRange');
const ColumnHeaderNode = require('./ColumnHeaderNode');
const SheetHeaderNode = require('./SheetHeaderNode');
const SheetReference = require('../expr/SheetReference');
const WorksheetAttributes = require('../attr/WorksheetAttributes');
const CellAttributes = require('../attr/CellAttributes');
const CellFormatAttributes = require('../attr/CellFormatAttributes');
const CellTextFormatAttributes = require('../attr/CellTextFormatAttributes');
const Selection = require('./Selection');
const ExpressionHelper = require('../expr/ExpressionHelper');

const SelectionMode = {
	CELL: 0,
	COLUMN: 1,
	ROW: 2
};
const defaultCellErrorValue = '#####';
const locales = { en: enGB, enUS, de };
const dateFormats = [
	'dd.MM.yy',
	'dd.MM.yy HH:mm',
	'dd.MM.yyyy HH:mm',
	'dd.MM.yyyy',
	'dd. MMM yyyy HH:mm',
	'dd. MMM yy',
	'dd. MMM yyyy',
	'dd. MMM',
	'MMM yy',
	'MMM yyyy',
	'HH:mm',
	'HH:mm:ss',
	'HH:mm:ss.SSS'
];

const SELECTION_CHANGED_NOTIFICATION = 'sheet_selection_changed_notification';

const unquote = (str) => {
	if (str.startsWith('"')) str = str.substring(1);
	if (str.endsWith('"')) str = str.substring(0, str.length - 1);
	return str;
};

/**
 * Node representing a worksheet. The worksheet con tains additional nodes for the rows,
 * columns, cells and the top left corner.
 *
 * @class WorksheetNode
 * @extends ContentNode
 * @constructor
 */
module.exports = class WorksheetNode extends ContentNode {
	constructor() {
		super();

		this.addAttribute(new WorksheetAttributes());

		this._selection = new Selection(this);

		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setClipChildren(true);
		this.getItemAttributes().setContainer(false);

		// create default cell for default format
		this.resetDefaultFormat();

		this._cells = this.addItem(new CellsNode());
		this._columns = this.addItem(new ColumnHeaderNode());
		this._rows = this.addItem(new RowHeaderNode());
		this._corner = this.addItem(new SheetHeaderNode());
		this._cells.getDataProvider().setSheet(this);
	}

	newInstance() {
		return new WorksheetNode();
	}

	getDefaultFormat() {
		return this._defaultCell.getFormat();
	}

	getDefaultTextFormat() {
		return this._defaultCell.getTextFormat();
	}

	getDefaultCellAttributes() {
		return this._defaultCell.getAttributes();
	}

	resetDefaultFormat() {
		this._defaultCell = this.createDefaultCell();
	}

	createDefaultCell() {
		const cell = new Cell();
		cell.getOrCreateFormat();
		cell.getOrCreateTextFormat();
		cell.getOrCreateAttributes();
		return cell;
	}

	getOwnSelection() {
		return this._selection;
	}

	setSelection(id, data) {
		super.setSelection(id, data);

		const mySelectionId = String(this.getSelectionId());
		if (id === mySelectionId) {
			this._selection = Selection.fromStringMulti(data.getValue(), this);
			NotificationCenter.getInstance().send(
				new Notification(WorksheetNode.SELECTION_CHANGED_NOTIFICATION, { item: this, updateFinal: true })
			);
		}
	}

	removeSelection(id) {
		super.removeSelection(id);
		const mySelectionId = String(this.getSelectionId());
		if (id === mySelectionId) {
			this._selection.clear();
		}
	}

	/**
	 * Layout process sheet container items.
	 *
	 * @method layout
	 */
	layout() {
		const wsattributes = this.getWorksheetAttributes();
		let header = wsattributes.getShowHeader().getValue();

		const graph = this.getGraph();
		const colSize = this._columns.getInternalSize();
		const rowSize = this._rows.getInternalSize();

		if (graph !== undefined) {
			const view = graph.getViewParams();
			if (view && view.hideheader !== null) {
				header = false;
			}
		}

		this._corner.getItemAttributes().setVisible(header);
		this._rows.getItemAttributes().setVisible(header);
		this._columns.getItemAttributes().setVisible(header);

		const box = JSG.boxCache.get();

		if (header) {
			box.setLeft(rowSize.x);
			box.setTop(0);
			box.setWidth(colSize.x);
			box.setHeight(colSize.y);

			this._columns.setBoundingBoxTo(box);

			box.setLeft(0);
			box.setTop(colSize.y);
			box.setWidth(rowSize.x);
			box.setHeight(rowSize.y);

			this._rows.setBoundingBoxTo(box);

			box.setLeft(rowSize.x);
			box.setTop(colSize.y);
			box.setWidth(colSize.x);
			box.setHeight(rowSize.y);

			this._cells.setBoundingBoxTo(box);

			box.setLeft(0);
			box.setTop(0);
			box.setWidth(rowSize.x);
			box.setHeight(colSize.y);

			if (rowSize.x === 0 || colSize.y === 0) {
				this._corner.getItemAttributes().setVisible(false);
			} else {
				this._corner.getItemAttributes().setVisible(true);
				this._corner.setBoundingBoxTo(box);
			}
		} else {
			box.setLeft(0);
			box.setTop(0);
			box.setWidth(colSize.x);
			box.setHeight(rowSize.y);

			this._cells.setBoundingBoxTo(box);
		}

		JSG.boxCache.release(box);

		super.layout();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy._assignItems();

		return copy;
	}

	_assignItems() {
		let i;
		const cp = this.getContentPane();

		for (i = 0; i < cp.getItemCount(); i += 1) {
			const item = cp.getItemAt(i);
			if (item instanceof CellsNode) {
				this._cells = item;
			} else if (item instanceof ColumnHeaderNode) {
				this._columns = item;
			} else if (item instanceof RowHeaderNode) {
				this._rows = item;
			} else if (item instanceof SheetHeaderNode) {
				this._corner = item;
			}
		}
	}

	isAddLabelAllowed() {
		return false;
	}

	getWorksheetAttributes() {
		return this.getModelAttributes().getAttribute(WorksheetAttributes.NAME);
	}

	isCalcOnDemand() {
		return this.getWorksheetAttributes()
			.getCalcOnDemand()
			.getValue();
	}

	setCalcOnDemand(flag) {
		this.getWorksheetAttributes().setCalcOnDemand(flag);
	}

	isShowFormulas() {
		return this.getWorksheetAttributes()
			.getShowFormulas()
			.getValue();
	}

	setShowFormulas(flag) {
		this.getWorksheetAttributes().setShowFormulas(flag);
	}

	isGridVisible() {
		const graph = this.getGraph();

		if (graph !== undefined) {
			const view = graph.getViewParams();
			if (view) {
				if (view.hidegrid !== null) {
					return false;
				}
			}
		}

		return this.getWorksheetAttributes()
			.getShowGrid()
			.getValue();
	}

	setGridVisible(flag) {
		return this.getWorksheetAttributes().setShowGrid(flag);
	}

	isProtected() {
		const graph = this.getGraph();

		if (graph !== undefined) {
			if (graph.overrideProtection) {
				return false;
			}
			const view = graph.getViewParams();
			if (view && view.viewMode !== null) {
				return true;
			}
		}
		return this.getWorksheetAttributes()
			.getProtected()
			.getValue();
	}

	getProtected(flag) {
		return this.getWorksheetAttributes()
			.getProtected()
			.getValue();
	}

	setProtected(flag) {
		this.getWorksheetAttributes().setProtected(flag);
	}

	updateRowCount() {
		if (this._cells === undefined) {
			// not initialized yet
			return;
		}
		const rows = Math.max(0, this.getDataProvider().getRowCount());
		this.setRowCount(rows);
	}

	setRowCount(count) {
		this.getWorksheetAttributes().setRows(count);
	}

	getRowCount() {
		return this.getWorksheetAttributes()
			.getRows()
			.getValue();
	}

	setColumnCount(count) {
		this.getWorksheetAttributes().setColumns(count);
	}

	getColumnCount() {
		return this.getWorksheetAttributes()
			.getColumns()
			.getValue();
	}

	getColumns() {
		return this._columns;
	}

	getRows() {
		return this._rows;
	}

	getCorner() {
		return this._corner;
	}

	getDataProvider() {
		return this.getCells().getDataProvider();
	}

	setDataProvider(data) {
		return this.getCells().setDataProvider(data);
	}

	getCells() {
		return this._cells;
	}

	saveContent(writer, absolute) {
		this.compress();

		super.saveContent(writer, absolute);

		writer.writeAttributeString('type', 'worksheetnode');

		writer.writeStartElement('defaultcell');
		this._defaultCell.save(writer);
		writer.writeEndElement();
	}

	_assignName(id) {
		this.setName(`Worksheet${id}`);
	}

	read(reader, object) {
		super.read(reader, object);

		const defaultCell = reader.getObject(object, 'defaultcell');
		if (defaultCell !== undefined) {
			const cell = reader.getObject(defaultCell, 'cell');
			this._defaultCell.read(reader, cell);
		}

		this._assignItems();
	}

	readFromClipboard(reader) {
		const root = reader.getRoot();
		const selection = reader.getObject(root, 'selection');
		if (selection === undefined) {
			return undefined;
		}

		const range = reader.getAttribute(selection, 'range');
		if (range === undefined) {
			return undefined;
		}

		const sheetId = Number(reader.getAttribute(selection, 'sheetid'));
		// use this sheet, if sheet can not be found -> sheet in another machine
		const sourceSheet = this.getGraph().getItemById(Number(sheetId)) || this;

		const result = {
			sheetId,
			cut: reader.getAttribute(selection, 'cut') === '1',
			rangeString: range,
			range: CellRange.parse(range, sourceSheet, true, true).shiftFromSheet(),
			data: new DataProvider(this),
			columns: [],
			rows: [],
			defaultCell: this._defaultCell.copy()
		};

		let object;
		let c;
		let r;
		let cellObject;

		reader.iterateObjects(selection, (name, child) => {
			switch (name) {
				case 'defaultcell':
					cellObject = reader.getObject(child, 'cell');
					result.defaultCell.read(reader, cellObject);
					break;
				case 'columns':
					reader.iterateObjects(child, (subname, subchild) => {
						c = Number(reader.getAttribute(subchild, 'index')) - result.range.getX1();
						object = new HeaderSection();
						object.read(reader, subchild);
						object._index = c;
						object._title = undefined;
						result.columns[c] = object;
					});
					break;
				case 'rows':
					reader.iterateObjects(child, (subname, subchild) => {
						r = Number(reader.getAttribute(subchild, 'index')) - result.range.getY1();
						object = new HeaderSection();
						object.read(reader, subchild);
						object._index = r;
						object._title = undefined;
						result.rows[r] = object;
					});
					break;
				case 'cells':
					reader.iterateObjects(child, (subname, subchild) => {
						r = Number(reader.getAttribute(subchild, 'r')) - result.range.getY1();
						c = Number(reader.getAttribute(subchild, 'c')) - result.range.getX1();
						object = new Cell();
						cellObject = reader.getObject(subchild, 'cell');
						object.read(reader, cellObject);
						result.data.setRCTo(c, r, object);
					});
					break;
			}
		});

		return result;
	}

	evaluate() {
		super.evaluate.call(this);

		if (this.getGraph()) {
			this.getDataProvider().evaluate(this);

			if (this.isCalcOnDemand() === false) {
				this.calc();
			}
		}
	}

	calc() {
		return this.getDataProvider().calc(this);
	}

	invalidateTerms() {
		if (this.getGraph()) {
			this.getDataProvider().invalidateTerms();
		}
		super.invalidateTerms.call(this);
	}

	getRangeFromPositions(cellStart, cellEnd) {
		let top;
		let left;
		let right;
		let bottom;

		if (
			cellStart.x === -1 ||
			this.getWorksheetAttributes()
				.getSelectionMode()
				.getValue() === WorksheetAttributes.SelectionModes.ROW
		) {
			left = 0;
			right = this._columns.getSections() - 1;
		} else {
			left = cellStart.x;
			if (cellEnd !== undefined) {
				if (cellEnd.x === -1) {
					left = 0;
					right = this._columns.getSections() - 1;
				} else {
					right = cellEnd.x;
				}
			}
		}

		if (cellStart.y === -1) {
			top = 0;
			bottom = this._rows.getSections() - 1;
		} else {
			top = cellStart.y;
			if (cellEnd !== undefined) {
				if (cellEnd.y === -1) {
					top = 0;
					bottom = this._rows.getSections() - 1;
				} else {
					bottom = cellEnd.y;
				}
			}
		}

		return new CellRange(this, left, top, right, bottom);
	}

	getCellRect(range) {
		const rect = new Rectangle(0, 0, 0, 0);

		rect.x = this._columns.getSectionPos(range.getX1());
		rect.y = this._rows.getSectionPos(range.getY1());
		rect.width = this._columns.getSectionPos(range.getX2() + 1) - rect.x;
		rect.height = this._rows.getSectionPos(range.getY2() + 1) - rect.y;

		return rect;
	}

	isCellProtected(c, r) {
		if (this.isProtected()) {
			if (c === -1 || r === -1) {
				return true;
			}
			const attr = this.getCellAttributesAtRC(c, r);
			return !!(attr && attr.getProtected().getValue());
		}

		return false;
	}

	isFormulaHidden(c, r) {
		if (this.isProtected()) {
			if (c === -1 || r === -1) {
				return true;
			}
			const attr = this.getCellAttributesAtRC(c, r);
			return !!(attr && attr.getVisible().getValue());
		}

		return false;
	}

	getNextSelectableColumn(index, row) {
		const columns = this.getColumns();
		const max = columns.getSections();
		let newIndex = index + 1;

		while (newIndex < max && (columns.getSectionSize(newIndex) === 0 || this.isCellProtected(newIndex, row))) {
			newIndex += 1;
		}

		return newIndex < max ? newIndex : index;
	}

	getPreviousSelectableColumn(index, row) {
		const columns = this.getColumns();
		let newIndex = index - 1;

		while (newIndex >= 0 && (columns.getSectionSize(newIndex) === 0 || this.isCellProtected(newIndex, row))) {
			newIndex -= 1;
		}

		return newIndex >= 0 ? newIndex : index;
	}

	getNextSelectableRow(index, column) {
		const rows = this.getRows();
		const max = rows.getSections();
		let newIndex = index + 1;

		while (newIndex < max && (rows.getSectionSize(newIndex) === 0 || this.isCellProtected(column, newIndex))) {
			newIndex += 1;
		}

		return newIndex < max ? newIndex : index;
	}

	getPreviousSelectableRow(index, column) {
		const rows = this.getRows();
		let newIndex = index - 1;

		while (newIndex >= 0 && (rows.getSectionSize(newIndex) === 0 || this.isCellProtected(column, newIndex))) {
			newIndex -= 1;
		}

		return newIndex >= 0 ? newIndex : index;
	}

	getCustomReference(property) {
		const ref = new SheetReference(this, property);

		return ref.isValid() ? ref : Reference.INVALID;
	}

	getFormatAtRC(column, row, cellInfo = true) {
		const data = this.getDataProvider();
		const finalFormat = new CellFormatAttributes();
		let format;

		if (cellInfo) {
			const cell = data.getRC(column, row);
			if (cell !== undefined) {
				format = cell.getFormat();
				if (format !== undefined) {
					finalFormat.accumulate(format);
				}
			}
		}

		format = this.getRows().getSectionFormat(row);
		if (format !== undefined) {
			finalFormat.accumulate(format);
		}

		format = this.getColumns().getSectionFormat(column);
		if (format !== undefined) {
			finalFormat.accumulate(format);
		}

		finalFormat.accumulate(this.getDefaultFormat());

		return finalFormat;
	}

	getFormatAt(pos, cellInfo = true) {
		return this.getFormatAtRC(pos.x, pos.y, cellInfo);
	}

	getTextFormatAtRC(column, row, cellInfo = true) {
		const data = this.getDataProvider();
		const finalFormat = new CellTextFormatAttributes();
		let format;

		if (cellInfo) {
			const cell = data.getRC(column, row);
			if (cell !== undefined) {
				format = cell.getTextFormat();
				if (format !== undefined) {
					finalFormat.accumulate(format);
				}
			}
		}

		format = this.getRows().getSectionTextFormat(row);
		if (format !== undefined) {
			finalFormat.accumulate(format);
		}

		format = this.getColumns().getSectionTextFormat(column);
		if (format !== undefined) {
			finalFormat.accumulate(format);
		}

		finalFormat.accumulate(this.getDefaultTextFormat());

		return finalFormat;
	}

	getTextFormatAt(pos, cellInfo = true) {
		return this.getTextFormatAtRC(pos.x, pos.y, cellInfo);
	}

	getCellAttributesAtRC(column, row, cellInfo = true) {
		const data = this.getDataProvider();
		const finalAttributes = new CellAttributes();
		let attributes;

		if (cellInfo) {
			const cell = data.getRC(column, row);
			if (cell !== undefined) {
				attributes = cell.getAttributes();
				if (attributes !== undefined) {
					finalAttributes.accumulate(attributes);
				}
			}
		}

		attributes = this.getRows().getSectionAttributes(row);
		if (attributes !== undefined) {
			finalAttributes.accumulate(attributes);
		}

		attributes = this.getColumns().getSectionAttributes(column);
		if (attributes !== undefined) {
			finalAttributes.accumulate(attributes);
		}

		finalAttributes.accumulate(this.getDefaultCellAttributes());

		return finalAttributes;
	}

	getCellAttributesAt(pos, cellInfo = true) {
		return this.getCellAttributesAtRC(pos.x, pos.y, cellInfo);
	}

	getCellPropertiesAtRC(cell, column, row) {
		const properties = {};
		let attributes;

		if (cell !== undefined) {
			attributes = cell.getAttributes();
			if (attributes !== undefined) {
				WorksheetNode.getDefinedProperties(attributes, properties)
			}
		}

		attributes = this.getRows().getSectionAttributes(row);
		if (attributes !== undefined) {
			WorksheetNode.getDefinedProperties(attributes, properties)
		}

		attributes = this.getColumns().getSectionAttributes(column);
		if (attributes !== undefined) {
			WorksheetNode.getDefinedProperties(attributes, properties)
		}

		WorksheetNode.getDefinedProperties(this.getDefaultCellAttributes(), properties)

		return properties;
	}

	getFormatPropertiesAtRC(cell, column, row) {
		const properties = {};
		let attributes;

		if (cell !== undefined) {
			attributes = cell.getFormat();
			if (attributes !== undefined) {
				WorksheetNode.getDefinedProperties(attributes, properties)
			}
		}

		attributes = this.getRows().getSectionFormat(row);
		if (attributes !== undefined) {
			WorksheetNode.getDefinedProperties(attributes, properties)
		}

		attributes = this.getColumns().getSectionFormat(column);
		if (attributes !== undefined) {
			WorksheetNode.getDefinedProperties(attributes, properties)
		}

		WorksheetNode.getDefinedProperties(this.getDefaultFormat(), properties);

		return properties;
	}

	static getDefinedProperties(attributeList, properties) {
		const addIt = (id, attr) => {
			const name = id.toLowerCase();
			if (properties[name] === undefined) {
				properties[name] = attr.getExpression().getValue();
			}
		};
		attributeList._value.iterate(addIt);
	}

	getTextFormatPropertiesAtRC(cell, column, row) {
		const properties = {};
		let attributes;

		if (cell !== undefined) {
			attributes = cell.getTextFormat();
			if (attributes !== undefined) {
				WorksheetNode.getDefinedProperties(attributes, properties)
			}
		}

		attributes = this.getRows().getSectionTextFormat(row);
		if (attributes !== undefined) {
			WorksheetNode.getDefinedProperties(attributes, properties)
		}

		attributes = this.getColumns().getSectionTextFormat(column);
		if (attributes !== undefined) {
			WorksheetNode.getDefinedProperties(attributes, properties)
		}

		WorksheetNode.getDefinedProperties(this.getDefaultTextFormat(), properties)

		return properties;
	}

	parseTextToTerm(text, ignoreExpections = true) {
		try {
			JSG.FormulaParser.context.separators = JSG.getParserLocaleSettings().separators;
			const term = JSG.FormulaParser.runIgnoringErrors(
				() => JSG.FormulaParser.parse(text.replace(/^=/, ''), this.getGraph(), this),
				ignoreExpections
			);
			JSG.FormulaParser.context.separators = Locale.EN.separators;
			return term;
		} catch (e) {
			return undefined;
		}
	}

	compress() {
		// remove unnecessary headersections
		let sections = this.getRows().getSectionData();
		sections.length = Math.min(this.getRowCount(), sections.length);
		sections = this.getColumns().getSectionData();
		sections.length = Math.min(this.getColumnCount(), sections.length);

		// enumerate cells
		const data = this.getDataProvider();
		let format;
		let cellFormat;

		const resetList = (cellList, parentList) => {
			// each attribute which is in parent too with same values, will be removed...

			cellList.iterate((attribute) => {
				const parentAttr = parentList.getAttribute(attribute.getName());
				if (attribute.isEqualTo(parentAttr)) {
					cellList.removeAttribute(attribute);
				}
			});

			return cellList.isEmpty();
		};

		data.enumerate((c, r, cell) => {
			// remove empty cell
			if (cell) {
				if (!cell.hasContent() && !cell.hasFormat()) {
					data.setRC(c, r, undefined);
				} else {
					// remove for unneccessary cell formats
					cellFormat = cell.getFormat();
					if (cellFormat) {
						format = this.getFormatAtRC(c, r, false);
						if (resetList(cellFormat, format)) {
							cell.setFormat(undefined);
						}
					}
					cellFormat = cell.getTextFormat();
					if (cellFormat) {
						format = this.getTextFormatAtRC(c, r, false);
						if (resetList(cellFormat, format)) {
							cell.setTextFormat(undefined);
						}
					}
					cellFormat = cell.getAttributes();
					if (cellFormat) {
						format = this.getCellAttributesAtRC(c, r, false);
						if (resetList(cellFormat, format)) {
							cell.setAttributes(undefined);
						}
					}
					if (!cell.hasContent() && !cell.hasFormat()) {
						data.setRC(c, r, undefined);
					}
				}
			}
			return true;
		});

		const rows = data._rows;
		let empty;
		let lastUsedRow = 0;
		let lastUsedColumn = 0;

		// shrink array
		rows.forEach((row, rowIndex) => {
			if (row) {
				empty = true;
				lastUsedColumn = 0;
				row.forEach((cell, colIndex) => {
					if (cell) {
						empty = false;
						lastUsedColumn = colIndex;
					}
				});
				row.length = lastUsedColumn + 1;
				if (empty) {
					rows[rowIndex] = undefined;
				} else {
					lastUsedRow = rowIndex;
				}
			}
		});

		// remove unnecessary rows
		rows.length = lastUsedRow + 1;
	}

	getFormattedValue(expr, value, textFormat, showFormulas) {
		let result = {
			value,
			formattedValue: value,
			color: undefined,
			type: 'general'
		};

		if (showFormulas) {
			if (expr.hasFormula()) {
				result.value = expr.toLocaleString(JSG.getParserLocaleSettings(), {
					item: this,
					useName: true
				});
			} else if (result.value === undefined) {
				result.value = '#NV';
			}
			result.formattedValue = result.value;
		} else if (Numbers.isNumber(result.value) && result.value !== undefined && textFormat !== undefined) {
			const numberFormat = textFormat.getNumberFormat();
			if (numberFormat !== undefined) {
				const fmt = numberFormat.getValue();
				const set = textFormat
					.getLocalCulture()
					.getValue()
					.toString();
				const type = set.split(';');
				try {
					result = NumberFormatter.formatNumber(fmt, result.value, type[0]);
				} catch (e) {
					result.formattedValue = defaultCellErrorValue;
				}
				result.value = value;
				[result.type] = type;
				if (result.formattedValue === '' && (result.type === 'date' || result.type === 'time')) {
					result.formattedValue = `#INVALID_${result.type.toUpperCase()}`;
					result.value = result.formattedValue;
				}
			}
		}

		if (typeof result.value === 'boolean') {
			result.formattedValue = result.value.toString().toUpperCase();
		}

		return result;
	}

	textToExpression(text) {
		const isFormula = text.charAt(0) === '=';
		let term;
		const graph = this.getGraph();
		let localCulture;
		let numberFormat;

		//
		// if (text.length === 0) {
		// 	return {
		// 		expression,,
		// 		localCulture,
		// 		numberFormat
		// 	};
		// }

		const cell = this.getOwnSelection().getActiveCell();
		if (cell !== undefined) {
			// DL-4076: text handling like in excel
			const asText = text.charAt(0) === "'";
			const type = this.getTextFormatAt(cell).getLocalCulture().getValue();
			if (type === 'text' || asText) {
				if (asText) text = text.substring(1);
				return {
					expression: ExpressionHelper.createExpressionFromValueTerm(Term.fromString(text))
				};
			}
		}

		if (isFormula) {
			text = text.substring(1);
		}
		// eslint-disable-next-line no-useless-catch
		try {
			JSG.FormulaParser.context.separators = JSG.getParserLocaleSettings().separators;
			if (isFormula) {
				term = JSG.FormulaParser.parse(text, graph, this);
			} else {
				const locale = JSG.getParserLocale();
				let date;
				dateFormats.some((format) => {
					date = parse(text, format, new Date(), { locale: locales[locale] });
					if (isValid(date)) {
						let xlDate = this.getDataProvider().JSDateToExcelDate(date);
						switch (format) {
							case 'dd.MM.yy':
								xlDate = Math.floor(xlDate);
								localCulture = `date;${locale}`;
								numberFormat = 'dd\\.mm\\.yy';
								break;
							case 'dd.MM.yy HH:mm':
								localCulture = `date;${locale}`;
								numberFormat = 'd\\.m\\.yy h:mm';
								break;
							case 'dd.MM.yyyy HH:mm':
								localCulture = `date;${locale}`;
								numberFormat = 'd\\.m\\.yyyy h:mm';
								break;
							case 'dd.MM.yyyy':
								xlDate = Math.floor(xlDate);
								localCulture = `date;${locale}`;
								numberFormat = 'dd\\.mm\\.yyyy';
								break;
							case 'dd. MMM yyyy HH:mm':
								localCulture = `date;${locale}`;
								numberFormat = 'd\\.m\\.yy h:mm';
								break;
							case 'dd. MMM yy':
							case 'dd. MMM yyyy':
								xlDate = Math.floor(xlDate);
								localCulture = `date;${locale}`;
								numberFormat = 'd\\. mmm yyyy';
								break;
							case 'dd. MMM':
								xlDate = Math.floor(xlDate);
								localCulture = `date;${locale}`;
								numberFormat = 'd\\. mmm';
								break;
							case 'MMM yy':
							case 'MMM yyyy':
								xlDate = Math.floor(xlDate);
								localCulture = `date;${locale}`;
								numberFormat = 'mmm yy';
								break;
							case 'HH:mm':
								xlDate -= Math.trunc(xlDate);
								localCulture = `time;${locale}`;
								numberFormat = 'h:mm';
								break;
							case 'HH:mm:ss':
								xlDate -= Math.trunc(xlDate);
								localCulture = `time;${locale}`;
								numberFormat = 'h:mm:ss';
								break;
							case 'HH:mm:ss.SSS':
								xlDate -= Math.trunc(xlDate);
								localCulture = `time;${locale}`;
								numberFormat = 'h:mm:ss.000';
								break;
							default:
								xlDate = Math.floor(xlDate);
								localCulture = `date;${locale}`;
								numberFormat = 'dd\\.mm\\.yy';
								break;
						}
						term = Term.fromNumber(xlDate);
						return true;
					}
					return false;
				});
				if (term === undefined) {
					term = JSG.FormulaParser.parseValue(text, graph, this);
				}
			}
			JSG.FormulaParser.context.separators = Locale.EN.separators;
		} catch (e) {
			throw e;
		}

		const formula = term ? term.toLocaleString('en', { item: this, useName: true }) : '';
		const expr = isFormula ? new Expression(0, formula) : ExpressionHelper.createExpressionFromValueTerm(term);

		if (term) {
			let unit;
			term.traverse((lterm) => {
				if (
					!(lterm.operand && lterm.operand.type === 'number') &&
					!(lterm.operator instanceof BinaryOperator)
				) {
					unit = unit === undefined && lterm.isUnit ? true : unit && lterm.isUnit;
				}
				return true;
			});
			if (unit) {
				localCulture = `percent`;
				if (Number.isInteger(term.value * 100)) {
					numberFormat = '0%';
				} else {
					numberFormat = '0.00%';
				}
			}
		}

		return {
			expression: expr,
			localCulture,
			numberFormat
		};
	}

	static get SelectionMode() {
		return SelectionMode;
	}

	static get SELECTION_CHANGED_NOTIFICATION() {
		return SELECTION_CHANGED_NOTIFICATION;
	}
};
