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
 const PropertiesManager = require('../../src/machine/PropertiesManager');
 const { StreamSheet } = require('../..');

 const toString = (obj) => JSON.stringify(obj);

 let pm;
 beforeEach(() => {
	 const streamsheet = new StreamSheet({ name: 'S1' });
	 pm = PropertiesManager.of(streamsheet.sheet);
 });
 describe('PropertiesManager', () => {
	 describe('creation', () => {
		 it('should have no properties after creation', () => {
			 const { cells, cols, rows } = pm.toJSON();
			 expect(cols).toEqual([]);
			 expect(rows).toEqual([]);
			 expect(cells).toEqual([]);
		 });
	 });
	 describe('IO', () => {
		 it('should be possible to save properties to JSON', () => {
			 const rowProps = { formats: { fillcolor: 'yellow' }, textFormats: { fontcolor: 'blue' } };
			 const colProps = {
				 attributes: { initialsection: 42 },
				 formats: { fillcolor: 'red', fillstyle: 1 }
			 };
			 const cellProps = { formats: { fillcolor: 'orange' }, textFormats: { fontcolor: 'green' } };
			 pm.setProperties({
				 cols: [{ ref: { col: 'B' }, properties: colProps }],
				 rows: [{ ref: { row: 42 }, properties: rowProps }],
				 cells: [{ ref: { col: 'F', row: 5 }, properties: cellProps }]
			 });
			 const json = pm.toJSON();
			 expect(json).toBeDefined();
			 expect(json).toEqual({
				 cols: [{
					 ref: { col: 'B' },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'red', fillstyle: 1 }
					 }
				 }],
				 rows: [{
					 ref: { row: 42 },
					 properties: {
						 formats: { fillcolor: 'yellow' },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }],
				 cells: [{
					 ref: { col: 'F', row: 5 },
					 properties: {
						 formats: { fillcolor: 'orange' },
						 textFormats: { fontcolor: 'green' }
					 }
				 },
				 {
					 ref: { col: 'B', row: 42 },
					 properties: {
						 // attributes: { initialsection: 42 },
						 formats: { fillcolor: 'yellow' /* , fillstyle: 1 */ },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }]
			 })
		 });
		 it('should contain cleared columns, rows and cells too', () => {
			 const rowProps = { formats: { fillcolor: 'yellow' }, textFormats: { fontcolor: 'blue' } };
			 const colProps = {
				 attributes: { initialsection: 42 },
				 formats: { fillcolor: 'red', fillstyle: 1 }
			 };
			 const cellProps = { formats: { fillcolor: 'orange' }, textFormats: { fontcolor: 'green' } };
			 pm.setProperties({
				 cols: [{ ref: { col: 'B' }, properties: colProps }],
				 rows: [{ ref: { row: 42 }, properties: rowProps }],
				 cells: [{ ref: { col: 'F', row: 5 }, properties: cellProps }]
			 });
			 pm.clearProperties({ cells: [{ ref: { col: 'B', row: 42 } }] });
			 const json = pm.toJSON();
			 expect(json).toBeDefined();
			 expect(json).toEqual({
				 cols: [{
					 ref: { col: 'B' },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'red', fillstyle: 1 }
					 }
				 }],
				 rows: [{
					 ref: { row: 42 },
					 properties: {
						 formats: { fillcolor: 'yellow' },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }],
				 cells: [{
					 ref: { col: 'F', row: 5 },
					 properties: {
						 formats: { fillcolor: 'orange' },
						 textFormats: { fontcolor: 'green' }
					 }
				 },
				 {
					 ref: { col: 'B', row: 42 },
					 properties: { cleared: true }
				 }]
			 });
		 });
		 it('should be possible to load properties from JSON', () => {
			 const json = {
				 cols: [{
					 ref: { col: 'B' },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'red', fillstyle: 1 }
					 }
				 }],
				 rows: [{
					 ref: { row: 42 },
					 properties: {
						 formats: { fillcolor: 'yellow' },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }],
				 cells: [{
					 ref: { col: 'F', row: 5 },
					 properties: {
						 formats: { fillcolor: 'orange' },
						 textFormats: { fontcolor: 'green' }
					 }
				 },
				 {
					 ref: { col: 'B', row: 42 },
					 properties: {
						 formats: { fillcolor: 'yellow'},
						 textFormats: { fontcolor: 'blue' }
					 }
				 }]
			 };
			 pm.load(json);
			 const loadedJSON = pm.toJSON();
			 expect(loadedJSON).toEqual(json);
		 });
		 it('should load JSON with cleared columns, rows and cells too', () => {
			 const json = {
				 cols: [{
					 ref: { col: 'B' },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'red', fillstyle: 1 }
					 }
				 }],
				 rows: [{
					 ref: { row: 42 },
					 properties: {
						 formats: { fillcolor: 'yellow' },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }],
				 cells: [{
					 ref: { col: 'F', row: 5 },
					 properties: {
						 formats: { fillcolor: 'orange' },
						 textFormats: { fontcolor: 'green' }
					 }
				 },
				 {
					 ref: { col: 'B', row: 42 },
					 properties: { cleared: true }
				 }]
			 };
			 pm.load(json);
			 const loadedJSON = pm.toJSON();
			 expect(loadedJSON).toEqual(json);
		 });
	 });
	 describe('setProperties', () => {
		 it('should set column properties', () => {
			 const column = [{ ref: { col:'A'} }];
			 const properties1 = { formats: { fillcolor: 'yellow' } };
			 pm.setProperties({ properties: properties1, cols: column });
			 let { cols } = pm.toJSON();
			 expect(cols.length).toBe(1);
			 expect(cols[0].ref.col).toBe('A');
			 expect(toString(cols[0].properties)).toBe(toString(properties1));
			 // multiple columns
			 const properties2 = { formats: { fillcolor: 'green' } };
			 const columns = [{ ref: { col:'D'} }, { ref: { col:'E'} }, { ref: { col:'K'} }];
			 pm.setProperties({ properties: properties2, cols: columns });
			 cols = pm.toJSON().cols;
			 expect(cols.length).toBe(4);
			 expect(cols[0].ref.col).toBe('A');
			 expect(toString(cols[0].properties)).toBe(toString(properties1));
			 expect(cols[1].ref.col).toBe('D');
			 expect(toString(cols[1].properties)).toBe(toString(properties2));
			 expect(cols[2].ref.col).toBe('E');
			 expect(toString(cols[2].properties)).toBe(toString(properties2));
			 expect(cols[3].ref.col).toBe('K');
			 expect(toString(cols[3].properties)).toBe(toString(properties2));
		 });
		 it('should overwrite global set column properties with specific one', () => {
			 const globalProps = { formats: { fillcolor: 'yellow' } };
			 const specificProps = { formats: { fillcolor: 'green' } };
			 const columns = [
				 { ref: { col: 'B' } },
				 { ref: { col: 'Z' } },
				 { ref: { col: 'Y' }, properties: specificProps },
				 { ref: { col: 'G' }, properties: specificProps }
			 ];
			 pm.setProperties({ properties: globalProps, cols: columns });
			 const { cols } = pm.toJSON();
			 expect(cols.length).toBe(4);
			 expect(cols[0].ref.col).toBe('B');
			 expect(toString(cols[0].properties)).toBe(toString(globalProps));
			 expect(cols[1].ref.col).toBe('Z');
			 expect(toString(cols[1].properties)).toBe(toString(globalProps));
			 expect(cols[2].ref.col).toBe('Y');
			 expect(toString(cols[2].properties)).toBe(toString(specificProps));
			 expect(cols[3].ref.col).toBe('G');
			 expect(toString(cols[3].properties)).toBe(toString(specificProps));
		 });
		 it('should set row properties', () => {
			 const row = [{ ref: { row: 1} }];
			 const properties1 = { formats: { fillcolor: 'yellow' } };
			 pm.setProperties({ properties: properties1, rows: row });
			 let { rows } = pm.toJSON();
			 expect(rows.length).toBe(1);
			 expect(rows[0].ref.row).toBe(1);
			 expect(toString(rows[0].properties)).toBe(toString(properties1));
			 // multiple rows
			 const properties2 = { formats: { fillcolor: 'green' } };
			 const multipleRows = [{ ref: { row: 4 } }, { ref: { row: 20 } }, { ref: { row: 50 } }];
			 pm.setProperties({ properties: properties2, rows: multipleRows });
			 rows = pm.toJSON().rows;
			 expect(rows.length).toBe(4);
			 expect(rows[0].ref.row).toBe(1);
			 expect(toString(rows[0].properties)).toBe(toString(properties1));
			 expect(rows[1].ref.row).toBe(4);
			 expect(toString(rows[1].properties)).toBe(toString(properties2));
			 expect(rows[2].ref.row).toBe(20);
			 expect(toString(rows[2].properties)).toBe(toString(properties2));
			 expect(rows[3].ref.row).toBe(50);
			 expect(toString(rows[3].properties)).toBe(toString(properties2));
		 });
		 it('should overwrite global set row properties with specific one', () => {
			 const globalProps = { formats: { fillcolor: 'yellow' } };
			 const specificProps = { formats: { fillcolor: 'green' } };
			 const rows = [
				 { ref: { row: 2 } },
				 { ref: { row: 50 } },
				 { ref: { row: 45 }, properties: specificProps },
				 { ref: { row: 21 }, properties: specificProps }
			 ];
			 pm.setProperties({ properties: globalProps, rows });
			 const newrows = pm.toJSON().rows;
			 expect(newrows.length).toBe(4);
			 expect(newrows[0].ref.row).toBe(2);
			 expect(toString(newrows[0].properties)).toBe(toString(globalProps));
			 expect(newrows[1].ref.row).toBe(21);
			 expect(toString(newrows[1].properties)).toBe(toString(specificProps));
			 expect(newrows[2].ref.row).toBe(45);
			 expect(toString(newrows[2].properties)).toBe(toString(specificProps));
			 expect(newrows[3].ref.row).toBe(50);
			 expect(toString(newrows[3].properties)).toBe(toString(globalProps));
		 });
		 it('should set cell properties', () => {
			 const cell = [{ ref: { col: 'A', row: 1 } }];
			 const properties1 = { formats: { fillcolor: 'yellow' } };
			 pm.setProperties({ properties: properties1, cells: cell });
			 let { cells } = pm.toJSON();
			 expect(cells.length).toBe(1);
			 expect(cells[0].ref.col).toBe('A');
			 expect(cells[0].ref.row).toBe(1);
			 expect(toString(cells[0].properties)).toBe(toString(properties1));
			 // multiple cells
			 const properties2 = { formats: { fillcolor: 'green' } };
			 const multipleCells = [
				 { ref: { col: 'D', row: 1 } },
				 { ref: { col: 'E', row: 23 } },
				 { ref: { col: 'K', row: 4 } }
			 ];
			 pm.setProperties({ properties: properties2, cells: multipleCells });
			 cells = pm.toJSON().cells;
			 expect(cells.length).toBe(4);
			 expect(cells[0].ref.col).toBe('A');
			 expect(cells[0].ref.row).toBe(1);
			 expect(toString(cells[0].properties)).toBe(toString(properties1));
			 expect(cells[1].ref.col).toBe('D');
			 expect(cells[1].ref.row).toBe(1);
			 expect(toString(cells[1].properties)).toBe(toString(properties2));
			 expect(cells[2].ref.col).toBe('K');
			 expect(cells[2].ref.row).toBe(4);
			 expect(toString(cells[2].properties)).toBe(toString(properties2));
			 expect(cells[3].ref.col).toBe('E');
			 expect(cells[3].ref.row).toBe(23);
			 expect(toString(cells[3].properties)).toBe(toString(properties2));
		 });
		 it('should overwrite globally set cells properties with specific one', () => {
			 const globalProps = { formats: { fillcolor: 'yellow' } };
			 const specificProps = { formats: { fillcolor: 'green' } };
			 const cells = [
				 { ref: { col: 'B', row: 50 } },
				 { ref: { col: 'Z', row: 1 } },
				 { ref: { col: 'Y', row: 2 }, properties: specificProps },
				 { ref: { col: 'G', row: 10 }, properties: specificProps }
			 ];
			 pm.setProperties({ properties: globalProps, cells });
			 const newcells = pm.toJSON().cells;
			 expect(newcells.length).toBe(4);
			 expect(newcells[0].ref.col).toBe('Z');
			 expect(newcells[0].ref.row).toBe(1);
			 expect(toString(newcells[0].properties)).toBe(toString(globalProps));
			 expect(newcells[1].ref.col).toBe('Y');
			 expect(newcells[1].ref.row).toBe(2);
			 expect(toString(newcells[1].properties)).toBe(toString(specificProps));
			 expect(newcells[2].ref.col).toBe('G');
			 expect(newcells[2].ref.row).toBe(10);
			 expect(toString(newcells[2].properties)).toBe(toString(specificProps));
			 expect(newcells[3].ref.col).toBe('B');
			 expect(newcells[3].ref.row).toBe(50);
			 expect(toString(newcells[3].properties)).toBe(toString(globalProps));
		 });
		 it('should create cell properties at intersection of column and row', () => {
			 const rowProps = { formats: { fillcolor: 'yellow' }, textFormats: { fontcolor: 'blue' } };
			 const colProps = {
				 attributes: { initialsection: 42 },
				 formats: { fillcolor: 'red', fillstyle: 1 }
			 };
			 pm.setProperties({ cols: [{ ref: { col: 'B' } }], properties: colProps });
			 pm.setProperties({ rows: [{ ref: { row: 42 } }], properties: rowProps });
			 const props = pm.toJSON();
			 expect(props).toEqual({
				 cols: [{
					 ref: { col: 'B' },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'red', fillstyle: 1 }
					 }
				 }],
				 rows: [{
					 ref: { row: 42 },
					 properties: { formats: { fillcolor: 'yellow' }, textFormats: { fontcolor: 'blue' } }
				 }],
				 cells: [{
					 ref: { col: 'B', row: 42 },
					 properties: {
						 // attributes: { initialsection: 42 }, <-- only set if row overwrites column!
						 formats: { fillcolor: 'yellow' /* , fillstyle: 1 */},
						 textFormats: { fontcolor: 'blue' }
					 }
				 }]
			 })
		 });
		 it('should set column properties first if column, row and cells properties are given', () => {
			 pm.setProperties({
				 cells: [ { ref: { col: 'B', row: 2 }, properties: { formats: { fillcolor: 'green' } } } ],
				 cols: [ { ref: { col: 'B' }, properties: { formats: { fillcolor: 'red' } } } ],
				 rows: [ { ref: { row: 2 }, properties: { formats: { fillcolor: 'yellow' } } } ]
			 });
			 const { cells, cols, rows } = pm.toJSON();
			 expect(cells.length).toBe(1);
			 expect(cols.length).toBe(1);
			 expect(rows.length).toBe(1);
			 expect(cols[0].ref.col).toBe('B');
			 expect(cols[0].properties.formats).toEqual({ fillcolor: 'red' });
			 expect(rows[0].ref.row).toBe(2);
			 expect(rows[0].properties.formats).toEqual({ fillcolor: 'yellow' });
			 expect(cells[0].ref.col).toBe('B');
			 expect(cells[0].ref.row).toBe(2);
			 expect(cells[0].properties.formats).toEqual({ fillcolor: 'green' });
		 });
		 it('should return no changes if no properties are specified', () => {
			 let changes = pm.setProperties({});
			 expect(changes.cols).toEqual([]);
			 expect(changes.rows).toEqual([]);
			 expect(changes.cells).toEqual([]);
			 changes = pm.setProperties({ cols: [], rows: [], cells: [] });
			 expect(changes.cols).toEqual([]);
			 expect(changes.rows).toEqual([]);
			 expect(changes.cells).toEqual([]);
		 });
	 });
	 describe('revert setProperties', () => {
		 it('should be possible to revert column properties with returned changes object', () => {
			 const globalProps = { formats: { fillcolor: 'yellow' } };
			 const specificProps = { formats: { fillcolor: 'green' } };
			 const columns = [
				 { ref: { col: 'B' } },
				 { ref: { col: 'Z' } },
				 { ref: { col: 'Y' }, properties: specificProps },
				 { ref: { col: 'G' }, properties: specificProps }
			 ];
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
			 const changes = pm.setProperties({ properties: globalProps, cols: columns });
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols.length).toBe(4);
			 expect(props.rows).toEqual([]);
			 pm.setProperties(changes);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 it('should be possible to revert row properties with returned changes object', () => {
			 const globalProps = { formats: { fillcolor: 'yellow' } };
			 const specificProps = { formats: { fillcolor: 'green' } };
			 const rows = [
				 { ref: { row: 2 } },
				 { ref: { row: 50 } },
				 { ref: { row: 45 }, properties: specificProps },
				 { ref: { row: 21 }, properties: specificProps }
			 ];
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
			 const changes =	pm.setProperties({ properties: globalProps, rows });
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows.length).toBe(4);
			 pm.setProperties(changes);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 it('should be possible to revert cells properties with returned changes object', () => {
			 const globalProps = { formats: { fillcolor: 'yellow' } };
			 const specificProps = { formats: { fillcolor: 'green' } };
			 const cells = [
				 { ref: { col: 'B', row: 50 } },
				 { ref: { col: 'Z', row: 1 } },
				 { ref: { col: 'Y', row: 2 }, properties: specificProps },
				 { ref: { col: 'G', row: 10 }, properties: specificProps }
			 ];
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
			 const changes =	pm.setProperties({ properties: globalProps, cells });
			 props = pm.toJSON();
			 expect(props.cells.length).toBe(4);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
			 pm.setProperties(changes);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
	 });
	 describe('clearProperties', () => {
		 it('should be possible to clear columns properties', () => {
			 const properties = { formats: { fillcolor: 'yellow', fillstyle: 1 }, textFormats: { fontcolor: 'green' } };
			 const cols = [{ ref: { col: 'A' } }];
			 pm.setProperties({ cols, properties });
			 let props = pm.toJSON();
			 expect(props.cols).toEqual([
				 {
					 ref: { col: 'A' },
					 properties: {
						 formats: { fillcolor: 'yellow', fillstyle: 1 },
						 textFormats: { fontcolor: 'green' }
					 }
				 }
			 ]);
			 const changes = pm.clearProperties({ cols });
			 props = pm.toJSON();
			 expect(props.cols).toEqual([{ ref: { col: 'A' }, properties: { cleared: true } }]);
			 // undo
			 pm.setProperties(changes);
			 props = pm.toJSON();
			 expect(props.cols).toEqual([
				 {
					 ref: { col: 'A' },
					 properties: {
						 formats: { fillcolor: 'yellow', fillstyle: 1 },
						 textFormats: { fontcolor: 'green' }
					 }
				 }
			 ]);
		 });
		 it('should be possible to clear rows properties', () => {
			 const properties = { formats: { fillcolor: 'yellow', fillstyle: 1 }, textFormats: { fontcolor: 'green' } };
			 const rows = [{ ref: { row: 1 } }];
			 pm.setProperties({ rows, properties });
			 let props = pm.toJSON();
			 expect(props.rows).toEqual([
				 {
					 ref: { row: 1 },
					 properties: {
						 formats: { fillcolor: 'yellow', fillstyle: 1 },
						 textFormats: { fontcolor: 'green' }
					 }
				 }
			 ]);
			 const changes = pm.clearProperties({ rows });
			 props = pm.toJSON();
			 expect(props.rows).toEqual([{ ref: { row: 1 }, properties: { cleared: true } }]);
			 // undo
			 pm.setProperties(changes);
			 props = pm.toJSON();
			 expect(props.rows).toEqual([
				 {
					 ref: { row: 1 },
					 properties: {
						 formats: { fillcolor: 'yellow', fillstyle: 1 },
						 textFormats: { fontcolor: 'green' }
					 }
				 }
			 ]);
		 });
		 it('should be possible to clear cells properties', () => {
			 const properties = { formats: { fillcolor: 'yellow', fillstyle: 1 }, textFormats: { fontcolor: 'green' } };
			 const cells = [{ ref: { col: 'A', row: 1 } }];
			 pm.setProperties({ cells, properties });
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'A', row: 1 },
					 properties: {
						 formats: { fillcolor: 'yellow', fillstyle: 1 },
						 textFormats: { fontcolor: 'green' }
					 }
				 }
			 ]);
			 const changes = pm.clearProperties({ cells });
			 props = pm.toJSON();
			 expect(props.cells).toEqual([{ ref: { col: 'A', row: 1 }, properties: { cleared: true } }]);
			 // undo
			 pm.setProperties(changes);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'A', row: 1 },
					 properties: {
						 formats: { fillcolor: 'yellow', fillstyle: 1 },
						 textFormats: { fontcolor: 'green' }
					 }
				 }
			 ]);
		 });
	 });
	 describe('use cases', () => {
		 test('setting row and column properties should change properties of intersection cell', () => {
			 const allChanges = [];
			 const properties = { formats: { fillcolor: 'yellow', fillstyle: 1 } };
			 const rows = [{ ref: { row: 4 } }];
			 allChanges.push(pm.setProperties({ rows, properties }));
			 properties.attributes = { initialsection: 42 };
			 properties.formats.fillstyle = 1;
			 properties.formats.fillcolor = 'red';
			 properties.textFormats = { fontcolor: 'blue' };
			 const cols = [{ ref: { col: 'C' } }];
			 allChanges.push(pm.setProperties({ cols, properties }));
			 // check intersection cell
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'C', row: 4 },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'red', fillstyle: 1 },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }
			 ]);
			 properties.formats.fillcolor = 'green';
			 properties.textFormats = { fontcolor: 'gray' };
			 allChanges.push(pm.setProperties({ cols, properties }));
			 properties.formats.fillcolor = 'orange';
			 properties.textFormats = { fontcolor: 'black' };
			 allChanges.push(pm.setProperties({ rows, properties }));
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'C', row: 4 },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'orange', fillstyle: 1 },
						 textFormats: { fontcolor: 'black' }
					 }
				 }
			 ]);
			 // undo one after another
			 pm.setProperties(allChanges.pop());
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'C', row: 4 },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'green', fillstyle: 1 },
						 textFormats: { fontcolor: 'gray' }
					 }
				 }
			 ]);
			 pm.setProperties(allChanges.pop());
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'C', row: 4 },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'red', fillstyle: 1 },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }
			 ]);
			 pm.setProperties(allChanges.pop());
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
		 });
		 test('set column fillcolor, set row fillcolor, set intersection fillcolor, undo all', () => {
			 const properties = { formats: { fillcolor: 'red' } };
			 const cols = [{ ref: { col: 'B' } }];
			 const colChanges = pm.setProperties({ cols, properties });
			 properties.formats.fillcolor = 'yellow';
			 const rows = [{ ref: { row: 4 } }];
			 const rowChanges = pm.setProperties({ rows, properties });
			 properties.formats.fillcolor = 'green';
			 const cells = [{ ref: { col: 'B', row: 4 } }];
			 const cellChanges = pm.setProperties({ cells, properties });
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([{
				 ref: { col: 'B', row: 4 },
				 properties: { formats: { fillcolor: 'green' } }
			 }]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'B' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 4 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 // undo cell
			 pm.setProperties(cellChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([{
				 ref: { col: 'B', row: 4 },
				 properties: { formats: { fillcolor: 'yellow' } }
			 }]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'B' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 4 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 // undo row
			 pm.setProperties(rowChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'B' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([]);
			 // undo col
			 pm.setProperties(colChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 test('set row, column and cell properties and undo all', () => {
			 const properties = { formats: { fillcolor: 'yellow', fillstyle: 1 } };
			 const rows = [{ ref: { row: 4 } }];
			 const rowChanges = pm.setProperties({ rows, properties });
			 const cols = [{ ref: { col: 'C' } }];
			 properties.attributes = { initialsection: 42 };
			 properties.textFormats = { fontcolor: 'blue' };
			 properties.formats.fillstyle = 1;
			 properties.formats.fillcolor = 'red';
			 const colChanges = pm.setProperties({ cols, properties });
			 properties.attributes = undefined;
			 properties.text = undefined;
			 properties.formats.fillstyle = 1;
			 properties.formats.fillcolor = 'green';
			 const cells = [{ ref: { col: 'C', row: 4 } }];
			 const cellChanges = pm.setProperties({ cells, properties });
			 // check current settings
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'C', row: 4 },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'green', fillstyle: 1 },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }
			 ]);
			 expect(props.cols).toEqual([
				 {
					 ref: { col: 'C' },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'red', fillstyle: 1 },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 4 }, properties: { formats: { fillcolor: 'yellow', fillstyle: 1 } } }
			 ]);
			 // undo cell
			 pm.setProperties(cellChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'C', row: 4 },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'red', fillstyle: 1 },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }
			 ]);
			 expect(props.cols).toEqual([
				 {
					 ref: { col: 'C' },
					 properties: {
						 attributes: { initialsection: 42 },
						 formats: { fillcolor: 'red', fillstyle: 1 },
						 textFormats: { fontcolor: 'blue' }
					 }
				 }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 4 }, properties: { formats: { fillcolor: 'yellow', fillstyle: 1 } } }
			 ]);
			 // undo col
			 pm.setProperties(colChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([
				 { ref: { row: 4 }, properties: { formats: { fillcolor: 'yellow', fillstyle: 1 } } }
			 ]);
			 // undo row
			 pm.setProperties(rowChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 test('set column, cell, row properties and undo all', () => {
			 const properties = { formats: { fillcolor: 'blue', fillstyle: 1 } };
			 const cols = [{ ref: { col: 'E' } }];
			 const colChanges = pm.setProperties({ cols, properties });
			 properties.formats.fillstyle = 1;
			 properties.formats.fillcolor = 'yellow';
			 const cells = [{ ref: { col: 'E', row: 4 } }];
			 const cellChanges = pm.setProperties({ cells, properties });
			 properties.formats.fillstyle = 1;
			 properties.formats.fillcolor = 'green';
			 const rows = [{ ref: { row: 4 } }];
			 const rowChanges = pm.setProperties({ rows, properties });
			 // check current settings
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'E', row: 4 },
					 properties: { formats: { fillcolor: 'green', fillstyle: 1 } }
				 }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'E' }, properties: { formats: { fillcolor: 'blue', fillstyle: 1 } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 4 }, properties: { formats: { fillcolor: 'green', fillstyle: 1 } } }
			 ]);
			 // undo row:
			 pm.setProperties(rowChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'E', row: 4 },
					 properties: { formats: { fillcolor: 'yellow', fillstyle: 1 } }
				 }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'E' }, properties: { formats: { fillcolor: 'blue', fillstyle: 1 } } }
			 ]);
			 expect(props.rows).toEqual([]);
			 // undo cell:
			 pm.setProperties(cellChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'E' }, properties: { formats: { fillcolor: 'blue', fillstyle: 1 } } }
			 ]);
			 expect(props.rows).toEqual([]);
			 // undo col:
			 pm.setProperties(colChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 test('set row, cell, column properties and undo all', () => {
			 const properties = { formats: { fillcolor: 'blue', fillstyle: 1 } };
			 const rows = [{ ref: { row: 4 } }];
			 const rowChanges = pm.setProperties({ rows, properties });
			 properties.formats.fillstyle = 1;
			 properties.formats.fillcolor = 'yellow';
			 const cells = [{ ref: { col: 'E', row: 4 } }];
			 const cellChanges = pm.setProperties({ cells, properties });
			 properties.formats.fillstyle = 1;
			 properties.formats.fillcolor = 'green';
			 const cols = [{ ref: { col: 'E' } }];
			 const colChanges = pm.setProperties({ cols, properties });
			 // check current settings
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'E', row: 4 },
					 properties: { formats: { fillcolor: 'green', fillstyle: 1 } }
				 }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'E' }, properties: { formats: { fillcolor: 'green', fillstyle: 1 } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 4 }, properties: { formats: { fillcolor: 'blue', fillstyle: 1 } } }
			 ]);
			 // undo col:
			 pm.setProperties(colChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'E', row: 4 },
					 properties: { formats: { fillcolor: 'yellow', fillstyle: 1 } }
				 }
			 ]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([
				 { ref: { row: 4 }, properties: { formats: { fillcolor: 'blue', fillstyle: 1 } } }
			 ]);
			 // undo cell:
			 pm.setProperties(cellChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([
				 { ref: { row: 4 }, properties: { formats: { fillcolor: 'blue', fillstyle: 1 } } }
			 ]);
			 // undo row:
			 pm.setProperties(rowChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 test('cell properties are restored after undoing column properties', () => {
			 const properties = { formats: { fillcolor: 'blue', fillstyle: 1 } };
			 const cells = [{ ref: { col: 'A', row: 1 } }];
			 const cellChanges = pm.setProperties({ cells, properties });
			 properties.formats.fillstyle = 1;
			 properties.formats.fillcolor = 'red';
			 const cols = [{ ref: { col: 'A' } }];
			 const colChanges = pm.setProperties({ cols, properties });
			 // check current settings
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'A', row: 1 },
					 properties: { formats: { fillcolor: 'red', fillstyle: 1 } }
				 }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red', fillstyle: 1 } } }
			 ]);
			 expect(props.rows).toEqual([]);
			 // undo col:
			 pm.setProperties(colChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'A', row: 1 },
					 properties: { formats: { fillcolor: 'blue', fillstyle: 1 } }
				 }
			 ]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
			 // undo cell
			 pm.setProperties(cellChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 test('cell properties are restored after undoing row properties', () => {
			 const properties = { formats: { fillcolor: 'blue', fillstyle: 1 } };
			 const cells = [{ ref: { col: 'A', row: 1 } }];
			 const cellChanges = pm.setProperties({ cells, properties });
			 properties.formats.fillstyle = 1;
			 properties.formats.fillcolor = 'red';
			 const rows = [{ ref: { row: 1 } }];
			 const rowChanges = pm.setProperties({ rows, properties });
			 // check current settings
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'A', row: 1 },
					 properties: { formats: { fillcolor: 'red', fillstyle: 1 } }
				 }
			 ]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'red', fillstyle: 1 } } }
			 ]);
			 // undo row:
			 pm.setProperties(rowChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 {
					 ref: { col: 'A', row: 1 },
					 properties: { formats: { fillcolor: 'blue', fillstyle: 1 } }
				 }
			 ]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
			 // undo cell
			 pm.setProperties(cellChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 // some clear related use cases
		 test('set column, row and cell properties, then clear column', () => {
			 const properties = { formats: { fillcolor: 'red' } };
			 const cols = [{ ref: { col: 'A' } }];
			 const colChanges = pm.setProperties({ cols, properties });
			 properties.formats.fillcolor = 'yellow';
			 const rows = [{ ref: { row: 1 } }];
			 const rowChanges = pm.setProperties({ rows, properties });
			 properties.formats.fillcolor = 'green';
			 const cells = [{ ref: { col: 'A', row: 1 } }];
			 const cellChanges = pm.setProperties({ cells, properties });
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([{
				 ref: { col: 'A', row: 1 },
				 properties: { formats: { fillcolor: 'green' } }
			 }]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 const clearChanges = pm.clearProperties({ cols: [{ ref: { col: 'A' } }] });
			 props = pm.toJSON();
			 expect(props.cells).toEqual([{ ref: { col: 'A', row: 1 }, properties: { cleared: true } }]);
			 expect(props.cols).toEqual([{ ref: { col: 'A' }, properties: { cleared: true } }]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 // undo all
			 pm.setProperties(clearChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'green' } } }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 pm.setProperties(cellChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 pm.setProperties(rowChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([]);
			 pm.setProperties(colChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 test('set column, row and cell properties, then clear row', () => {
			 const properties = { formats: { fillcolor: 'red' } };
			 const cols = [{ ref: { col: 'A' } }];
			 const colChanges = pm.setProperties({ cols, properties });
			 properties.formats.fillcolor = 'yellow';
			 const rows = [{ ref: { row: 1 } }];
			 const rowChanges = pm.setProperties({ rows, properties });
			 properties.formats.fillcolor = 'green';
			 const cells = [{ ref: { col: 'A', row: 1 } }];
			 const cellChanges = pm.setProperties({ cells, properties });
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([{
				 ref: { col: 'A', row: 1 },
				 properties: { formats: { fillcolor: 'green' } }
			 }]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 const clearChanges = pm.clearProperties({ rows: [{ ref: { row: 1 } }] });
			 props = pm.toJSON();
			 expect(props.cells).toEqual([{ ref: { col: 'A', row: 1 }, properties: { cleared: true } }]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([{ ref: { row: 1 }, properties: { cleared: true } }]);
			 // undo all
			 pm.setProperties(clearChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'green' } } }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 pm.setProperties(cellChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 pm.setProperties(rowChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([]);
			 pm.setProperties(colChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 test('set column, row and cell properties, then clear cell', () => {
			 const properties = { formats: { fillcolor: 'red' } };
			 const cols = [{ ref: { col: 'A' } }];
			 const colChanges = pm.setProperties({ cols, properties });
			 properties.formats.fillcolor = 'yellow';
			 const rows = [{ ref: { row: 1 } }];
			 const rowChanges = pm.setProperties({ rows, properties });
			 properties.formats.fillcolor = 'green';
			 const cells = [{ ref: { col: 'A', row: 1 } }];
			 const cellChanges = pm.setProperties({ cells, properties });
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([{
				 ref: { col: 'A', row: 1 },
				 properties: { formats: { fillcolor: 'green' } }
			 }]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 const clearChanges = pm.clearProperties({ cells: [{ ref: { col: 'A', row: 1 } }] });
			 props = pm.toJSON();
			 expect(props.cells).toEqual([{ ref: { col: 'A', row: 1 }, properties: { cleared: true } }]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 // undo all
			 pm.setProperties(clearChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'green' } } }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 pm.setProperties(cellChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 pm.setProperties(rowChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([]);
			 pm.setProperties(colChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
		 test('set cell, row, cell, column and cell properties again, then clear row, column and cell', () => {
			 const properties = { formats: { fillcolor: 'green' } };
			 const cellChanges1 = pm.setProperties({ cells: [{ ref: { col: 'A', row: 1 } }], properties });
			 properties.formats.fillcolor = 'yellow';
			 const rowChanges = pm.setProperties({ rows: [{ ref: { row: 1 } }], properties });
			 properties.formats.fillcolor = 'orange';
			 const cellChanges2 = pm.setProperties({ cells: [{ ref: { col: 'A', row: 1 } }], properties });
			 properties.formats.fillcolor = 'red';
			 const colChanges = pm.setProperties({ cols: [{ ref: { col: 'A' } }], properties });
			 properties.formats.fillcolor = 'blue';
			 const cellChanges3 = pm.setProperties({ cells: [{ ref: { col: 'A', row: 1 } }], properties });
			 let props = pm.toJSON();
			 expect(props.cells).toEqual([{
				 ref: { col: 'A', row: 1 },
				 properties: { formats: { fillcolor: 'blue' } }
			 }]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 const clearRow = pm.clearProperties({ rows: [{ ref: { row: 1 } }] });
			 props = pm.toJSON();
			 expect(props.cells).toEqual([{ ref: { col: 'A', row: 1 }, properties: { cleared: true } }]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([{ ref: { row: 1 }, properties: { cleared: true } }]);
			 const clearColumn = pm.clearProperties({ cols: [{ ref: { col: 'A' } }] });
			 props = pm.toJSON();
			 expect(props.cells).toEqual([{ ref: { col: 'A', row: 1 }, properties: { cleared: true } }]);
			 expect(props.cols).toEqual([{ ref: { col: 'A' }, properties: { cleared: true } }]);
			 expect(props.rows).toEqual([{ ref: { row: 1 }, properties: { cleared: true } }]);
			 const clearCell = pm.clearProperties({ cells: [{ ref: { col: 'A', row: 1 } }] });
			 props = pm.toJSON();
			 expect(props.cells).toEqual([{ ref: { col: 'A', row: 1 }, properties: { cleared: true } }]);
			 expect(props.cols).toEqual([{ ref: { col: 'A' }, properties: { cleared: true } }]);
			 expect(props.rows).toEqual([{ ref: { row: 1 }, properties: { cleared: true } }]);
			 // undo all
			 pm.setProperties(clearCell);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([{ ref: { col: 'A', row: 1 }, properties: { cleared: true } }]);
			 expect(props.cols).toEqual([{ ref: { col: 'A' }, properties: { cleared: true } }]);
			 expect(props.rows).toEqual([{ ref: { row: 1 }, properties: { cleared: true } }]);
			 pm.setProperties(clearColumn);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([{ ref: { col: 'A', row: 1 }, properties: { cleared: true } }]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([{ ref: { row: 1 }, properties: { cleared: true } }]);
			 pm.setProperties(clearRow);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'blue' } } }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 pm.setProperties(cellChanges3);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.cols).toEqual([
				 { ref: { col: 'A' }, properties: { formats: { fillcolor: 'red' } } }
			 ]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 pm.setProperties(colChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'orange' } } }
			 ]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 pm.setProperties(cellChanges2);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([
				 { ref: { row: 1 }, properties: { formats: { fillcolor: 'yellow' } } }
			 ]);
			 pm.setProperties(rowChanges);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([
				 { ref: { col: 'A', row: 1 }, properties: { formats: { fillcolor: 'green' } } }
			 ]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
			 pm.setProperties(cellChanges1);
			 props = pm.toJSON();
			 expect(props.cells).toEqual([]);
			 expect(props.cols).toEqual([]);
			 expect(props.rows).toEqual([]);
		 });
	 });
 });
