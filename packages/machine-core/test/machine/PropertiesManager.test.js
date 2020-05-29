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
const PropertiesManager = require('../../src/machine/PropertiesManager');
const { StreamSheet } = require('../..');
const DEF_PROPS = require('../../defproperties.json');

const getOldProperties = (props) =>
	Object.entries(props).reduce((all, [key, value]) => {
		all[key] = value.old;
		return all;
	}, {});
const mapToOldProperties = (change) => {
	const { reference, properties } = change;
	const props = { reference, properties };
	if (properties.attributes) props.properties.attributes = getOldProperties(properties.attributes);
	if (properties.formats) {
		props.formats = {};
		if (properties.formats.styles) props.properties.formats.styles = getOldProperties(properties.formats.styles);
		if (properties.formats.text) props.properties.formats.text = getOldProperties(properties.formats.text);
	}
	return props;
};
const undoPropsFromChanges = (changes) => {
	const undoprops = {}
	if (changes.cols) undoprops.cols = changes.cols.map(mapToOldProperties);
	if (changes.rows) undoprops.rows = changes.rows.map(mapToOldProperties);
	if (changes.cells) undoprops.cells = changes.cells.map(mapToOldProperties);
	return undoprops;
};


describe('PropertiesManager', () => {
	it('should be possible to create a PropertiesManger instance', () => {
		const t1 = new StreamSheet();
		expect(PropertiesManager.of(t1.sheet)).toBeDefined();
	});
	it('should return default properties for rows & columns if none has been set', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		const rowprops = pm.getRowProperties(3);
		expect(rowprops).toBeDefined();
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);

		const colprops = pm.getColumnProperties(0);
		expect(colprops).toBeDefined();
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
	});
	it('should return default properties for negative columns if none has been set', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let colprops = pm.getColumnProperties(-1);
		expect(colprops).toBeDefined();
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		colprops = pm.getColumnProperties(-2);
		expect(colprops).toBeDefined();
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
	});
	it('should return default properties for cells if none has been set', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let cellprops = pm.getCellProperties(1, 0);
		expect(cellprops).toBeDefined();
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		expect(cellprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		cellprops = pm.getCellProperties(1, -1);
		expect(cellprops).toBeDefined();
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		expect(cellprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		cellprops = pm.getCellProperties(1, -2);
		expect(cellprops).toBeDefined();
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		expect(cellprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
	});
	it('should return true for isEmpty on default properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		expect(pm.getSheetProperties().isEmpty()).toBe(true);
		expect(pm.getColumnProperties(4).isEmpty()).toBe(true);
		expect(pm.getRowProperties(2).isEmpty()).toBe(true);
		expect(pm.getCellProperties(1, 0).isEmpty()).toBe(true);
	});
	it('should not be possible to change returned default properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		const sheetprops = pm.getSheetProperties();
		// we have only a single sheet props, so its ok to change this one
		sheetprops.setStyleFormat('linecolor', 'green');
		expect(sheetprops.getStyleFormat('linecolor')).toBe('green');
		expect(pm.getSheetProperties().isEmpty()).toBe(false);
		let colprops = pm.getColumnProperties(4);
		expect(() => { colprops.setStyleFormat('fillcolor', 'yellow') }).toThrow(TypeError);
		expect(colprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(colprops.isEmpty()).toBe(true);
		// but we can via PropertiesManager:
		pm.setColumnStyleFormat(4, 'fillcolor', 'yellow');
		colprops = pm.getColumnProperties(4);
		expect(colprops.getStyleFormat('fillcolor')).toBe('yellow');
		expect(colprops.isEmpty()).toBe(false);
		// analog for rows:
		let rowprops = pm.getRowProperties(4);
		expect(() => { rowprops.setStyleFormat('fillcolor', 'magenta') }).toThrow(TypeError);
		expect(rowprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(rowprops.isEmpty()).toBe(true);
		pm.setRowStyleFormat(4, 'fillcolor', 'magenta');
		rowprops = pm.getRowProperties(4);
		expect(rowprops.getStyleFormat('fillcolor')).toBe('magenta');
		expect(rowprops.isEmpty()).toBe(false);
		// ... and cells
		let cellprops = pm.getCellProperties(8, 8);
		expect(() => { cellprops.setStyleFormat('fillcolor', 'cyan') }).toThrow(TypeError);
		expect(cellprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(cellprops.isEmpty()).toBe(true);
		pm.setCellStyleFormat(8, 8, 'fillcolor', 'cyan');
		cellprops = pm.getCellProperties(8, 8);
		expect(cellprops.getStyleFormat('fillcolor')).toBe('cyan');
		expect(cellprops.isEmpty()).toBe(false);
	});
	it('should be possible to change properties in rows and columns', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		// change some row properties:
		pm.setRowAttribute(1, 'initialsection', 42);
		pm.setRowTextFormat(1, 'fontcolor', 'red');
		pm.setRowStyleFormat(1, 'fillcolor', 'blue');
		let rowprops = pm.getRowProperties(1);
		expect(rowprops.getAttribute('initialsection')).toBe(42);
		expect(rowprops.getTextFormat('fontcolor')).toBe('red');
		expect(rowprops.getStyleFormat('fillcolor')).toBe('blue');
		// remove them should return default again:
		pm.setRowAttribute(1, 'initialsection', undefined);
		pm.setRowTextFormat(1, 'fontcolor', undefined);
		pm.setRowStyleFormat(1, 'fillcolor', undefined);
		rowprops = pm.getRowProperties(1);
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontcolor')).toBe(DEF_PROPS.formats.text.fontcolor);
		expect(rowprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		// same for column
		pm.setColumnAttribute(1, 'initialsection', 42);
		pm.setColumnTextFormat(1, 'fontcolor', 'red');
		pm.setColumnStyleFormat(1, 'fillcolor', 'blue');
		let colprops = pm.getColumnProperties(1);
		expect(colprops.getAttribute('initialsection')).toBe(42);
		expect(colprops.getTextFormat('fontcolor')).toBe('red');
		expect(colprops.getStyleFormat('fillcolor')).toBe('blue');
		// remove them should return default again:
		pm.setColumnAttribute(1, 'initialsection', undefined);
		pm.setColumnTextFormat(1, 'fontcolor', undefined);
		pm.setColumnStyleFormat(1, 'fillcolor', undefined);
		colprops = pm.getColumnProperties(1);
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontcolor')).toBe(DEF_PROPS.formats.text.fontcolor);
		expect(colprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		// and for neg. column
		pm.setColumnAttribute(-1, 'initialsection', 42);
		pm.setColumnTextFormat(-1, 'fontcolor', 'red');
		pm.setColumnStyleFormat(-1, 'fillcolor', 'blue');
		colprops = pm.getColumnProperties(-1);
		expect(colprops.getAttribute('initialsection')).toBe(42);
		expect(colprops.getTextFormat('fontcolor')).toBe('red');
		expect(colprops.getStyleFormat('fillcolor')).toBe('blue');
		// remove them should return default again:
		pm.setColumnAttribute(-1, 'initialsection', undefined);
		pm.setColumnTextFormat(-1, 'fontcolor', undefined);
		pm.setColumnStyleFormat(-1, 'fillcolor', undefined);
		colprops = pm.getColumnProperties(-1);
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontcolor')).toBe(DEF_PROPS.formats.text.fontcolor);
		expect(colprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	});
	it('should reflect changes in row or column properties in corresponding cell properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		// change col properties:
		pm.setColumnAttribute(2, 'initialsection', 42);
		pm.setColumnTextFormat(2, 'fontcolor', 'red');
		pm.setColumnStyleFormat(2, 'fillcolor', 'blue');
		pm.setColumnAttribute(-1, 'initialsection', 23);
		pm.setColumnTextFormat(-1, 'fontcolor', 'yellow');
		pm.setColumnStyleFormat(-1, 'fillcolor', 'gray');
		// check arbitrary cell in this row:
		let cellprops = pm.getCellProperties(1, 2);
		expect(cellprops.getAttribute('initialsection')).toBeUndefined();
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getTextFormat('fontcolor')).toBe('red');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('blue');
		cellprops = pm.getCellProperties(1, -1);
		expect(cellprops.getAttribute('initialsection')).toBeUndefined();
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getTextFormat('fontcolor')).toBe('yellow');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('gray');
		// change row properties:
		pm.setRowAttribute(3, 'initialsection', 42);
		pm.setRowTextFormat(3, 'fontcolor', 'yellow');
		pm.setRowStyleFormat(3, 'linecolor', 'black');
		// check arbitrary cell in this row:
		cellprops = pm.getCellProperties(1, 2);
		expect(cellprops.getAttribute('initialsection')).toBeUndefined();
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getTextFormat('fontcolor')).toBe('red');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('blue');
		cellprops = pm.getCellProperties(3, 1);
		expect(cellprops.getAttribute('initialsection')).toBeUndefined();
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getTextFormat('fontcolor')).toBe('yellow');
		expect(cellprops.getStyleFormat('linecolor')).toBe('black');
		expect(cellprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		cellprops = pm.getCellProperties(3, -1);
		expect(cellprops.getAttribute('initialsection')).toBeUndefined();
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getTextFormat('fontcolor')).toBe('yellow');
		expect(cellprops.getStyleFormat('linecolor')).toBe('black');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('gray');
		// this one must be a mix of row & column
		cellprops = pm.getCellProperties(3, 2);
		expect(cellprops.getAttribute('initialsection')).toBeUndefined();
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getTextFormat('fontcolor')).toBe('yellow');
		expect(cellprops.getStyleFormat('linecolor')).toBe('black');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('blue');
	});
	it('should be possible to change cell properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		pm.setCellAttribute(3, 34, 'visible', false);
		pm.setCellTextFormat(3, 34, 'fontname', 'tahoma');
		pm.setCellStyleFormat(3, 34, 'fillcolor', 'yellow');
		const cellprops = pm.getCellProperties(3, 34);
		expect(cellprops.getAttribute('visible')).toBe(false);
		expect(cellprops.getTextFormat('fontname')).toBe('tahoma');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('yellow');
		pm.setCellAttribute(3, 34, 'visible', undefined);
		pm.setCellTextFormat(3, 34, 'fontname', undefined);
		pm.setCellStyleFormat(3, 34, 'fillcolor', undefined);
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getTextFormat('fontname')).toBe(DEF_PROPS.formats.text.fontname);
		expect(cellprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	});
	it('should not overwrite row and/or column properties by changing cell properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		pm.setRowStyleFormat(3, 'linecolor', 'cyan');
		pm.setCellTextFormat(3, 34, 'fontname', 'arial');
		pm.setCellStyleFormat(3, 34, 'fillcolor', 'yellow');
		const cellprops = pm.getCellProperties(3, 34);
		expect(pm.getRowStyleFormat(3, 'linecolor')).toBe('cyan');
		expect(cellprops.getTextFormat('fontname')).toBe('arial');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('yellow');
		expect(cellprops.getStyleFormat('linecolor')).toBe('cyan');
		pm.setCellStyleFormat(3, 34, 'fillcolor', undefined);
		expect(cellprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		pm.setRowTextFormat(3, 'fontname', 'tahoma');
		pm.setColumnTextFormat(34, 'fontname', 'times');
		expect(cellprops.getTextFormat('fontname')).toBe('times');
		pm.setCellTextFormat(3, 34, 'fontname', undefined);
		expect(cellprops.getTextFormat('fontname')).toBe('times');
		pm.setRowTextFormat(3, 'fontname', undefined);
		expect(cellprops.getTextFormat('fontname')).toBe('times');
		pm.setColumnTextFormat(34, 'fontname', undefined);
		expect(cellprops.getTextFormat('fontname')).toBe(DEF_PROPS.formats.text.fontname);
	});
});
describe('PropertiesManager behaviour', () => {
	it('should create cell properties at intersections of changed rows and columns properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		// change properties:
		pm.setRowStyleFormat(3, 'fillcolor', 'yellow');
		pm.setColumnStyleFormat(3, 'fillcolor', 'green');
		const cellprops = pm.getCellProperties(3, 3);
		expect(cellprops.getStyleFormat('fillcolor')).toBe('green');
		// change row prop again:
		pm.setRowStyleFormat(3, 'fillcolor', 'yellow');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('yellow');
		pm.setRowStyleFormat(3, 'fillcolor', undefined);
		expect(cellprops.getStyleFormat('fillcolor')).toBe('green');
		pm.setColumnStyleFormat(3, 'fillcolor', undefined);
		expect(cellprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		pm.setRowStyleFormat(3, 'fillcolor', 'yellow');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('yellow');
	});
	it('should change cell property if its corresponding column property is changed', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		// pm.setColumnAttribute(8, 'visible', 'false');
		pm.setColumnTextFormat(8, 'fontcolor', 'cyan');
		pm.setColumnStyleFormat(8, 'fillcolor', 'yellow');
		// create cell property
		// pm.setCellAttribute(8, 8, 'visible', 'true');
		pm.setCellTextFormat(8, 8, 'fontcolor', 'blue');
		pm.setCellStyleFormat(8, 8, 'fillcolor', 'red');
		// check
		// expect(pm.getColumnAttribute(8, 'visible')).toBe('false');
		expect(pm.getColumnTextFormat(8, 'fontcolor')).toBe('cyan');
		expect(pm.getColumnStyleFormat(8, 'fillcolor')).toBe('yellow');
		// expect(pm.getCellAttribute(8, 8, 'visible')).toBe('true');
		expect(pm.getCellTextFormat(8, 8, 'fontcolor')).toBe('blue');
		expect(pm.getCellStyleFormat(8, 8, 'fillcolor')).toBe('red');
		// set col property again => should change cell's too
		// pm.setColumnAttribute(8, 'visible', 'false');
		pm.setColumnTextFormat(8, 'fontcolor', 'green');
		pm.setColumnStyleFormat(8, 'fillcolor', 'blue');
		// expect(pm.getColumnAttribute(8, 'visible')).toBe('false');
		expect(pm.getColumnTextFormat(8, 'fontcolor')).toBe('green');
		expect(pm.getColumnStyleFormat(8, 'fillcolor')).toBe('blue');
		// expect(pm.getCellAttribute(8, 8, 'visible')).toBe('false');
		expect(pm.getCellTextFormat(8, 8, 'fontcolor')).toBe('green');
		expect(pm.getCellStyleFormat(8, 8, 'fillcolor')).toBe('blue');
	});
	it('should change cell property if its corresponding row property is changed', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		// pm.setRowAttribute(8, 'visible', 'false');
		pm.setRowTextFormat(8, 'fontcolor', 'cyan');
		pm.setRowStyleFormat(8, 'fillcolor', 'yellow');
		// create cell property
		// pm.setCellAttribute(8, 8, 'visible', 'true');
		pm.setCellTextFormat(8, 8, 'fontcolor', 'blue');
		pm.setCellStyleFormat(8, 8, 'fillcolor', 'red');
		// check
		// expect(pm.getRowAttribute(8, 'visible')).toBe('false');
		expect(pm.getRowTextFormat(8, 'fontcolor')).toBe('cyan');
		expect(pm.getRowStyleFormat(8, 'fillcolor')).toBe('yellow');
		// expect(pm.getCellAttribute(8, 8, 'visible')).toBe('true');
		expect(pm.getCellTextFormat(8, 8, 'fontcolor')).toBe('blue');
		expect(pm.getCellStyleFormat(8, 8, 'fillcolor')).toBe('red');
		// set col property again => should change cell's too
		// pm.setRowAttribute(8, 'visible', 'false');
		pm.setRowTextFormat(8, 'fontcolor', 'green');
		pm.setRowStyleFormat(8, 'fillcolor', 'blue');
		// expect(pm.getRowAttribute(8, 'visible')).toBe('false');
		expect(pm.getRowTextFormat(8, 'fontcolor')).toBe('green');
		expect(pm.getRowStyleFormat(8, 'fillcolor')).toBe('blue');
		// expect(pm.getCellAttribute(8, 8, 'visible')).toBe('false');
		expect(pm.getCellTextFormat(8, 8, 'fontcolor')).toBe('green');
		expect(pm.getCellStyleFormat(8, 8, 'fillcolor')).toBe('blue');
	});
	it('should change cell property at intersection of row & column if corresponding row or column is changed', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		// pm.setRowAttribute(8, 'visible', 'false');
		pm.setRowTextFormat(8, 'fontcolor', 'cyan');
		pm.setRowStyleFormat(8, 'fillcolor', 'yellow');
		// pm.setColumnAttribute(4, 'visible', 'true');
		pm.setColumnTextFormat(4, 'fontcolor', 'blue');
		pm.setColumnStyleFormat(4, 'fillcolor', 'red');
		// check
		// expect(pm.getRowAttribute(8, 'visible')).toBe('false');
		expect(pm.getRowTextFormat(8, 'fontcolor')).toBe('cyan');
		expect(pm.getRowStyleFormat(8, 'fillcolor')).toBe('yellow');
		// expect(pm.getColumnAttribute(4, 'visible')).toBe('true');
		expect(pm.getColumnTextFormat(4, 'fontcolor')).toBe('blue');
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('red');
		// expect(pm.getCellAttribute(8, 4, 'visible')).toBe('true');
		expect(pm.getCellTextFormat(8, 4, 'fontcolor')).toBe('blue');
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('red');
		// apply row again:
		pm.setRowTextFormat(8, 'fontcolor', 'cyan');
		pm.setRowStyleFormat(8, 'fillcolor', 'yellow');
		expect(pm.getCellTextFormat(8, 4, 'fontcolor')).toBe('cyan');
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('yellow');
		// apply column again
		pm.setColumnTextFormat(4, 'fontcolor', 'blue');
		pm.setColumnStyleFormat(4, 'fillcolor', 'red');
		expect(pm.getCellTextFormat(8, 4, 'fontcolor')).toBe('blue');
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('red');
	});
});
describe('PropertiesManager merge', () => {
	it('should merge column properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		pm.mergeColumnProperties(8, {
			attributes: { initialsection: 23 },
			formats: { text: { fontcolor: 'cyan' }, styles: { fillcolor: 'yellow' } }
		});
		expect(pm.getColumnAttribute(8, 'initialsection')).toBe(23);
		expect(pm.getColumnTextFormat(8, 'fontcolor')).toBe('cyan');
		expect(pm.getColumnStyleFormat(8, 'fillcolor')).toBe('yellow');
	});
	it('should merge row properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		pm.mergeRowProperties(8, {
			attributes: { initialsection: 23 },
			formats: { text: { fontcolor: 'cyan' }, styles: { fillcolor: 'yellow' } }
		});
		expect(pm.getRowAttribute(8, 'initialsection')).toBe(23);
		expect(pm.getRowTextFormat(8, 'fontcolor')).toBe('cyan');
		expect(pm.getRowStyleFormat(8, 'fillcolor')).toBe('yellow');
	});
	it('should merge cell properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		pm.mergeCellProperties(8, 4, {
			attributes: { visible: false },
			formats: { text: { fontcolor: 'cyan' }, styles: { fillcolor: 'yellow' } }
		});
		expect(pm.getCellAttribute(8, 4, 'visible')).toBe(false);
		expect(pm.getCellTextFormat(8, 4, 'fontcolor')).toBe('cyan');
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('yellow');
	});
	it('should create cell properties at intersections of merged rows and columns properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		pm.mergeRowProperties(8, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(pm.getRowStyleFormat(8, 'fillcolor')).toBe('yellow');
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('yellow');
		pm.mergeColumnProperties(4, { formats: { styles: { fillcolor: 'red' } } });
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('red');
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('red');
		pm.mergeCellProperties(8, 4, { formats: { styles: { fillcolor: 'blue' } } });
		expect(pm.getRowStyleFormat(8, 'fillcolor')).toBe('yellow');
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('red');
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('blue');
		pm.mergeCellProperties(8, 4, { formats: { styles: { fillcolor: null } } });
		expect(pm.getRowStyleFormat(8, 'fillcolor')).toBe('yellow');
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('red');
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('red');
		// vice versa
		pm.mergeColumnProperties(6, { formats: { styles: { fillcolor: 'red' } } });
		expect(pm.getColumnStyleFormat(6, 'fillcolor')).toBe('red');
		expect(pm.getCellStyleFormat(4, 6, 'fillcolor')).toBe('red');
		pm.mergeRowProperties(4, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(pm.getRowStyleFormat(4, 'fillcolor')).toBe('yellow');
		expect(pm.getCellStyleFormat(4, 6, 'fillcolor')).toBe('yellow');
		pm.mergeCellProperties(4, 6, { formats: { styles: { fillcolor: 'blue' } } });
		expect(pm.getRowStyleFormat(4, 'fillcolor')).toBe('yellow');
		expect(pm.getColumnStyleFormat(6, 'fillcolor')).toBe('red');
		expect(pm.getCellStyleFormat(4, 6, 'fillcolor')).toBe('blue');
		pm.mergeCellProperties(4, 6, { formats: { styles: { fillcolor: null } } });
		expect(pm.getRowStyleFormat(4, 'fillcolor')).toBe('yellow');
		expect(pm.getColumnStyleFormat(6, 'fillcolor')).toBe('red');
		expect(pm.getCellStyleFormat(4, 6, 'fillcolor')).toBe('yellow');
	});
	it('cell should reflect last merge of row or column', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		pm.mergeRowProperties(8, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('yellow');
		pm.mergeColumnProperties(4, { formats: { styles: { fillcolor: 'red' } } });
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('red');
		pm.mergeRowProperties(8, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('yellow');
		pm.mergeColumnProperties(4, { formats: { styles: { fillcolor: 'red' } } });
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('red');
		pm.mergeRowProperties(8, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('yellow');
		pm.mergeColumnProperties(4, { formats: { styles: { fillcolor: 'red' } } });
		expect(pm.getCellStyleFormat(8, 4, 'fillcolor')).toBe('red');
	});
	it('should return info about changed column properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let changes = pm.mergeColumnProperties(2, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(changes).toBeDefined();
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([]);
		expect(changes.cols).toEqual([{
				// better use a string since its more general?
			reference: 'C',
			properties: {
				formats: {
					styles: { fillcolor: { new: 'yellow', old: DEF_PROPS.formats.styles.fillcolor } }
				}
			}
		}]);
		changes = pm.mergeColumnProperties(2, {
			attributes: { initialsection: 42 },
			formats: { text: { fontcolor: 'blue' } }
		});
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([]);
		expect(changes.cols).toEqual([{
				// better use a string since its more general?
			reference: 'C',
			properties: {
				attributes: { initialsection: { new: 42, old: DEF_PROPS.attributes.sheet.initialsection } },
				formats: {
					text: { fontcolor: { new: 'blue', old: DEF_PROPS.formats.text.fontcolor } }
				}
			}
		}]);
	});
	it('should return info about changed row properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let changes = pm.mergeRowProperties(4, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(changes).toBeDefined();
		expect(changes.cols).toEqual([]);
		expect(changes.cells).toEqual([]);
		expect(changes.rows).toEqual([{
			reference: 4,
			properties: {
				formats: {
					styles: { fillcolor: { new: 'yellow', old: DEF_PROPS.formats.styles.fillcolor } }
				}
			}
		}]);
		changes = pm.mergeRowProperties(4, {
			attributes: { initialsection: 42 },
			formats: { text: { fontcolor: 'blue' } }
		});
		expect(changes.cols).toEqual([]);
		expect(changes.cells).toEqual([]);
		expect(changes.rows).toEqual([{
			reference: 4,
			properties: {
				attributes: { initialsection: { new: 42, old: DEF_PROPS.attributes.sheet.initialsection } },
				formats: {
					text: { fontcolor: { new: 'blue', old: DEF_PROPS.formats.text.fontcolor } }
				}
			}
		}]);
	});
	it('should return info about changed cell properties', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let changes = pm.mergeCellProperties(1, 0, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(changes).toBeDefined();
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([{
			reference: 'A1',
			properties: {
				formats: {
					styles: { fillcolor: { new: 'yellow', old: DEF_PROPS.formats.styles.fillcolor } }
				}
			}
		}]);
		changes = pm.mergeCellProperties(1, 0, {
			attributes: { level: 42 },
			formats: { text: { fontcolor: 'blue' } }
		});
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([{
			reference: 'A1',
			properties: {
				attributes: { level: { new: 42, old: DEF_PROPS.attributes.cell.level } },
				formats: {
					text: { fontcolor: { new: 'blue', old: DEF_PROPS.formats.text.fontcolor } }
				}
			}
		}]);
	});
	it('should return info about changes when changing column, row, cell and then undoing it ', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let changes = pm.mergeColumnProperties(4, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([]);
		expect(changes.cols).toEqual([{
			reference: 'E',
			properties: {
				formats: {
					styles: { fillcolor: { new: 'yellow', old: DEF_PROPS.formats.styles.fillcolor } }
				}
			}
		}]);
		// now changing row props should result in changed cell too!!
		changes = pm.mergeRowProperties(2, {
			attributes: { initialsection: 42 },
			formats: { styles: { fillcolor: 'red'} , text: { fontcolor: 'blue' } }
		});
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([{
			reference: 2,
			properties: {
				attributes: { initialsection: { new: 42, old: DEF_PROPS.attributes.sheet.initialsection } },
				formats: {
					styles: { fillcolor: { new: 'red', old: DEF_PROPS.formats.styles.fillcolor } },
					text: { fontcolor: { new: 'blue', old: DEF_PROPS.formats.text.fontcolor } }
				}
			}
		}]);
		expect(changes.cells).toEqual([{
			reference: 'E2',
			properties: {
				formats: {
					text: { fontcolor: { new: 'blue', old: DEF_PROPS.formats.text.fontcolor } },
					styles: { fillcolor: { new: 'red', old: 'yellow' } }
				}
			}
		}]);
		// now change cell fillcolor
		changes = pm.mergeCellProperties(2, 4, { formats: { styles: { fillcolor: 'gray'} } });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([{
			reference: 'E2',
			properties: { formats: {styles: { fillcolor: { new: 'gray', old: 'red' } } } }
		}]);
		// undo cell fillcolor
		changes = pm.mergeCellProperties(2, 4, { formats: { styles: { fillcolor: null} } });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([{
			reference: 'E2',
			properties: { formats: {styles: { fillcolor: { new: 'red', old: 'gray' } } } }
		}]);
		// undo row fillcolor:
		changes = pm.mergeRowProperties(2, { formats: { styles: { fillcolor: null } } });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([{
			reference: 2,
			properties: {
				formats: { styles: { fillcolor: { new: DEF_PROPS.formats.styles.fillcolor, old: 'red' } } }
			}
		}]);
		expect(changes.cells).toEqual([{
			reference: 'E2',
			properties: {
				formats: { styles: { fillcolor: { new: 'red', old: 'red' } } }
			}
		}]);
	});
	it('should return info about changes when changing row, column, cell and then undoing it ', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let changes = pm.mergeRowProperties(4, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(changes.cols).toEqual([]);
		expect(changes.cells).toEqual([]);
		expect(changes.rows).toEqual([{
			reference: 4,
			properties: {
				formats: {
					styles: { fillcolor: { new: 'yellow', old: DEF_PROPS.formats.styles.fillcolor } }
				}
			}
		}]);
		// COLUMN
		changes = pm.mergeColumnProperties(2, {
			attributes: { initialsection: 42 },
			formats: { styles: { fillcolor: 'red'} , text: { fontcolor: 'blue' } }
		});
		expect(changes.rows).toEqual([]);
		expect(changes.cols).toEqual([{
			reference: 'C',
			properties: {
				attributes: { initialsection: { new: 42, old: DEF_PROPS.attributes.sheet.initialsection } },
				formats: {
					styles: { fillcolor: { new: 'red', old: DEF_PROPS.formats.styles.fillcolor } },
					text: { fontcolor: { new: 'blue', old: DEF_PROPS.formats.text.fontcolor } }
				}
			}
		}]);
		expect(changes.cells).toEqual([{
			reference: 'C4',
			properties: {
				formats: {
					text: { fontcolor: { new: 'blue', old: DEF_PROPS.formats.text.fontcolor } },
					styles: { fillcolor: { new: 'red', old: 'yellow' } }
				}
			}
		}]);
		// CELL
		changes = pm.mergeCellProperties(4, 2, { formats: { styles: { fillcolor: 'gray'} } });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([{
			reference: 'C4',
			properties: { formats: {styles: { fillcolor: { new: 'gray', old: 'red' } } } }
		}]);
		// UNDO
		changes = pm.mergeCellProperties(4, 2, { formats: { styles: { fillcolor: null} } });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([{
			reference: 'C4',
			properties: { formats: {styles: { fillcolor: { new: 'red', old: 'gray' } } } }
		}]);
		changes = pm.mergeColumnProperties(2, { formats: { styles: { fillcolor: null } } });
		expect(changes.rows).toEqual([]);
		expect(changes.cols).toEqual([{
			reference: 'C',
			properties: {
				formats: { styles: { fillcolor: { new: DEF_PROPS.formats.styles.fillcolor, old: 'red' } } }
			}
		}]);
		expect(changes.cells).toEqual([{
			reference: 'C4',
			properties: {
				formats: { styles: { fillcolor: { new: 'red', old: 'red' } } }
			}
		}]);
	});
	it('should return info about changes when changing column, cell on column, cells row and then undoing it ', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let changes = pm.mergeColumnProperties(4, { formats: { styles: { fillcolor: 'blue' } } });
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([]);
		expect(changes.cols).toEqual([{
			reference: 'E',
			properties: {
				formats: {
					styles: { fillcolor: { new: 'blue', old: DEF_PROPS.formats.styles.fillcolor } }
				}
			}
		}]);
		// CELL
		changes = pm.mergeCellProperties(2, 4, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([{
			reference: 'E2',
			properties: { formats: {styles: { fillcolor: { new: 'yellow', old: 'blue' } } } }
		}]);
		// ROW
		changes = pm.mergeRowProperties(2, { formats: { styles: { fillcolor: 'green' } } });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([{
			reference: 2,
			properties: { formats: {styles: { fillcolor: { new: 'green', old: DEF_PROPS.formats.styles.fillcolor } } } }
		}]);
		expect(changes.cells).toEqual([{
			reference: 'E2',
			properties: { formats: {styles: { fillcolor: { new: 'green', old: 'yellow' } } } }
		}]);
		// UNDO ROW
		changes = pm.mergeRowProperties(2, { formats: { styles: { fillcolor: DEF_PROPS.formats.styles.fillcolor } } });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([{
			reference: 2,
			properties: { formats: {styles: { fillcolor: { new: DEF_PROPS.formats.styles.fillcolor, old: 'green' } } } }
		}]);
		expect(changes.cells).toEqual([{
			reference: 'E2',
			properties: { formats: {styles: { fillcolor: { new: DEF_PROPS.formats.styles.fillcolor, old: 'green' } } } }
		}]);
		changes = pm.mergeCellProperties(2, 4, { formats: { styles: { fillcolor: 'yellow' } } });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([{
			reference: 'E2',
			properties: { formats: {styles: { fillcolor: { new: 'yellow', old: DEF_PROPS.formats.styles.fillcolor } } } }
		}]);
		// UNDO CELL
		changes = pm.mergeCellProperties(2, 4, { formats: { styles: { fillcolor: 'blue' } } });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([{
			reference: 'E2',
			properties: { formats: {styles: { fillcolor: { new: 'blue', old: 'yellow' } } } }
		}]);
		// UNDO COLUMN
		changes = pm.mergeColumnProperties(4, { formats: { styles: { fillcolor: DEF_PROPS.formats.styles.fillcolor } } });
		expect(changes.rows).toEqual([]);
		expect(changes.cols).toEqual([{
			reference: 'E',
			properties: { formats: { styles: { fillcolor: { new: DEF_PROPS.formats.styles.fillcolor, old: 'blue' } } } }
		}]);
		expect(changes.cells).toEqual([{
			reference: 'E2',
			properties: { formats: { styles: { fillcolor: { new: DEF_PROPS.formats.styles.fillcolor, old: 'blue' } } } }
		}]);
	});
});
describe('PropertiesManager mergeAll', () => {
	it('should change properties of cells, columns and rows as specified', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		pm.mergeAll({
			cols: [{
				reference: 'A',
				properties: { formats: { styles: { fillcolor: 'blue' } } }
			}]
		});
		expect(pm.getColumnStyleFormat(0, 'fillcolor')).toBe('blue');
		pm.mergeAll({
			rows: [{
				reference: 1,
				properties: { formats: { styles: { fillcolor: 'yellow' } } }
			}]
		});
		expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe('yellow');
		expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('yellow');
		pm.mergeAll({
			cells: [{
				reference: 'B2',
				properties: { formats: { styles: { fillcolor: 'orange' } } }
			}]
		});
		expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe('orange');
		pm.mergeAll({
			cols: [{ reference: 'E' }],
			rows: [{ reference: 6 }],
			cells: [{ reference: 'C3'}],
			properties: { formats: { styles: { fillcolor: 'green' } } }
		});
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('green');
		expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe('green');
		expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe('green');
		expect(pm.getCellStyleFormat(6, 0, 'fillcolor')).toBe('green');
		expect(pm.getCellStyleFormat(6, 4, 'fillcolor')).toBe('green');
	});
	it('should return no changes if no properties are specified', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let changes = pm.mergeAll({	});
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([]);
		changes = pm.mergeAll({ cols: [], rows: [], cells: [] });
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([]);
	});
	it('should not return empty changes', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		const changes = pm.mergeAll({
			cols: [{ reference: 'E' }],
			rows: [{ reference: 6 }],
			properties: { formats: { styles: { fillcolor: 'orange' } } }
		});
		// no cell created at intersection!!
		expect(changes.cells).toEqual([]);
		expect(changes.cols).toEqual([{
			reference: 'E',
			properties: { formats: { styles: { fillcolor: { new: 'orange', old: DEF_PROPS.formats.styles.fillcolor } } } }
		}]);
		expect(changes.rows).toEqual([{
			reference: 6,
			properties: { formats: { styles: { fillcolor: { new: 'orange', old: DEF_PROPS.formats.styles.fillcolor } } } }
		}]);
	});
	it('should return applied changes', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let changes = pm.mergeAll({
			cols: [{
				reference: 'A',
				properties: { formats: { styles: { fillcolor: 'blue' } } }
			}]
		});
		expect(changes.cols).toEqual([{
			reference: 'A',
			properties: { formats: { styles: { fillcolor: { new: 'blue', old: DEF_PROPS.formats.styles.fillcolor } } } }
		}]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([]);
		changes = pm.mergeAll({
			rows: [{
				reference: 1,
				properties: { formats: { styles: { fillcolor: 'yellow' } } }
			}]
		});
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([{
			reference: 1,
			properties: { formats: { styles: { fillcolor: { new: 'yellow', old: DEF_PROPS.formats.styles.fillcolor } } } }
		}]);
		expect(changes.cells).toEqual([{
			reference: 'A1',
			properties: { formats: { styles: { fillcolor: { new: 'yellow', old: 'blue' } } } }
		}]);
		changes = pm.mergeAll({
			cells: [{
				reference: 'B2',
				properties: { formats: { styles: { fillcolor: 'orange' } } }
			}]
		});
		expect(changes.cols).toEqual([]);
		expect(changes.rows).toEqual([]);
		expect(changes.cells).toEqual([{
			reference: 'B2',
			properties: { formats: { styles: { fillcolor: { new: 'orange', old: DEF_PROPS.formats.styles.fillcolor } } } }
		}]);
		changes = pm.mergeAll({
			cols: [{ reference: 'E' }],
			rows: [{ reference: 6 }],
			cells: [{ reference: 'C3'}],
			properties: { formats: { styles: { fillcolor: 'green' } } }
		});
		expect(changes.cols).toEqual([{
			reference: 'E',
			properties: { formats: { styles: { fillcolor: { new: 'green', old: DEF_PROPS.formats.styles.fillcolor } } } }
		}]);
		expect(changes.rows).toEqual([{
			reference: 6,
			properties: { formats: { styles: { fillcolor: { new: 'green', old: DEF_PROPS.formats.styles.fillcolor } } } }
		}]);
		expect(changes.cells.length).toBe(3);
		expect(changes.cells).toEqual([
			{
				reference: 'E1',
				properties: {
					formats: { styles: { fillcolor: { new: 'green', old:'yellow' } } }
				}
			},
			{
				reference: 'A6',
				properties: {
					formats: { styles: { fillcolor: { new: 'green', old: 'blue' } } }
				}
			},
			{
				reference: 'C3',
				properties: {
					formats: { styles: { fillcolor: { new: 'green', old: DEF_PROPS.formats.styles.fillcolor } } }
				}
			}
		]);
	});
	it('should be possible to undo changes by using returned changes-object', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let changes = pm.mergeAll({
			cols: [{
				reference: 'A',
				properties: { formats: { styles: { fillcolor: 'blue' } } }
			}]
		});
		pm.mergeAll(undoPropsFromChanges(changes));

		expect(pm.getColumnStyleFormat(0, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		changes = pm.mergeAll({
			rows: [{
				reference: 1,
				properties: { formats: { styles: { fillcolor: 'yellow' } } }
			}]
		});
		pm.mergeAll(undoPropsFromChanges(changes));
		expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);

		changes = pm.mergeAll({
			cells: [{
				reference: 'B2',
				properties: { formats: { styles: { fillcolor: 'orange' } } }
			}]
		});
		pm.mergeAll(undoPropsFromChanges(changes));
		expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);

		changes = pm.mergeAll({
			cols: [{ reference: 'E' }],
			rows: [{ reference: 6 }],
			cells: [{ reference: 'C3'}],
			properties: { formats: { styles: { fillcolor: 'green' } } }
		});
		pm.mergeAll(undoPropsFromChanges(changes));
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(1, 4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(6, 0, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	});
	it('should be possible to collect undo info and apply them one after another ', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		const undostack =  [];
		undostack.push(pm.mergeAll({
			cols: [{
				reference: 'A',
				properties: { formats: { styles: { fillcolor: 'blue' } } }
			}]
		}));
		undostack.push(pm.mergeAll({
			rows: [{
				reference: 1,
				properties: { formats: { styles: { fillcolor: 'yellow' } } }
			}],
			cells: [{
				reference: 'B2',
				properties: { formats: { styles: { fillcolor: 'orange' } } }
			}]
		}));
		undostack.push(pm.mergeAll({
			cols: [{ reference: 'E' }],
			rows: [{ reference: 6 }],
			cells: [{ reference: 'C3'}],
			properties: { formats: { styles: { fillcolor: 'green' } } }
		}));
		// check state before undo:
		expect(pm.getColumnStyleFormat(0, 'fillcolor')).toBe('blue');
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('green');
		expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe('yellow');
		expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe('green');
		expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('yellow');
		expect(pm.getCellStyleFormat(1, 4, 'fillcolor')).toBe('green');
		expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe('orange');
		expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe('green');
		expect(pm.getCellStyleFormat(6, 0, 'fillcolor')).toBe('green');
		expect(pm.getCellStyleFormat(6, 4, 'fillcolor')).toBe('green');
		// UNDO
		pm.mergeAll(undoPropsFromChanges(undostack.pop()));
		expect(pm.getColumnStyleFormat(0, 'fillcolor')).toBe('blue');
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe('yellow');
		expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('yellow');
		expect(pm.getCellStyleFormat(1, 4, 'fillcolor')).toBe('yellow');
		expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe('orange');
		expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(6, 0, 'fillcolor')).toBe('blue');
		expect(pm.getCellStyleFormat(6, 4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		// UNDO
		pm.mergeAll(undoPropsFromChanges(undostack.pop()));
		expect(pm.getColumnStyleFormat(0, 'fillcolor')).toBe('blue');
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('blue');
		expect(pm.getCellStyleFormat(1, 4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(6, 0, 'fillcolor')).toBe('blue');
		expect(pm.getCellStyleFormat(6, 4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		// UNDO
		pm.mergeAll(undoPropsFromChanges(undostack.pop()));
		expect(pm.getColumnStyleFormat(0, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(1, 4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(6, 0, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(pm.getCellStyleFormat(6, 4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(undostack.length).toBe(0);
	});
	// it('should support multiple references', () => {
	// 	const t1 = new StreamSheet();
	// 	const pm = PropertiesManager.of(t1.sheet);
	// 	const undostack =  [];
	// 	undostack.push(
	// 		pm.mergeAll({
	// 			cols: [{ ranges: ['A:A', 'C:E'] }],
	// 			properties: { formats: { styles: { fillcolor: 'blue' } } }
	// 		})
	// 	);
	// 	undostack.push(
	// 		pm.mergeAll({
	// 			rows: [{ ranges: ['1:1', '3:5'] }],
	// 			cells: [{ ranges: ['B2:C4', 'D5:D5'] }],
	// 			properties: { formats: { styles: { fillcolor: 'yellow' } } }
	// 		})
	// 	);
	// 	undostack.push(pm.mergeAll({
	// 		cols: [{ ranges: ['G:G'] }],
	// 		rows: [{ reference: 6 }],
	// 		cells: [{ ranges: ['H3:H3']}],
	// 		properties: { formats: { styles: { fillcolor: 'green' } } }
	// 	}));
	// 	// check state before undo:
	// 	expect(pm.getColumnStyleFormat(0, 'fillcolor')).toBe('blue');
	// 	expect(pm.getColumnStyleFormat(2, 'fillcolor')).toBe('blue');
	// 	expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('blue');
	// 	expect(pm.getColumnStyleFormat(6, 'fillcolor')).toBe('green');
	// 	expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getRowStyleFormat(3, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getRowStyleFormat(5, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe('green');
	// 	expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(4, 3, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(3, 7, 'fillcolor')).toBe('green');
	// 	// intersection cells:
	// 	expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(1, 2, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(1, 4, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(1, 6, 'fillcolor')).toBe('green');
	// 	expect(pm.getCellStyleFormat(3, 0, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(3, 4, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(3, 6, 'fillcolor')).toBe('green');
	// 	expect(pm.getCellStyleFormat(5, 0, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(5, 2, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(5, 4, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(5, 6, 'fillcolor')).toBe('green');
	// 	// UNDO
	// 	pm.mergeAll(undoPropsFromChanges(undostack.pop()));
	// 	expect(pm.getColumnStyleFormat(0, 'fillcolor')).toBe('blue');
	// 	expect(pm.getColumnStyleFormat(2, 'fillcolor')).toBe('blue');
	// 	expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('blue');
	// 	expect(pm.getColumnStyleFormat(6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getRowStyleFormat(3, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getRowStyleFormat(5, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(4, 3, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(3, 7, 'fillcolor')).toBe('yellow');
	// 	// intersection cells:
	// 	expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(1, 2, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(1, 4, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(1, 6, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(3, 0, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(3, 4, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(3, 6, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(5, 0, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(5, 2, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(5, 4, 'fillcolor')).toBe('yellow');
	// 	expect(pm.getCellStyleFormat(5, 6, 'fillcolor')).toBe('yellow');
	// 	// UNDO
	// 	pm.mergeAll(undoPropsFromChanges(undostack.pop()));
	// 	expect(pm.getColumnStyleFormat(0, 'fillcolor')).toBe('blue');
	// 	expect(pm.getColumnStyleFormat(2, 'fillcolor')).toBe('blue');
	// 	expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('blue');
	// 	expect(pm.getColumnStyleFormat(6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getRowStyleFormat(3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getRowStyleFormat(5, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(4, 3, 'fillcolor')).toBe('blue');
	// 	expect(pm.getCellStyleFormat(3, 7, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	// intersection cells:
	// 	expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('blue');
	// 	expect(pm.getCellStyleFormat(1, 2, 'fillcolor')).toBe('blue');
	// 	expect(pm.getCellStyleFormat(1, 4, 'fillcolor')).toBe('blue');
	// 	expect(pm.getCellStyleFormat(1, 6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(3, 0, 'fillcolor')).toBe('blue');
	// 	expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe('blue');
	// 	expect(pm.getCellStyleFormat(3, 4, 'fillcolor')).toBe('blue');
	// 	expect(pm.getCellStyleFormat(3, 6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(5, 0, 'fillcolor')).toBe('blue');
	// 	expect(pm.getCellStyleFormat(5, 2, 'fillcolor')).toBe('blue');
	// 	expect(pm.getCellStyleFormat(5, 4, 'fillcolor')).toBe('blue');
	// 	expect(pm.getCellStyleFormat(5, 6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	// UNDO
	// 	pm.mergeAll(undoPropsFromChanges(undostack.pop()));
	// 	expect(pm.getColumnStyleFormat(0, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getColumnStyleFormat(2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getColumnStyleFormat(6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getRowStyleFormat(3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getRowStyleFormat(5, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(4, 3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(3, 7, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	// intersection cells:
	// 	expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(1, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(1, 4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(1, 6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(3, 0, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(3, 4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(3, 6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(5, 0, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(5, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(5, 4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// 	expect(pm.getCellStyleFormat(5, 6, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
	// });
});
describe('PropertiesManager IO', () => {
	it('should be possible to save properties to json', () => {
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet);
		let jsonprops = pm.toJSON();
		expect(jsonprops).toBeDefined();
		// no props set, so:
		expect(jsonprops.sheet).toEqual({});
		expect(jsonprops.cols).toEqual({});
		expect(jsonprops.rows).toEqual({});
		expect(jsonprops.cells).toEqual({});
		// now set some props
		pm.setSheetAttribute('initialsection', 3);
		pm.setSheetTextFormat('fontcolor', 'red');
		pm.setSheetStyleFormat('fillcolor', 'white');
		pm.setColumnAttribute(2, 'initialsection', 2);
		pm.setColumnTextFormat(3, 'fontcolor', 'magenta');
		pm.setColumnStyleFormat(4, 'fillcolor', 'green');
		pm.setRowAttribute(5, 'initialsection', 123);
		pm.setRowTextFormat(6, 'fontcolor', 'blue');
		pm.setRowStyleFormat(7, 'fillcolor', 'yellow');
		pm.setCellAttribute(1, 0, 'visible', false);
		pm.setCellTextFormat(5, 2, 'fontcolor', 'gray');
		pm.setCellStyleFormat(8, 6, 'fillcolor', 'yellow');
		jsonprops = pm.toJSON();
		expect(jsonprops.sheet).toEqual({
			attributes: { initialsection: 3 },
			formats: { styles: { fillcolor: 'white' }, text: { fontcolor: 'red' } }
		});
		expect(jsonprops.cols).toEqual({
			'C': { attributes: { initialsection: 2 } },
			'D': { formats: { text: { fontcolor: 'magenta' } } },
			'E': { formats: { styles: { fillcolor: 'green' } } }
		});
		expect(jsonprops.rows).toEqual({
			'5': { attributes: { initialsection: 123 } },
			'6': { formats: { text: { fontcolor: 'blue' } } },
			'7': { formats: { styles: { fillcolor: 'yellow' } } }
		});
		// note: on intersection points of row & col there must be a properties definition for cell!!
		// intersections:
		// 		5,2; 5,3; 5,4
		// 		6,2; 6,3; 6,4
		// 		7,2; 7,3; 7,4
		expect(jsonprops.cells).toEqual({
			'A1': { attributes: { visible: false } },
			'C5': { formats: { text: { fontcolor: 'gray' } } },
			'C6': { base: { formats: { text: { fontcolor: 'blue' } } } },
			'D6': { base: { formats: { text: { fontcolor: 'blue' } } } },
			'E6': { base: { formats: { styles: { fillcolor: 'green' }, text: { fontcolor: 'blue' } } } },
			'C7': { base: { formats: { styles: { fillcolor: 'yellow' } } } },
			'D7': { base: { formats: { styles: { fillcolor: 'yellow' }, text: { fontcolor: 'magenta' } } } },
			'E7': { base: { formats: { styles: { fillcolor: 'yellow' } } } },
			'G8': { formats: { styles: { fillcolor: 'yellow' } } }
		});
	});
	it('should be possible to load properties from json', () => {
		const propsjson = {
			sheet: {
				attributes: { initialsection: 3 },
				formats: { styles: { fillcolor: 'white' }, text: { fontcolor: 'red' } }
			},
			cols: {
				'C': { attributes: { initialsection: 2 } },
				'D': { formats: { text: { fontcolor: 'magenta' } } },
				'E': { formats: { styles: { fillcolor: 'green' } } }
			},
			rows: {
				'5': { attributes: { initialsection: 123 } },
				'6': { formats: { text: { fontcolor: 'blue' } } },
				'7': { formats: { styles: { fillcolor: 'yellow' } } }
			},
			cells: {
				'A1': { attributes: { visible: false } },
				'C5': { formats: { text: { fontcolor: 'gray' } } },
				'C6': { base: { formats: { text: { fontcolor: 'blue' } } } },
				'D6': { base: { formats: { text: { fontcolor: 'blue' } } } },
				'E6': { base: { formats: { styles: { fillcolor: 'green' }, text: { fontcolor: 'blue' } } } },
				'C7': { base: { formats: { styles: { fillcolor: 'yellow' } } } },
				'D7': { base: { formats: { styles: { fillcolor: 'yellow' }, text: { fontcolor: 'magenta' } } } },
				'E7': { base: { formats: { styles: { fillcolor: 'yellow' } } } },
				'G8': { formats: { styles: { fillcolor: 'yellow' } } }
			}
		}
		const t1 = new StreamSheet();
		const pm = PropertiesManager.of(t1.sheet).load(propsjson);
		expect(pm).toBeDefined();
		expect(pm.getSheetAttribute('initialsection')).toBe(3);
		expect(pm.getSheetTextFormat('fontcolor')).toBe('red');
		expect(pm.getSheetStyleFormat('fillcolor')).toBe('white');
		expect(pm.getRowAttribute(5, 'initialsection')).toBe(123);
		expect(pm.getRowTextFormat(6, 'fontcolor')).toBe('blue');
		expect(pm.getRowStyleFormat(7, 'fillcolor')).toBe('yellow');
		expect(pm.getColumnAttribute(2, 'initialsection')).toBe(2);
		expect(pm.getColumnTextFormat(3, 'fontcolor')).toBe('magenta');
		expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('green');
		// check cells:
		expect(pm.getCellAttribute(1, 0, 'visible')).toBe(false);
		expect(pm.getCellTextFormat(5, 2, 'fontcolor')).toBe('gray');
		expect(pm.getCellTextFormat(6, 2, 'fontcolor')).toBe('blue');
		expect(pm.getCellTextFormat(6, 3, 'fontcolor')).toBe('blue');
		expect(pm.getCellTextFormat(6, 4, 'fontcolor')).toBe('blue');
		expect(pm.getCellStyleFormat(6, 4, 'fillcolor')).toBe('green');
		expect(pm.getCellStyleFormat(7, 2, 'fillcolor')).toBe('yellow');
		expect(pm.getCellStyleFormat(7, 3, 'fillcolor')).toBe('yellow');
		expect(pm.getCellTextFormat(7, 3, 'fontcolor')).toBe('magenta');
		expect(pm.getCellStyleFormat(7, 4, 'fillcolor')).toBe('yellow');
		expect(pm.getCellStyleFormat(8, 6, 'fillcolor')).toBe('yellow');
		// check behavior
		// new columns & rows should have props from sheet:
		expect(pm.getRowAttribute(1, 'initialsection')).toBe(3);
		expect(pm.getRowTextFormat(1, 'fontcolor')).toBe('red');
		expect(pm.getRowStyleFormat(1, 'fillcolor')).toBe('white');
		expect(pm.getColumnAttribute(1, 'initialsection')).toBe(3);
		expect(pm.getColumnTextFormat(1, 'fontcolor')).toBe('red');
		expect(pm.getColumnStyleFormat(1, 'fillcolor')).toBe('white');
		// cells
		expect(pm.getCellTextFormat(1, 0, 'fontcolor')).toBe('red');
		expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('white');
		expect(pm.getCellStyleFormat(7, 0, 'fillcolor')).toBe('yellow');
		expect(pm.getCellStyleFormat(1, 4, 'fillcolor')).toBe('green');
	});
});
