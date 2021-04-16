/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const Properties = require('./Properties');
const SheetIndex = require('./SheetIndex');

// eslint-disable-next-line no-unused-vars
const toArray = (map) => Array.from(map, ([_, value]) => value);

const isInColRange = (settings) => (nr) => nr != null && nr >= settings.mincol && nr <= settings.maxcol;
const isInRowRange = (settings) => (nr) => nr != null && nr >= settings.minrow && nr <= settings.maxrow;
const hasProperties = (obj) => (obj ? Object.keys(obj).length > 0 : false);

const ensureProps = (map) => nr => {
	map[nr] = map[nr] || new Properties();
	return map[nr];
};
const ensureCellProps = (map) => (colstr, rownr) => {
	map[rownr] = map[rownr] || {};
	return ensureProps(map[rownr])(colstr);
};

const iterateProps = (props, fn) => Object.entries(props).forEach(([key, properties]) => fn(key, properties));
const iterateColumnCells = (cells) => (colstr, fn) => {
	Object.entries(cells).forEach(([rownr, row]) => {
		const cellprops = row[colstr];
		if (cellprops) fn(cellprops, Number(rownr));
	});
};
const iterateRowCells = (cells) => (rownr, fn) => {
	const row = cells[rownr];
	if (row) Object.entries(row).forEach(([colstr, properties]) => fn(properties, colstr));
};
const reduceProps = (refFn) => (props) =>
	Object.entries(props).reduce((all, [key, properties]) => {
		if (!properties.isEmpty()) all.push({ ref: refFn(key), properties: properties.toJSON() });
		return all;
	}, []);
const reduceColProps = reduceProps((key) => ({ col: key }));
const reduceRowProps = reduceProps((key) => ({ row: Number(key) }));
const reduceCellProps = (props) =>
	Object.entries(props).reduce((all, [rownr, row]) => {
		rownr = Number(rownr);
		Object.entries(row).forEach(([colstr, properties]) => {
			if (!properties.isEmpty()) all.push({ ref: { col: colstr, row: rownr }, properties: properties.toJSON() });
		});
		return all;
	}, []);
const propertiesReducer = (provider) => (all, { ref }) => {
	const properties = provider(ref);
	if (properties) all.push({ ref, properties: properties.toJSON() });
	return all;
};

class PropertiesManager {
	static of(sheet, json) {
		const pm = new PropertiesManager(sheet);
		return pm.load(json);
	}
	constructor(sheet) {
		this.sheet = sheet;
		this._sheetProperties = new Properties();
		this._colProperties = {}; // [];
		this._rowProperties = {}; // [];
		this._cellProperties = {}; // [];
		// functions:
		this.isInColRange = isInColRange(sheet.settings);
		this.isInRowRange = isInRowRange(sheet.settings);
		this.ensureColProps = ensureProps(this._colProperties);
		this.ensureRowProps = ensureProps(this._rowProperties);
		this.ensureCellProps = ensureCellProps(this._cellProperties);
		this.iterateRowCellProps = iterateRowCells(this._cellProperties);
		this.iterateColumnCellProps = iterateColumnCells(this._cellProperties);
	}

	toJSON() {
		const properties = {};
		if (!this._sheetProperties.isEmpty()) properties.sheet = this._sheetProperties.toJSON();
		properties.cols = reduceColProps(this._colProperties);
		properties.rows = reduceRowProps(this._rowProperties);
		properties.cells = reduceCellProps(this._cellProperties);
		return properties;
	}
	load(json) {
		if (json) this.setProperties(json);
		return this;
	}

	getProperties({ cells, cols, rows } = {}) {
		const newProperties = {};
		if (rows) newProperties.rows = rows.reduce(propertiesReducer((ref) => this._rowProperties[ref.row]), []);
		if (cols) newProperties.cols = cols.reduce(propertiesReducer((ref) => this._colProperties[ref.col]), []);
		if (cells) {
			newProperties.cells = cells.reduce(
				propertiesReducer((ref) => this._cellProperties[ref.row] && this._cellProperties[ref.row][ref.col]),
				[]
			);
		}
		return newProperties;
	}

	clearCellProperties(colstr, rownr, { cells }) {
		const colnr = SheetIndex.columnAsNr(colstr);
		if (this.isInColRange(colnr) && this.isInRowRange(rownr)) {
			const row = this._cellProperties[rownr];
			if (row) {
				const cellprops = row[colstr];
				const cellChanges = cellprops && cellprops.clear();
				if (cellChanges) {
					cells.set(`${colstr}${rownr}`, { ref: { col: colstr, row: rownr }, properties: cellChanges });
				}
			}
		}
	}
	clearColumnProperties(colstr, { cells, cols }) {
		const colnr = SheetIndex.columnAsNr(colstr);
		if (this.isInColRange(colnr)) {
			const colprops = this._colProperties[colstr];
			const colChanges = colprops && colprops.clear();
			if (colChanges) cols.set(colstr, { ref: { col: colstr }, properties: colChanges });
			// existing cell properties in column:
			this.iterateColumnCellProps(colstr, (cellprops, rownr) => {
				const cellChanges = cellprops.clear();
				if (cellChanges) {
					cells.set(`${colstr}${rownr}`, { ref: { col: colstr, row: rownr }, properties: cellChanges });
				}
			});
		}
	}
	clearRowProperties(rownr, { cells, rows }) {
		if (this.isInRowRange(rownr)) {
			const rowprops = this._rowProperties[rownr];
			const rowChanges = rowprops && rowprops.clear();
			if (rowChanges) rows.set(rownr, { ref: { row: rownr }, properties: rowChanges });
			// existing cell properties in row:
			this.iterateRowCellProps(rownr, (cellprops, colstr) => {
				const cellChanges = cellprops.clear();
				if (cellChanges) {
					cells.set(`${colstr}${rownr}`, { ref: { col: colstr, row: rownr }, properties: cellChanges });
				}
			});
		}
	}
	clearProperties({ cells, cols, rows /* , sheet */ }) {
		const changes = { cells: new Map(), cols: new Map(), rows: new Map() };
		if (cols) cols.forEach((col) => this.clearColumnProperties(col.ref.col, changes));
		if (rows) rows.forEach((row) => this.clearRowProperties(row.ref.row, changes));
		if (cells) cells.forEach((cell) => this.clearCellProperties(cell.ref.col, cell.ref.row, changes));
		return { rows: toArray(changes.rows), cols: toArray(changes.cols), cells: toArray(changes.cells) };
	}

	setCellProperties(colstr, rownr, properties, { cells }) {
		const colnr = SheetIndex.columnAsNr(colstr);
		if (this.isInColRange(colnr) && this.isInRowRange(rownr)) {
			const cellprops = this.ensureCellProps(colstr, rownr);
			const changedProps = cellprops.merge(properties);
			if (hasProperties(changedProps)) {
				cells.set(`${colstr}${rownr}`, { ref: { col: colstr, row: rownr }, properties: changedProps });
			}
		}
	}
	setColumnProperties(colstr, properties, { cells, cols }) {
		const colnr = SheetIndex.columnAsNr(colstr);
		if (this.isInColRange(colnr)) {
			const changedColProps = this.ensureColProps(colstr).merge(properties);
			if (hasProperties(changedColProps)) cols.set(colstr, { ref: { col: colstr }, properties: changedColProps });
			// intersection with existing rows:
			iterateProps(this._rowProperties, (rownr) => this.ensureCellProps(colstr, rownr));
			// existing cell properties in column:
			this.iterateColumnCellProps(colstr, (cellprops, rownr) => {
				const changedProps = cellprops.merge(properties, this._rowProperties[rownr]);
				if (hasProperties(changedProps)) {
					cells.set(`${colstr}${rownr}`, { ref: { col: colstr, row: rownr }, properties: changedProps });
				}
			});
		}
	}
	setRowProperties(rownr, properties, { cells, rows }) {
		if (this.isInRowRange(rownr)) {
			const changedRowProps = this.ensureRowProps(rownr).merge(properties);
			if (hasProperties(changedRowProps)) rows.set(rownr, { ref: { row: rownr }, properties: changedRowProps });
			// intersection with existing columns:
			iterateProps(this._colProperties, (colstr) => this.ensureCellProps(colstr, rownr));
			// existing cell properties in row:
			this.iterateRowCellProps(rownr, (cellprops, colstr) => {
				const changedProps = cellprops.merge(properties, this._colProperties[colstr]);
				if (hasProperties(changedProps)) {
					cells.set(`${colstr}${rownr}`, { ref: { col: colstr, row: rownr }, properties: changedProps });
				}
			});
		}
	}

	// if multiple properties are provided, it will be applied cols -> rows -> cells
	setProperties({ cells, cols, rows, properties /* , sheet */ }) {
		const changes = { cells: new Map(), cols: new Map(), rows: new Map() };
		if (cols) {
			cols.forEach((col) => {
				const props = col.properties || properties;
				if (props.cleared) this.clearColumnProperties(col.ref.col, changes);
				else this.setColumnProperties(col.ref.col, props, changes);
			});
		}
		if (rows) {
			rows.forEach((row) => {
				const props = row.properties || properties;
				if (props.cleared) this.clearRowProperties(row.ref.row, changes);
				else this.setRowProperties(row.ref.row, props, changes);
			});
		}
		if (cells) {
			cells.forEach((cell) => {
				const { row, col } = cell.ref;
				const props = cell.properties || properties;
				if (props.cleared) this.clearCellProperties(col, row, changes);
				else this.setCellProperties(col, row, props, changes);
			});
		}
		return { rows: toArray(changes.rows), cols: toArray(changes.cols), cells: toArray(changes.cells) };
	}
}

module.exports = PropertiesManager;
