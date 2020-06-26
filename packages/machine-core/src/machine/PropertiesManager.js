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
const Properties = require('./Properties');
const ImmutableProperties = require('./ImmutableProperties');
const CellProperties = require('./CellProperties');
const SheetIndex = require('./SheetIndex');
const { isEmptyObject } = require('../utils');
const DEF_PROPERTIES = require('../../defproperties.json');

const isInRowRange = (settings) => (nr) => nr >= settings.minrow && nr <= settings.maxrow;
const isInColRange = (settings) => (nr) => nr >= settings.mincol && nr <= settings.maxcol;
const isInRange = (isInRowRangeFn, isInColRangeFn) => (rownr, colnr) => isInRowRangeFn(rownr) && isInColRangeFn(colnr);

const getProps = (map) => (nr, defval) => map[nr] || defval;
const getCellProps = (map) => (rownr, colnr, defval) => map[rownr] && map[rownr][colnr] || defval;

const ensureProps = (map, defprops) => nr => {
	map[nr] = map[nr] || Properties.of(defprops);
	return map[nr];
};
const ensureCellProps = (map, defprops) => (rownr, colnr, baseprops) => {
	let row = map[rownr];
	if (!row) {
		row = {}; // [];
		map[rownr] = row;
	}
	let cellprops = row[colnr];
	if (!cellprops) {
		cellprops = CellProperties.of(defprops);
		if (baseprops) cellprops.base.merge(baseprops);
		row[colnr] = cellprops;
	}
	return cellprops;
};
const iterateCellsOfCol = (cells, settings) => (colnr, fn) => {
	const max = settings.maxrow;
	for (let r = settings.minrow; r <= max; r += 1) {
		const cell = cells[r] && cells[r][colnr];
		fn(cell, r);
	}
};
const iterateCellsOfRow = (cells, settings) => (rownr, fn) => {
	const row = cells[rownr] || {}; // [];
	const max = settings.maxcol;
	for (let c = settings.mincol; c <= max; c += 1) {
		fn(row[c], c);
	}
};

// const iterateProperties = (arr) => (fn) => arr.forEach((props, nr) => props && fn(props, nr));
const iterateProperties = (map) => (fn) => Object.entries(map).forEach(([nr, props]) => props && fn(props, nr));
const setBaseTextFormat = (cellprops, key, value, props) =>
	cellprops.base.setTextFormat(key, value || props.getTextFormat(key));
const setBaseStyleFormat = (cellprops, key, value, props) =>
	cellprops.base.setStyleFormat(key, value || props.getStyleFormat(key));

const getAttribute = (props, key) => props ? props.getAttribute(key) : undefined;
const getTextFormat = (props, key) => props ? props.getTextFormat(key) : undefined;
const getStyleFormat = (props, key) => props ? props.getStyleFormat(key) : undefined;

const isNotEmpty = (props) => props && !props.isEmpty();

const mapColProps = (props) =>
	Object.entries(props).reduce((all, [nr, prop]) => {
		if (isNotEmpty(prop)) all[SheetIndex.columnAsStr(nr)] = prop.toJSON();
		return all;
	}, {});
const mapRowProps = (props) =>
	Object.entries(props).reduce((all, [nr, prop]) => {
		if (isNotEmpty(prop)) all[nr] = prop.toJSON();
		return all;
	}, {});
const mapCellProps = (props) =>
	Object.entries(props).reduce((all, [rownr, row]) => {
		Object.entries(row).forEach(([colnr, prop]) => {
			if (isNotEmpty(prop)) all[`${SheetIndex.columnAsStr(colnr)}${rownr}`] = prop.toJSON();
		});
		return all;
	}, {});


const updateObject = (props, index, count) => {
	if (props) {
		const mapper = [];
		Object.entries(props).forEach(([nr, prop]) => {
			nr = Number(nr);
			if (nr >= index) {
				props[nr] = undefined;
				mapper[nr + count] = prop;
			}
		});
		mapper.forEach((prop, idx) => {
			if (prop) props[idx] = prop;
		});
	}
};

const DEF_SHEET_PROPS = ImmutableProperties.of({
	attributes: DEF_PROPERTIES.attributes.sheet,
	formats: { styles: DEF_PROPERTIES.formats.styles, text: DEF_PROPERTIES.formats.text }
});
const DEF_PROPS = {
	of(sheetprops) {
		const cellprops = CellProperties.of({
			attributes: DEF_PROPERTIES.attributes.cell,
			formats: { styles: sheetprops.formats.styles, text: sheetprops.formats.text }
		});
		this.COL = ImmutableProperties.of(sheetprops);
		this.ROW = ImmutableProperties.of(sheetprops);
		this.CELL = ImmutableProperties.of(cellprops);
		this.CELL.base = ImmutableProperties.of(cellprops.base);
	}
};

class PropertiesManager {
	static of(sheet, json) {
		const pm = new PropertiesManager(sheet);
		return pm.load(json);
	}
	constructor(sheet) {
		this.sheet = sheet;
		this.sheetProperties = Properties.of(DEF_SHEET_PROPS);
		this._colProperties = {}; // [];
		this._rowProperties = {}; // [];
		this._cellProperties = {}; // [];
		DEF_PROPS.of(this.sheetProperties);
		this.isInColRange = isInColRange(sheet.settings);
		this.isInRowRange = isInRowRange(sheet.settings);
		this.isInRange = isInRange(this.isInRowRange, this.isInColRange);
		this.getRowProps = getProps(this._rowProperties);
		this.getColProps = getProps(this._colProperties);
		this.getCellProps = getCellProps(this._cellProperties);
		this.ensureRowProps = ensureProps(this._rowProperties, DEF_PROPS.ROW);
		this.ensureColProps = ensureProps(this._colProperties, DEF_PROPS.COL);
		this.ensureCellProps = ensureCellProps(this._cellProperties, DEF_PROPS.CELL);
		this.colsForEach = iterateProperties(this._colProperties);
		this.rowsForEach = iterateProperties(this._rowProperties);
		this.iterateCellPropsOfCol = iterateCellsOfCol(this._cellProperties, sheet.settings);
		this.iterateCellPropsOfRow = iterateCellsOfRow(this._cellProperties, sheet.settings);
	}

	toJSON() {
		const properties = {};
		properties.sheet = !this.sheetProperties.isEmpty() ? this.sheetProperties.toJSON() : {};
		properties.cols = mapColProps(this._colProperties);
		properties.rows = mapRowProps(this._rowProperties);
		properties.cells = mapCellProps(this._cellProperties);
		return properties;
	}

	load(json) {
		if (json) {
			const { sheet, cols, rows, cells } = json;
			if (sheet) this.sheetProperties.initWithJSON(json.sheet);
			DEF_PROPS.of(this.sheetProperties);
			this.ensureRowProps = ensureProps(this._rowProperties, DEF_PROPS.ROW);
			this.ensureColProps = ensureProps(this._colProperties, DEF_PROPS.COL);
			this.ensureCellProps = ensureCellProps(this._cellProperties, DEF_PROPS.CELL);

			if (cols) {
				Object.entries(cols).forEach(([ref, props]) =>
					this.ensureColProps(SheetIndex.columnAsNr(ref)).initWithJSON(props)
				);
			} 				
			if (rows) Object.entries(rows).forEach(([nr, props]) => this.ensureRowProps(nr).initWithJSON(props));
			if (cells) {
				Object.entries(cells).forEach(([ref, props]) => {
					const index = SheetIndex.create(ref);
					this.ensureCellProps(index.row, index.col).initWithJSON(props);
				});
			}
		}
		return this;
	}

	clearCellProperties(rownr, colnr) {
		const doIt = this.isInRange(rownr, colnr);
		if (doIt && this._cellProperties[rownr]) this._cellProperties[rownr][colnr] = undefined;
		return doIt;
	}
	clearColumnProperties(colnr) {
		const doIt = this.isInColRange(colnr);
		if (doIt) this._colProperties[colnr] = undefined;
		return doIt;
	}
	clearRowProperties(rownr) {
		const doIt = this.isInRowRange(rownr);
		if (doIt) this._rowProperties[rownr] = undefined;
		return doIt;
	}

	getSheetProperties() {
		return this.sheetProperties;
	}
	getSheetAttribute(key) {
		return getAttribute(this.sheetProperties, key);
	}
	getSheetStyleFormat(key) {
		return getStyleFormat(this.sheetProperties, key);
	}
	getSheetTextFormat(key) {
		return getTextFormat(this.sheetProperties, key);
	}

	getCellProperties(rownr, colnr) {
		let cellprops;
		if (this.isInRange(rownr, colnr)) {
			cellprops = this.getCellProps(rownr, colnr);
			if (!cellprops) {
				const baseprops = this.getRowProps(rownr) || this.getColProps(colnr);
				cellprops = baseprops ? this.ensureCellProps(rownr, colnr, baseprops) : DEF_PROPS.CELL;
			}
		}
		return cellprops;
	}
	getCellAttribute(rownr, colnr, key) {
		return getAttribute(this.getCellProperties(rownr, colnr), key);
	}
	getCellStyleFormat(rownr, colnr, key) {
		return getStyleFormat(this.getCellProperties(rownr, colnr), key);
	}
	getCellTextFormat(rownr, colnr, key) {
		return getTextFormat(this.getCellProperties(rownr, colnr), key);
	}

	getColumnProperties(colnr) {
		return this.isInColRange(colnr) ? this.getColProps(colnr, DEF_PROPS.COL) : undefined;
	}
	getColumnAttribute(colnr, key) {
		return getAttribute(this.getColumnProperties(colnr), key);
	}
	getColumnStyleFormat(colnr, key) {
		return getStyleFormat(this.getColumnProperties(colnr), key);
	}
	getColumnTextFormat(colnr, key) {
		return getTextFormat(this.getColumnProperties(colnr), key);
	}

	getRowProperties(rownr) {
		return this.isInRowRange(rownr) ? this.getRowProps(rownr, DEF_PROPS.ROW) : undefined;
	}
	getRowAttribute(rownr, key) {
		return getAttribute(this.getRowProperties(rownr), key);
	}
	getRowStyleFormat(rownr, key) {
		return getStyleFormat(this.getRowProperties(rownr), key);
	}
	getRowTextFormat(rownr, key) {
		return getTextFormat(this.getRowProperties(rownr), key);
	}


	// TODO: support sheet properties...
	mergeAll({ cells, cols, rows, properties }) {
		const changes = { cells: [], cols: [], rows: [] };
		if (cols) {
			cols.forEach((col) => {
				const reference = SheetIndex.columnAsNr(col.reference);
				const colProperties = properties || col.properties;
				if (reference != null) this.mergeColumnProperties(reference, colProperties, changes);
			});
		}
		if (rows) {
			rows.forEach((row) => {
				const rowProperties = properties || row.properties;
				if (row.reference != null)  this.mergeRowProperties(row.reference, rowProperties, changes);
			});
		}
		if (cells) {
			cells.forEach((cell) => {
				const cellProperties = properties || cell.properties;
				const mergeCellPropertiesAt = (index) => {
					this.mergeCellProperties(index.row, index.col, cellProperties, changes);
				};
				const cellIndex = cell.reference && SheetIndex.create(cell.reference);
				if (cellIndex) mergeCellPropertiesAt(cellIndex);
			});
		}
		return changes;
	}


	_ensureCellProps(rownr, colnr) {
		const baseprops = this.getRowProps(rownr) || this.getColProps(colnr);
		return this.ensureCellProps(rownr, colnr, baseprops);
	}
	mergeCellProperties(rownr, colnr, props, collectedChanges = { cells: [], cols: [], rows: [] }) {
		if (this.isInRange(rownr, colnr)) {
			const changedProps = this._ensureCellProps(rownr, colnr).merge(props);
			if (!isEmptyObject(changedProps)) {
				const cell = { reference: `${SheetIndex.columnAsStr(colnr)}${rownr}`, properties: changedProps };
				collectedChanges.cells.push(cell);
			}
		}
		return collectedChanges;
	}
	setCellProperties(rownr, colnr, props) {
		if (this.clearCellProperties(rownr, colnr)) this._ensureCellProps(rownr, colnr).merge(props);
	}
	setCellAttribute(rownr, colnr, key, value) {
		if (this.isInRange(rownr, colnr)) this._ensureCellProps(rownr, colnr).setAttribute(key, value);
	}
	setCellStyleFormat(rownr, colnr, key, value) {
		if (this.isInRange(rownr, colnr)) this._ensureCellProps(rownr, colnr).setStyleFormat(key, value);
	}
	setCellTextFormat(rownr, colnr, key, value) {
		if (this.isInRange(rownr, colnr)) this._ensureCellProps(rownr, colnr).setTextFormat(key, value);
	}


	mergeColumnProperties(colnr, props, collectedChanges = { cells: [], cols: [], rows: [] }) {
		if (this.isInColRange(colnr)) {
			const cells = {};
			const changedColProps = { reference: SheetIndex.columnAsStr(colnr) };
			changedColProps.properties = this.ensureColProps(colnr).merge(props);
			if (!isEmptyObject(changedColProps)) collectedChanges.cols.push(changedColProps);
			this.iterateCellPropsOfCol(colnr, (cellprops, rownr) => {
				if (cellprops) {
					const changedProps = cellprops.merge(props);
					if (!isEmptyObject(changedProps)) {
						const cell = { reference: `${SheetIndex.columnAsStr(colnr)}${rownr}`, properties: changedProps };
						cells[cell.reference] = cell;
					}
				}
			});
			this.rowsForEach((rowprops, nr) => {
				const changedProps = this.ensureCellProps(nr, colnr, rowprops).base.merge(props);
				if (!isEmptyObject(changedProps)) {
					const cell = { reference: `${SheetIndex.columnAsStr(colnr)}${nr}`, properties: changedProps };
					if (!cells[cell.reference]) cells[cell.reference] = cell;
				}
			});
			Object.values(cells).forEach((cell) => collectedChanges.cells.push(cell));
		}
		return collectedChanges;
	}
	setColumnProperties(colnr, props) {
		if (this.clearColumnProperties(colnr)) this.ensureColProps(colnr).merge(props);
	}
	setColumnAttribute(colnr, key, value) {
		if (this.isInColRange(colnr)) {
			this.ensureColProps(colnr).setAttribute(key, value);
			// TODO review: do row & col have attributes in common with cells?
			// this.iterateCellPropsOfCol(colnr, (cellprops) => {
			// 	if (cellprops) cellprops.setAttribute(key, value);
			// });
		}
	}
	setColumnStyleFormat(colnr, key, value) {
		if (this.isInColRange(colnr)) {
			this.ensureColProps(colnr).setStyleFormat(key, value);
			this.rowsForEach((props, nr) =>
				setBaseStyleFormat(this.ensureCellProps(nr, colnr, props), key, value, props)
			);
			this.iterateCellPropsOfCol(colnr, (cellprops) => {
				if (cellprops) cellprops.setStyleFormat(key, value);
			});
		}
	}
	setColumnTextFormat(colnr, key, value) {
		if (this.isInColRange(colnr)) {
			this.ensureColProps(colnr).setTextFormat(key, value);
			this.rowsForEach((props, nr) =>
				setBaseTextFormat(this.ensureCellProps(nr, colnr, props), key, value, props)
			);
			this.iterateCellPropsOfCol(colnr, (cellprops) => {
				if (cellprops) cellprops.setTextFormat(key, value);
			});
		}
	}

	mergeRowProperties(rownr, props, collectedChanges = { cells: [], cols: [], rows: [] }) {
		if (this.isInRowRange(rownr)) {
			const changedRowProps = { reference: rownr };
			const cells = {};
			changedRowProps.properties = this.ensureRowProps(rownr).merge(props);
			if (!isEmptyObject(changedRowProps)) collectedChanges.rows.push(changedRowProps);
			this.iterateCellPropsOfRow(rownr, (cellprops, colnr) => {
				if (cellprops) {
					const changedProps = cellprops.merge(props);
					if (!isEmptyObject(changedProps)) {
						const cell = { reference: `${SheetIndex.columnAsStr(colnr)}${rownr}`, properties: changedProps };
						cells[cell.reference] = cell;
					}
				}
			});
			this.colsForEach((colprops, nr) => {
				const changedProps = this.ensureCellProps(rownr, nr, colprops).base.merge(props);
				if (!isEmptyObject(changedProps)) {
					const cell = { reference: `${SheetIndex.columnAsStr(nr)}${rownr}`, properties: changedProps };
					if (!cells[cell.reference]) cells[cell.reference] = cell
				}
			});
			Object.values(cells).forEach((cell) => collectedChanges.cells.push(cell));
		}
		return collectedChanges;
	}
	setRowProperties(rownr, props) {
		if (this.clearRowProperties(rownr)) this.ensureRowProps(rownr).merge(props);
	}
	setRowAttribute(rownr, key, value) {
		if (this.isInRowRange(rownr)) {
			this.ensureRowProps(rownr).setAttribute(key, value);
			// TODO review: do row & col have attributes in common with cells?
			// this.iterateCellPropsOfRow(rownr, (cellprops) => {
			// 	if (cellprops) cellprops.setAttribute(key, value);
			// });
		}
	}
	setRowStyleFormat(rownr, key, value) {
		if (this.isInRowRange(rownr)) {
			this.ensureRowProps(rownr).setStyleFormat(key, value);
			this.colsForEach((props, nr) =>
				setBaseStyleFormat(this.ensureCellProps(rownr, nr, props), key, value, props)
			);
			this.iterateCellPropsOfRow(rownr, (cellprops) => {
				if (cellprops) cellprops.setStyleFormat(key, value);
			});
		}
	}
	setRowTextFormat(rownr, key, value) {
		if (this.isInRowRange(rownr)) {
			this.ensureRowProps(rownr).setTextFormat(key, value);
			this.colsForEach((props, nr) =>
				setBaseTextFormat(this.ensureCellProps(rownr, nr, props), key, value, props)
			);
			this.iterateCellPropsOfRow(rownr, (cellprops) => {
				if (cellprops) cellprops.setTextFormat(key, value);
			});
		}
	}

	setSheetAttribute(key, value) {
		this.sheetProperties.setAttribute(key, value);
	}
	setSheetStyleFormat(key, value) {
		this.sheetProperties.setStyleFormat(key, value);
	}
	setSheetTextFormat(key, value) {
		this.sheetProperties.setTextFormat(key, value);
	}

	onUpdateColumnsAt(colnr, count) {
		updateObject(this._colProperties, colnr, count);
		Object.values(this._cellProperties).forEach((props) => updateObject(props, colnr, count));
	}
	onUpdateRowsAt(rownr, count) {
		// move props at rownr to new index:
		updateObject(this._rowProperties, rownr, count);
		updateObject(this._cellProperties, rownr, count);
	}
}

module.exports = PropertiesManager;
