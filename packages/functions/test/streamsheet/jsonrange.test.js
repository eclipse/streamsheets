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
const { FunctionErrors } = require('@cedalo/error-codes');
const { Machine, StreamSheet } = require('@cedalo/machine-core');
const { createCellAt } = require('../utilities');

const ERROR = FunctionErrors.code;
const setup = () => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	machine.removeAllStreamSheets();
	machine.addStreamSheet(streamsheet);
	return { machine, sheet: streamsheet.sheet };
};
describe('json.range', () => {	
	describe('parameter parsing', () => {
		it('should accept at least 2 and at most 4 parameters', () => {
			const { sheet } = setup();
			expect(createCellAt('A1', { formula: 'json.range()' }, sheet).value.code).toBe(ERROR.ARGS);
			expect(createCellAt('A1', { formula: 'json.range(JSON(B1:C1))' }, sheet).value.code).toBe(ERROR.ARGS);
			expect(
				createCellAt('A1', { formula: 'json.range(JSON(B1:C1), B2:C2, D3, true,)' }, sheet).value.code
			).toBe(ERROR.ARGS);
			expect(
				createCellAt('A1', { formula: 'json.range(JSON(B1:C1), B2:C2, D3, true,,,)' }, sheet).value.code
			).toBe(ERROR.ARGS);
		});
		it(`should return ${ERROR.VALUE} if first param is no JSON`, () => {
			const { sheet } = setup();
			sheet.loadCells({ A1: 23, B1: false, C1: 'hello', D1: null });
			expect(createCellAt('A3', { formula: 'json.range(,B1:C1)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(A1,B1:C1)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(23,B1:C1)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(B1,B1:C1)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(false,B1:C1)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(C1,B1:C1)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range("hello",B1:C1)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(D1,B1:C1)' }, sheet).value.code).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if second param is no cell range`, () => {
			const { sheet } = setup();
			sheet.loadCells({ A1: 23, B1: false, C1: 'hello', D1: null });
			expect(createCellAt('A3', { formula: 'json.range(JSON(C1:D1),)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(JSON(C1:D1),23)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(JSON(C1:D1),false)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(
				createCellAt('A3', { formula: 'json.range(JSON(C1:D1), "hello")' }, sheet).value.code
			).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if third param is no valid type string`, () => {
			const { sheet } = setup();
			sheet.loadCells({ A1: 23, B1: false, C1: 'hello' });
			expect(
				createCellAt('A3', { formula: 'json.range(JSON(C1:D1), A4:B5, A1)' }, sheet).value.code
			).toBe(ERROR.VALUE);
			expect(
				createCellAt('A3', { formula: 'json.range(JSON(C1:D1), A4:B5, 23)' }, sheet).value.code
			).toBe(ERROR.VALUE);
			expect(
				createCellAt('A3', { formula: 'json.range(JSON(C1:D1), A4:B5, B1)' }, sheet).value.code
			).toBe(ERROR.VALUE);
			expect(
				createCellAt('A3', { formula: 'json.range(JSON(C1:D1), A4:B5, false)' }, sheet).value.code
			).toBe(ERROR.VALUE);
			expect(
				createCellAt('A3', { formula: 'json.range(JSON(C1:D1), A4:B5, C1)' }, sheet).value.code
			).toBe(ERROR.VALUE);
			expect(
				createCellAt('A3', { formula: 'json.range(JSON(C1:D1), A4:B5, "hello")' }, sheet).value.code
			).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if fourth param is no boolean`, () => {
			// NOTE: we currently do not require strict boolean, so number is converted to boolean!
			const { sheet } = setup();
			sheet.loadCells({ A1: 23, B1: false, C1: 'hello', D1: null });
			expect(createCellAt('A3', { formula: 'json.range(JSON(C1:D1), A4:B5, "ARRAY", )' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(JSON(C1:D1), A4:B5, "ARRAY", C1)' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(JSON(C1:D1), A4:B5, "ARRAY", "hello")' }, sheet).value.code).toBe(ERROR.VALUE);
			expect(createCellAt('A3', { formula: 'json.range(JSON(C1:D1), A4:B5, "ARRAY", D1)' }, sheet).value.code).toBe(ERROR.VALUE);
		});			
	});
	describe('type jsonroot', () => {
		it('should write given json to specified range', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 23, A2: 'v2', B2: 42 });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B5,"jsonroot")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4').value).toBe(23);
			expect(sheet.cellAt('A5').value).toBe('v2');
			expect(sheet.cellAt('B5').value).toBe(42);
		});
		it('should write given json horizontally if direction is set to false', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 23, A2: 'v2', B2: 42 });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B5,"jsonroot",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4').value).toBe('v2');
			expect(sheet.cellAt('A5').value).toBe(23);
			expect(sheet.cellAt('B5').value).toBe(42);
		});
		it('should support array based json', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({
				A1: { type: 'number', value: 0, level: 1}, B1: 'hello',
				A2: { type: 'number', value: 1, level: 1}, B2: 'world',
				A3: { type: 'number', value: 2, level: 1}, B3: false,
			});
			createCellAt('A6', { formula: 'json.range(JSON(A1:B3),A7:B9,"jsonroot")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A6').value).toBe(true);
			expect(sheet.cellAt('A7').value).toBe(0);
			expect(sheet.cellAt('B7').value).toBe('hello');
			expect(sheet.cellAt('A8').value).toBe(1);
			expect(sheet.cellAt('B8').value).toBe('world');
			expect(sheet.cellAt('A9').value).toBe(2);
			expect(sheet.cellAt('B9').value).toBe(false);
		});
		it('should support array based json and direction set to false', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({
				A1: { type: 'number', value: 0, level: 1}, B1: 'hello',
				A2: { type: 'number', value: 1, level: 1}, B2: 'world',
				A3: { type: 'number', value: 2, level: 1}, B3: false,
			});
			createCellAt('A6', { formula: 'json.range(JSON(A1:B3),A7:C8,"jsonroot",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A6').value).toBe(true);
			expect(sheet.cellAt('A7').value).toBe(0);
			expect(sheet.cellAt('B7').value).toBe(1);
			expect(sheet.cellAt('C7').value).toBe(2);
			expect(sheet.cellAt('A8').value).toBe('hello');
			expect(sheet.cellAt('B8').value).toBe('world');
			expect(sheet.cellAt('C8').value).toBe(false);
		});
		it('should only write first level of nested objects in arrays', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({
				A3: { type: 'number', value: 0, level: 0},
				A4: { type: 'string', value: 'title', level: 1}, B4: 'Dr.',
				A5: { type: 'string', value: 'name', level: 1}, B5: 'Strange',
				A6: { type: 'number', value: 1, level: 0},
				A7: { type: 'string', value: 'person', level: 1},
				A8: { type: 'string', value: 'name', level: 2}, B8: 'foo',
				A9: { type: 'string', value: 'age', level: 2}, B9: 42,
				A10: { type: 'string', value: 'phones', level: 2},
				A11: { type: 'number', value: 0, level: 3}, B11: '800-123-4567',
				A12: { type: 'number', value: 1, level: 3},
				A13: { type: 'string', value: 'prefix', level: 4}, B13: '+49',
				A14: { type: 'string', value: 'number', level: 4}, B14: '1234-5678-9'
			});
			/* [
				{ "title": "Dr.", "name": "Strange" },
				{
					"person": {
						"name": "foo",
						"age": 42,
						"phones": ["800-123-4567", { "prefix": "+49", "number": "1234-5678-9" }]
					}
				}
			] */
			createCellAt('A20', { formula: 'json.range(JSON(A3:B14),A21:C23,"jsonroot")' }, sheet);
			await machine.step();
			// DL-4560: it should preserve indices on type json!
			expect(sheet.cellAt('A20').value).toBe(true);
			expect(sheet.cellAt('A21').value).toBe(0);
			expect(sheet.cellAt('B21').value).toEqual({ title: 'Dr.', name: 'Strange' });
			expect(sheet.cellAt('A22').value).toBe(1);
			expect(sheet.cellAt('B22').value).toEqual({
				person: {
					name: 'foo',
					age: 42,
					phones: ['800-123-4567', { prefix: '+49', number: '1234-5678-9' }]
				}
			});
			// all others are undefined
			expect(sheet.cellAt('A23')).toBeUndefined();
			expect(sheet.cellAt('B23')).toBeUndefined();
			expect(sheet.cellAt('C23')).toBeUndefined();
		});
		it('should only write first level of nested objects and direction set to false', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({
				A3: { type: 'number', value: 0, level: 0},
				A4: { type: 'string', value: 'title', level: 1}, B4: 'Dr.',
				A5: { type: 'string', value: 'name', level: 1}, B5: 'Strange',
				A6: { type: 'number', value: 1, level: 0},
				A7: { type: 'string', value: 'person', level: 1},
				A8: { type: 'string', value: 'name', level: 2}, B8: 'foo',
				A9: { type: 'string', value: 'age', level: 2}, B9: 42,
				A10: { type: 'string', value: 'phones', level: 2},
				A11: { type: 'number', value: 0, level: 3}, B11: '800-123-4567',
				A12: { type: 'number', value: 1, level: 3},
				A13: { type: 'string', value: 'prefix', level: 4}, B13: '+49',
				A14: { type: 'string', value: 'number', level: 4}, B14: '1234-5678-9'
			});
			/* [
				{ "title": "Dr.", "name": "Strange" },
				{
					"person": {
						"name": "foo",
						"age": 42,
						"phones": ["800-123-4567", { "prefix": "+49", "number": "1234-5678-9" }]
					}
				}
			] */
			createCellAt('A20', { formula: 'json.range(JSON(A3:B14),A21:C23,"jsonroot",false)' }, sheet);
			await machine.step();
			// DL-4560: it should preserve indices on type json!
			expect(sheet.cellAt('A20').value).toBe(true);
			expect(sheet.cellAt('A21').value).toBe(0);
			expect(sheet.cellAt('B21').value).toBe(1);
			expect(sheet.cellAt('A22').value).toEqual({ title: 'Dr.', name: 'Strange' });
			expect(sheet.cellAt('B22').value).toEqual({
				person: {
					name: 'foo',
					age: 42,
					phones: ['800-123-4567', { prefix: '+49', number: '1234-5678-9' }]
				}
			});
			// all others are undefined:
			expect(sheet.cellAt('A23')).toBeUndefined();
			expect(sheet.cellAt('B23')).toBeUndefined();
			expect(sheet.cellAt('C23')).toBeUndefined();
		});
		it('should support json in which some keys have null values', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', A2: 'v2', B2: null });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B5,"jsonroot")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4')).toBeUndefined();
			expect(sheet.cellAt('A5').value).toBe('v2');
			expect(sheet.cellAt('B5')).toBeUndefined();
		});
		it('should clear target range if json is empty', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A4: 'v1', B4: 23, A5: 'v2', B5: 42 });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B5,"jsonroot")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4')).toBeUndefined();
			expect(sheet.cellAt('B4')).toBeUndefined();
			expect(sheet.cellAt('A5')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
		});
		it('should not write over bounds of specified range', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 23, A2: 'v2', B2: 42 });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B4,"jsonroot")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4').value).toBe(23);
			expect(sheet.cellAt('A5')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B4,"jsonroot",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4').value).toBe('v2');
			expect(sheet.cellAt('A5')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
		});
		it('should create a suitable target range if specified one contains only one cell', async () => {
			// start with an easy to get going
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 23, A2: 'v2', B2: 42 });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:A4,"jsonroot")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4').value).toBe(23);
			expect(sheet.cellAt('A5').value).toBe('v2');
			expect(sheet.cellAt('B5').value).toBe(42);
			// no nested
			sheet.loadCells({
				A3: { type: 'number', value: 0, level: 0},
				A4: { type: 'string', value: 'title', level: 1}, B4: 'Dr.',
				A5: { type: 'string', value: 'name', level: 1}, B5: 'Strange',
				A6: { type: 'number', value: 1, level: 0},
				A7: { type: 'string', value: 'person', level: 1},
				A8: { type: 'string', value: 'name', level: 2}, B8: 'foo',
				A9: { type: 'string', value: 'age', level: 2}, B9: 42,
				A10: { type: 'string', value: 'phones', level: 2},
				A11: { type: 'number', value: 0, level: 3}, B11: '800-123-4567',
				A12: { type: 'number', value: 1, level: 3},
				A13: { type: 'string', value: 'prefix', level: 4}, B13: '+49',
				A14: { type: 'string', value: 'number', level: 4}, B14: '1234-5678-9'
			});
			/* [
				{ "title": "Dr.", "name": "Strange" },
				{
					"person": {
						"name": "foo",
						"age": 42,
						"phones": ["800-123-4567", { "prefix": "+49", "number": "1234-5678-9" }]
					}
				}
			] */
			createCellAt('A20', { formula: 'json.range(JSON(A3:B14),A21:A21,"jsonroot")' }, sheet);
			await machine.step();
			// DL-4560: it should preserve indices on type json!
			expect(sheet.cellAt('A20').value).toBe(true);
			expect(sheet.cellAt('A21').value).toBe(0);
			expect(sheet.cellAt('B21').value).toEqual({ title: 'Dr.', name: 'Strange' });
			expect(sheet.cellAt('A22').value).toBe(1);
			expect(sheet.cellAt('B22').value).toEqual({
				person: {
					name: 'foo',
					age: 42,
					phones: ['800-123-4567', { prefix: '+49', number: '1234-5678-9' }]
				}
			});
			// no nested with false direction!
			sheet.loadCells({
				A3: { type: 'number', value: 0, level: 0},
				A4: { type: 'string', value: 'title', level: 1}, B4: 'Dr.',
				A5: { type: 'string', value: 'name', level: 1}, B5: 'Strange',
				A6: { type: 'number', value: 1, level: 0},
				A7: { type: 'string', value: 'person', level: 1},
				A8: { type: 'string', value: 'name', level: 2}, B8: 'foo',
				A9: { type: 'string', value: 'age', level: 2}, B9: 42,
				A10: { type: 'string', value: 'phones', level: 2},
				A11: { type: 'number', value: 0, level: 3}, B11: '800-123-4567',
				A12: { type: 'number', value: 1, level: 3},
				A13: { type: 'string', value: 'prefix', level: 4}, B13: '+49',
				A14: { type: 'string', value: 'number', level: 4}, B14: '1234-5678-9'
			});
			/* [
				{ "title": "Dr.", "name": "Strange" },
				{
					"person": {
						"name": "foo",
						"age": 42,
						"phones": ["800-123-4567", { "prefix": "+49", "number": "1234-5678-9" }]
					}
				}
			] */
			createCellAt('A20', { formula: 'json.range(JSON(A3:B14),A21:A21,"jsonroot",false)' }, sheet);
			await machine.step();
			// DL-4560: it should preserve indices on type json!
			expect(sheet.cellAt('A20').value).toBe(true);
			expect(sheet.cellAt('A21').value).toBe(0);
			expect(sheet.cellAt('B21').value).toBe(1);
			expect(sheet.cellAt('A22').value).toEqual({ title: 'Dr.', name: 'Strange' });
			expect(sheet.cellAt('B22').value).toEqual({
				person: {
					name: 'foo',
					age: 42,
					phones: ['800-123-4567', { prefix: '+49', number: '1234-5678-9' }]
				}
			});
		});
	});
	describe('type json', () => {
		it('should write given json to specified range', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 23, A2: 'v2', B2: 42 });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B5)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4').value).toBe(23);
			expect(sheet.cellAt('A5').value).toBe('v2');
			expect(sheet.cellAt('B5').value).toBe(42);
		});
		it('should write given json horizontally if direction is set to false', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 23, A2: 'v2', B2: 42 });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B5,,false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4').value).toBe('v2');
			expect(sheet.cellAt('A5').value).toBe(23);
			expect(sheet.cellAt('B5').value).toBe(42);
		});
		it('should support array based json', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({
				A1: { type: 'number', value: 0, level: 1}, B1: 'hello',
				A2: { type: 'number', value: 1, level: 1}, B2: 'world',
				A3: { type: 'number', value: 2, level: 1}, B3: false,
			});
			createCellAt('A6', { formula: 'json.range(JSON(A1:B3),A7:B9)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A6').value).toBe(true);
			expect(sheet.cellAt('A7').value).toBe(0);
			expect(sheet.cellAt('A8').value).toBe(1);
			expect(sheet.cellAt('A9').value).toBe(2);
			expect(sheet.cellAt('B7').value).toBe('hello');
			expect(sheet.cellAt('B8').value).toBe('world');
			expect(sheet.cellAt('B9').value).toBe(false);
		});
		it('should support array based json and direction set to false', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({
				A1: { type: 'number', value: 0, level: 1}, B1: 'hello',
				A2: { type: 'number', value: 1, level: 1}, B2: 'world',
				A3: { type: 'number', value: 2, level: 1}, B3: false,
			});
			createCellAt('A6', { formula: 'json.range(JSON(A1:B3),A7:C8,,false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A6').value).toBe(true);
			expect(sheet.cellAt('A7').value).toBe(0);
			expect(sheet.cellAt('B7').value).toBe(1);
			expect(sheet.cellAt('C7').value).toBe(2);
			expect(sheet.cellAt('A8').value).toBe('hello');
			expect(sheet.cellAt('B8').value).toBe('world');
			expect(sheet.cellAt('C8').value).toBe(false);
		});
		it('should support nested objects and arrays', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({
				A1: 'a',
				A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
				A3: { type: 'number', value: 1, level: 1},
				A4: { type: 'string', value: 'title', level: 2}, B4: 'Dr.',
				A5: { type: 'string', value: 'name', level: 2}, B5: 'Strange',
				A6: { type: 'number', value: 2, level: 1},
				A7: { type: 'string', value: 'person', level: 2},
				A8: { type: 'string', value: 'name', level: 3}, B8: 'foo',
				A9: { type: 'string', value: 'age', level: 3}, B9: 42,
				A10: { type: 'string', value: 'phones', level: 3},
				A11: { type: 'number', value: 0, level: 4}, B11: '800-123-4567',
				A12: { type: 'number', value: 1, level: 4},
				A13: { type: 'string', value: 'prefix', level: 5}, B13: '+49',
				A14: { type: 'string', value: 'number', level: 5}, B14: '1234-5678-9'
			});
			/* {
				"a": [
					"hello",
					{ "title": "Dr", "name": "Strange" },
					{
						"person": {
							"name": "foo",
							"age": 42,
							"phones": ["800-123-4567", { "prefix": "+49", "number": "1234-5678-9" }]
						}
					}
				]
			} */
			createCellAt('A20', { formula: 'json.range(JSON(A1:B14),A21:B34)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A20').value).toBe(true);
			expect(sheet.cellAt('A21').value).toBe('a');
			expect(sheet.cellAt('B21')).toBeUndefined();
			expect(sheet.cellAt('A22').value).toBe(0);
			expect(sheet.cellAt('B22').value).toBe('hello');
			expect(sheet.cellAt('A23').value).toBe(1);
			expect(sheet.cellAt('B23')).toBeUndefined();
			expect(sheet.cellAt('A24').value).toBe('title');
			expect(sheet.cellAt('B24').value).toBe('Dr.');
			expect(sheet.cellAt('A25').value).toBe('name');
			expect(sheet.cellAt('B25').value).toBe('Strange');
			expect(sheet.cellAt('A26').value).toBe(2);
			expect(sheet.cellAt('B26')).toBeUndefined();
			expect(sheet.cellAt('A27').value).toBe('person');
			expect(sheet.cellAt('B27')).toBeUndefined();
			expect(sheet.cellAt('A28').value).toBe('name');
			expect(sheet.cellAt('B28').value).toBe('foo');
			expect(sheet.cellAt('A29').value).toBe('age');
			expect(sheet.cellAt('B29').value).toBe(42);
			expect(sheet.cellAt('A30').value).toBe('phones');
			expect(sheet.cellAt('B30')).toBeUndefined();
			expect(sheet.cellAt('A31').value).toBe(0);
			expect(sheet.cellAt('B31').value).toBe('800-123-4567');
			expect(sheet.cellAt('A32').value).toBe(1);
			expect(sheet.cellAt('B32')).toBeUndefined();
			expect(sheet.cellAt('A33').value).toBe('prefix');
			expect(sheet.cellAt('B33').value).toBe('+49');
			expect(sheet.cellAt('A34').value).toBe('number');
			expect(sheet.cellAt('B34').value).toBe('1234-5678-9');
		});
		it('should support nested objects and direction set to false', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({
				A1: 'a',
				A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
				A3: { type: 'number', value: 1, level: 1},
				A4: { type: 'string', value: 'title', level: 2}, B4: 'Dr.',
				A5: { type: 'string', value: 'name', level: 2}, B5: 'Strange',
				A6: { type: 'number', value: 2, level: 1},
				A7: { type: 'string', value: 'person', level: 2},
				A8: { type: 'string', value: 'name', level: 3}, B8: 'foo',
				A9: { type: 'string', value: 'age', level: 3}, B9: 42,
				A10: { type: 'string', value: 'phones', level: 3},
				A11: { type: 'number', value: 0, level: 4}, B11: '800-123-4567',
				A12: { type: 'number', value: 1, level: 4},
				A13: { type: 'string', value: 'prefix', level: 5}, B13: '+49',
				A14: { type: 'string', value: 'number', level: 5}, B14: '1234-5678-9'
			});
			/* {
				"a": [
					"hello",
					{ "title": "Dr", "name": "Strange" },
					{
						"person": {
							"name": "foo",
							"age": 42,
							"phones": ["800-123-4567", { "prefix": "+49", "number": "1234-5678-9" }]
						}
					}
				]
			} */
			createCellAt('A20', { formula: 'json.range(JSON(A1:B14),A21:N22,,false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A20').value).toBe(true);
			expect(sheet.cellAt('A21').value).toBe('a');
			expect(sheet.cellAt('A22')).toBeUndefined();
			expect(sheet.cellAt('B21').value).toBe(0);
			expect(sheet.cellAt('B22').value).toBe('hello');
			expect(sheet.cellAt('C21').value).toBe(1);
			expect(sheet.cellAt('C22')).toBeUndefined();
			expect(sheet.cellAt('D21').value).toBe('title');
			expect(sheet.cellAt('D22').value).toBe('Dr.');
			expect(sheet.cellAt('E21').value).toBe('name');
			expect(sheet.cellAt('E22').value).toBe('Strange');
			expect(sheet.cellAt('F21').value).toBe(2);
			expect(sheet.cellAt('F22')).toBeUndefined();
			expect(sheet.cellAt('G21').value).toBe('person');
			expect(sheet.cellAt('G22')).toBeUndefined();
			expect(sheet.cellAt('H21').value).toBe('name');
			expect(sheet.cellAt('H22').value).toBe('foo');
			expect(sheet.cellAt('I21').value).toBe('age');
			expect(sheet.cellAt('I22').value).toBe(42);
			expect(sheet.cellAt('J21').value).toBe('phones');
			expect(sheet.cellAt('J22')).toBeUndefined();
			expect(sheet.cellAt('K21').value).toBe(0);
			expect(sheet.cellAt('K22').value).toBe('800-123-4567');
			expect(sheet.cellAt('L21').value).toBe(1);
			expect(sheet.cellAt('L22')).toBeUndefined();
			expect(sheet.cellAt('M21').value).toBe('prefix');
			expect(sheet.cellAt('M22').value).toBe('+49');
			expect(sheet.cellAt('N21').value).toBe('number');
			expect(sheet.cellAt('N22').value).toBe('1234-5678-9');
		});
		it('should support json in which some keys have null values', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', A2: 'v2', B2: null });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B5)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4')).toBeUndefined();
			expect(sheet.cellAt('A5').value).toBe('v2');
			expect(sheet.cellAt('B5')).toBeUndefined();
		});
		it('should clear target range if json is empty', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A4: 'v1', B4: 23, A5: 'v2', B5: 42 });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B5)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4')).toBeUndefined();
			expect(sheet.cellAt('B4')).toBeUndefined();
			expect(sheet.cellAt('A5')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
		});
		it('should not write over bounds of specified range', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 23, A2: 'v2', B2: 42 });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B4)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4').value).toBe(23);
			expect(sheet.cellAt('A5')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:B4,,false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4').value).toBe('v2');
			expect(sheet.cellAt('A5')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
		});
		it('should create a suitable target range if specified one contains only one cell', async () => {
			// start with an easy to get going
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 23, A2: 'v2', B2: 42 });
			createCellAt('A3', { formula: 'json.range(JSON(A1:B2),A4:A4)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4').value).toBe('v1');
			expect(sheet.cellAt('B4').value).toBe(23);
			expect(sheet.cellAt('A5').value).toBe('v2');
			expect(sheet.cellAt('B5').value).toBe(42);
			// do nested
			sheet.loadCells({
				A1: 'a',
				A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
				A3: { type: 'number', value: 1, level: 1},
				A4: { type: 'string', value: 'title', level: 2}, B4: 'Dr.',
				A5: { type: 'string', value: 'name', level: 2}, B5: 'Strange',
				A6: { type: 'number', value: 2, level: 1},
				A7: { type: 'string', value: 'person', level: 2},
				A8: { type: 'string', value: 'name', level: 3}, B8: 'foo',
				A9: { type: 'string', value: 'age', level: 3}, B9: 42,
				A10: { type: 'string', value: 'phones', level: 3},
				A11: { type: 'number', value: 0, level: 4}, B11: '800-123-4567',
				A12: { type: 'number', value: 1, level: 4},
				A13: { type: 'string', value: 'prefix', level: 5}, B13: '+49',
				A14: { type: 'string', value: 'number', level: 5}, B14: '1234-5678-9'
			});
			/* {
				"a": [
					"hello",
					{ "title": "Dr", "name": "Strange" },
					{
						"person": {
							"name": "foo",
							"age": 42,
							"phones": ["800-123-4567", { "prefix": "+49", "number": "1234-5678-9" }]
						}
					}
				]
			} */
			createCellAt('A20', { formula: 'json.range(JSON(A1:B14),A21:A21)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A20').value).toBe(true);
			expect(sheet.cellAt('A21').value).toBe('a');
			expect(sheet.cellAt('B21')).toBeUndefined();
			expect(sheet.cellAt('A22').value).toBe(0);
			expect(sheet.cellAt('B22').value).toBe('hello');
			expect(sheet.cellAt('A23').value).toBe(1);
			expect(sheet.cellAt('B23')).toBeUndefined();
			expect(sheet.cellAt('A24').value).toBe('title');
			expect(sheet.cellAt('B24').value).toBe('Dr.');
			expect(sheet.cellAt('A25').value).toBe('name');
			expect(sheet.cellAt('B25').value).toBe('Strange');
			expect(sheet.cellAt('A26').value).toBe(2);
			expect(sheet.cellAt('B26')).toBeUndefined();
			expect(sheet.cellAt('A27').value).toBe('person');
			expect(sheet.cellAt('B27')).toBeUndefined();
			expect(sheet.cellAt('A28').value).toBe('name');
			expect(sheet.cellAt('B28').value).toBe('foo');
			expect(sheet.cellAt('A29').value).toBe('age');
			expect(sheet.cellAt('B29').value).toBe(42);
			expect(sheet.cellAt('A30').value).toBe('phones');
			expect(sheet.cellAt('B30')).toBeUndefined();
			expect(sheet.cellAt('A31').value).toBe(0);
			expect(sheet.cellAt('B31').value).toBe('800-123-4567');
			expect(sheet.cellAt('A32').value).toBe(1);
			expect(sheet.cellAt('B32')).toBeUndefined();
			expect(sheet.cellAt('A33').value).toBe('prefix');
			expect(sheet.cellAt('B33').value).toBe('+49');
			expect(sheet.cellAt('A34').value).toBe('number');
			expect(sheet.cellAt('B34').value).toBe('1234-5678-9');
			// do nested with false direction!
			sheet.loadCells({
				A1: 'a',
				A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
				A3: { type: 'number', value: 1, level: 1},
				A4: { type: 'string', value: 'title', level: 2}, B4: 'Dr.',
				A5: { type: 'string', value: 'name', level: 2}, B5: 'Strange',
				A6: { type: 'number', value: 2, level: 1},
				A7: { type: 'string', value: 'person', level: 2},
				A8: { type: 'string', value: 'name', level: 3}, B8: 'foo',
				A9: { type: 'string', value: 'age', level: 3}, B9: 42,
				A10: { type: 'string', value: 'phones', level: 3},
				A11: { type: 'number', value: 0, level: 4}, B11: '800-123-4567',
				A12: { type: 'number', value: 1, level: 4},
				A13: { type: 'string', value: 'prefix', level: 5}, B13: '+49',
				A14: { type: 'string', value: 'number', level: 5}, B14: '1234-5678-9'
			});
			createCellAt('A20', { formula: 'json.range(JSON(A1:B14),A21:A21,,false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A20').value).toBe(true);
			expect(sheet.cellAt('A21').value).toBe('a');
			expect(sheet.cellAt('A22')).toBeUndefined();
			expect(sheet.cellAt('B21').value).toBe(0);
			expect(sheet.cellAt('B22').value).toBe('hello');
			expect(sheet.cellAt('C21').value).toBe(1);
			expect(sheet.cellAt('C22')).toBeUndefined();
			expect(sheet.cellAt('D21').value).toBe('title');
			expect(sheet.cellAt('D22').value).toBe('Dr.');
			expect(sheet.cellAt('E21').value).toBe('name');
			expect(sheet.cellAt('E22').value).toBe('Strange');
			expect(sheet.cellAt('F21').value).toBe(2);
			expect(sheet.cellAt('F22')).toBeUndefined();
			expect(sheet.cellAt('G21').value).toBe('person');
			expect(sheet.cellAt('G22')).toBeUndefined();
			expect(sheet.cellAt('H21').value).toBe('name');
			expect(sheet.cellAt('H22').value).toBe('foo');
			expect(sheet.cellAt('I21').value).toBe('age');
			expect(sheet.cellAt('I22').value).toBe(42);
			expect(sheet.cellAt('J21').value).toBe('phones');
			expect(sheet.cellAt('J22')).toBeUndefined();
			expect(sheet.cellAt('K21').value).toBe(0);
			expect(sheet.cellAt('K22').value).toBe('800-123-4567');
			expect(sheet.cellAt('L21').value).toBe(1);
			expect(sheet.cellAt('L22')).toBeUndefined();
			expect(sheet.cellAt('M21').value).toBe('prefix');
			expect(sheet.cellAt('M22').value).toBe('+49');
			expect(sheet.cellAt('N21').value).toBe('number');
			expect(sheet.cellAt('N22').value).toBe('1234-5678-9');
		});
	});
	describe('type array', () => {
		it('should write array() encoded JSON vertically by default', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 0, C1: 1, A2: 'v2', B2: 2, C2: 3 });
			createCellAt('A4', { formula: 'json.range(array(A1:C1),A5:A7,"array")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('A6').value).toBe(0);
			expect(sheet.cellAt('A7').value).toBe(1);
			createCellAt('A4', { formula: 'json.range(array(A1:A2),A5:A6,"array")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('A6').value).toBe('v2');
			createCellAt('A4', { formula: 'json.range(array(A1:C2),A5:B7,"array")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 0, 1]);
			expect(sheet.cellAt('A6').value).toEqual(['v2', 2, 3]);
			expect(sheet.cellAt('A7')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('B7')).toBeUndefined();
			// read in by column
			createCellAt('A4', { formula: 'json.range(array(A1:C2,false),A5:B7,"array")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 'v2']);
			expect(sheet.cellAt('A6').value).toEqual([0, 2]);
			expect(sheet.cellAt('A7').value).toEqual([1, 3]);
			expect(sheet.cellAt('B5')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('B7')).toBeUndefined();
		});
		it('should handle objects in array() encoded JSON as simple values', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({
				A1: 'v1', B1: 0, C1: 1,
				A2: 'v2', B2: 2, C2: 3,
				A3: 'v3', B3: { formula: 'JSON(A1:B1)' }
			});
			createCellAt('A4', { formula: 'json.range(array(A1:C3),A5:A7,"array")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 0, 1]);
			expect(sheet.cellAt('A6').value).toEqual(['v2', 2, 3]);
			expect(sheet.cellAt('A7').value).toEqual(['v3', { v1: 0 }, '']);
		});
		it('should write array() encoded JSON horizontally if direction is set to false', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 0, C1: 1, A2: 'v2', B2: 2, C2: 3 });
			createCellAt('A4', { formula: 'json.range(array(A1:C1),A5:C5,"array",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe(0);
			expect(sheet.cellAt('C5').value).toBe(1);
			createCellAt('A4', { formula: 'json.range(array(A1:A2),A5:B5,"array",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe('v2');
			createCellAt('A4', { formula: 'json.range(array(A1:C2),A5:C6,"array",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 0, 1]);
			expect(sheet.cellAt('B5').value).toEqual(['v2', 2, 3]);
			expect(sheet.cellAt('C5')).toBeUndefined();
			expect(sheet.cellAt('A6')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('C6')).toBeUndefined();
			// read in by column
			createCellAt('A4', { formula: 'json.range(array(A1:C2, false),A5:C6,"array",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 'v2']);
			expect(sheet.cellAt('B5').value).toEqual([0, 2]);
			expect(sheet.cellAt('C5').value).toEqual([1, 3]);
			expect(sheet.cellAt('A6')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('C6')).toBeUndefined();
		});
		it('should clear target range if array() encoded JSON is empty', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A4: 'v1', B4: 23, A5: 'v2', B5: 42 });
			createCellAt('A3', { formula: 'json.range(array(A1:B2),A4:B5,"array")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			// bug in array? we get empty strings!!
			expect(sheet.cellAt('A4').value).toEqual(['','']);
			expect(sheet.cellAt('A5').value).toEqual(['','']);
			expect(sheet.cellAt('B4')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
		});
		it('should bound decoding of array() encoded JSON by target range', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 0, C1: 1, A2: 'v2', B2: 2, C2: 3, A3: 'v3', B3: 4, C3: 5 });
			createCellAt('A4', { formula: 'json.range(array(A1:C3),A5:B6,"array")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 0, 1]);
			expect(sheet.cellAt('A6').value).toEqual(['v2', 2, 3]);
			expect(sheet.cellAt('B5')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();

			sheet.loadCells({ A1: 'v1', B1: 0, C1: 1, A2: 'v2', B2: 2, C2: 3, A3: 'v3', B3: 4, C3: 5 });
			createCellAt('A4', { formula: 'json.range(array(A1:C2),A5:B6,"array",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 0, 1]);
			expect(sheet.cellAt('B5').value).toEqual(['v2', 2, 3]);
			expect(sheet.cellAt('A6')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
		});
		it('should create a suitable target range if specified one contains only one cell', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 0, C1: 1, A2: 'v2', B2: 2, C2: 3 });
			createCellAt('A4', { formula: 'json.range(array(A1:C2),A5:A5,"array")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 0, 1]);
			expect(sheet.cellAt('A6').value).toEqual(['v2', 2, 3]);
			expect(sheet.cellAt('A7')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('B7')).toBeUndefined();
			// read in by column
			sheet.loadCells({ A1: 'v1', B1: 0, C1: 1, A2: 'v2', B2: 2, C2: 3 });
			createCellAt('A4', { formula: 'json.range(array(A1:C2,false),A5:A5,"array")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 'v2']);
			expect(sheet.cellAt('A6').value).toEqual([0, 2]);
			expect(sheet.cellAt('A7').value).toEqual([1, 3]);
			expect(sheet.cellAt('B5')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('B7')).toBeUndefined();
			// again but with direction to false
			sheet.loadCells({ A1: 'v1', B1: 0, C1: 1, A2: 'v2', B2: 2, C2: 3 });
			createCellAt('A4', { formula: 'json.range(array(A1:C2),A5:A5,"array",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 0, 1]);
			expect(sheet.cellAt('B5').value).toEqual(['v2', 2, 3]);
			expect(sheet.cellAt('C5')).toBeUndefined();
			expect(sheet.cellAt('A6')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('C6')).toBeUndefined();
			sheet.loadCells({ A1: 'v1', B1: 0, C1: 1, A2: 'v2', B2: 2, C2: 3 });
			createCellAt('A4', { formula: 'json.range(array(A1:C2,false),A5:A5,"array",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toEqual(['v1', 'v2']);
			expect(sheet.cellAt('B5').value).toEqual([0, 2]);
			expect(sheet.cellAt('C5').value).toEqual([1, 3]);
			expect(sheet.cellAt('A6')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('C6')).toBeUndefined();
		});
	});
	describe('type dictionary', () => {
		it('should write dictionary() encoded JSON to specified range horizontally by default', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ 
				A1: 'v1', B1: 'v2', C1: 'v3', D1: 'v4',
				A2: 0, B2: 1, C2: 2, D2: 3,
				A3: 4, B3: 5, C3: 6, D3: 7
			 });
			createCellAt('A4', { formula: 'json.range(dictionary(A1:D3,true),A5:D7,"dictionary")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe('v2');
			expect(sheet.cellAt('C5').value).toBe('v3');
			expect(sheet.cellAt('D5').value).toBe('v4');
			expect(sheet.cellAt('A6').value).toBe(0);
			expect(sheet.cellAt('B6').value).toBe(1);
			expect(sheet.cellAt('C6').value).toBe(2);
			expect(sheet.cellAt('D6').value).toBe(3);
			expect(sheet.cellAt('A7').value).toBe(4);
			expect(sheet.cellAt('B7').value).toBe(5);
			expect(sheet.cellAt('C7').value).toBe(6);
			expect(sheet.cellAt('D7').value).toBe(7);
			sheet.loadCells({
				A1: 'v1', B1: 0, C1: 1,
				A2: 'v2', B2: 2, C2: 3,
				A3: 'v3', B3: 4, C3: 5,
				A4: 'v4', B4: 6, C4: 7
			});
			createCellAt('A5', { formula: 'json.range(dictionary(A1:C4,false),A6:D8,"dictionary")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A5').value).toBe(true);
			expect(sheet.cellAt('A6').value).toBe('v1');
			expect(sheet.cellAt('B6').value).toBe('v2');
			expect(sheet.cellAt('C6').value).toBe('v3');
			expect(sheet.cellAt('D6').value).toBe('v4');
			expect(sheet.cellAt('A7').value).toBe(0);
			expect(sheet.cellAt('B7').value).toBe(2);
			expect(sheet.cellAt('C7').value).toBe(4);
			expect(sheet.cellAt('D7').value).toBe(6);
			expect(sheet.cellAt('A8').value).toBe(1);
			expect(sheet.cellAt('B8').value).toBe(3);
			expect(sheet.cellAt('C8').value).toBe(5);
			expect(sheet.cellAt('D8').value).toBe(7);
		});
		it('should write dictionary() encoded JSON to specified range vertically', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ 
				A1: 'v1', B1: 'v2', C1: 'v3', D1: 'v4',
				A2: 0, B2: 1, C2: 2, D2: 3,
				A3: 4, B3: 5, C3: 6, D3: 7
			 });
			createCellAt('A4', { formula: 'json.range(dictionary(A1:D3,true),A5:C8,"dictionary", false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe(0);
			expect(sheet.cellAt('C5').value).toBe(4);
			expect(sheet.cellAt('A6').value).toBe('v2');
			expect(sheet.cellAt('B6').value).toBe(1);
			expect(sheet.cellAt('C6').value).toBe(5);
			expect(sheet.cellAt('A7').value).toBe('v3');
			expect(sheet.cellAt('B7').value).toBe(2);
			expect(sheet.cellAt('C7').value).toBe(6);
			expect(sheet.cellAt('A8').value).toBe('v4');
			expect(sheet.cellAt('B8').value).toBe(3);
			expect(sheet.cellAt('C8').value).toBe(7);
			sheet.loadCells({
				A1: 'v1', B1: 0, C1: 1,
				A2: 'v2', B2: 2, C2: 3,
				A3: 'v3', B3: 4, C3: 5,
				A4: 'v4', B4: 6, C4: 7
			});
			createCellAt('A5', { formula: 'json.range(dictionary(A1:C4,false),A6:C9,"dictionary",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A5').value).toBe(true);
			expect(sheet.cellAt('A6').value).toBe('v1');
			expect(sheet.cellAt('B6').value).toBe(0);
			expect(sheet.cellAt('C6').value).toBe(1);
			expect(sheet.cellAt('A7').value).toBe('v2');
			expect(sheet.cellAt('B7').value).toBe(2);
			expect(sheet.cellAt('C7').value).toBe(3);
			expect(sheet.cellAt('A8').value).toBe('v3');
			expect(sheet.cellAt('B8').value).toBe(4);
			expect(sheet.cellAt('C8').value).toBe(5);
			expect(sheet.cellAt('A9').value).toBe('v4');
			expect(sheet.cellAt('B9').value).toBe(6);
			expect(sheet.cellAt('C9').value).toBe(7);
		});
		it('should clear target range if dictionary() encoded JSON is empty', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 'v2', C1: 'v3', A2: 0, B2: 1, C2: 2 });
			createCellAt('A4', { formula: 'json.range(dictionary(A5:C6, true),A1:C2,"dictionary")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A1')).toBeUndefined();
			expect(sheet.cellAt('B1')).toBeUndefined();
			expect(sheet.cellAt('C1')).toBeUndefined();
			expect(sheet.cellAt('A2')).toBeUndefined();
			expect(sheet.cellAt('B2')).toBeUndefined();
			expect(sheet.cellAt('C2')).toBeUndefined();
			sheet.loadCells({ A1: 'v1', B1: 'v2', C1: 'v3', A2: 0, B2: 1, C2: 2 });
			createCellAt('A4', { formula: 'json.range(dictionary(A5:B6),A1:C2,"dictionary",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A1')).toBeUndefined();
			expect(sheet.cellAt('B1')).toBeUndefined();
			expect(sheet.cellAt('C1')).toBeUndefined();
			expect(sheet.cellAt('A2')).toBeUndefined();
			expect(sheet.cellAt('B2')).toBeUndefined();
			expect(sheet.cellAt('C2')).toBeUndefined();
		});
		it('should bound decoding of dictionary() encoded JSON by target range', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 'v2', C1: 'v3', A2: 0, B2: 1, C2: 2 });
			createCellAt('A4', { formula: 'json.range(dictionary(A1:C2, true),A5:C5,"dictionary")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe('v2');
			expect(sheet.cellAt('C5').value).toBe('v3');
			expect(sheet.cellAt('A6')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('C6')).toBeUndefined();
			sheet.loadCells({ A1: 'v1', B1: 0, A2: 'v2', B2: 1, A3: 'v3', B3: 2 });
			createCellAt('A4', { formula: 'json.range(dictionary(A1:B3),A5:B5,"dictionary")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe('v2');
			expect(sheet.cellAt('C5')).toBeUndefined();
			expect(sheet.cellAt('A6')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('C6')).toBeUndefined();
		});
		it('should create a suitable target range if specified one contains only one cell', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ 
				A1: 'v1', B1: 'v2', C1: 'v3', D1: 'v4',
				A2: 0, B2: 1, C2: 2, D2: 3,
				A3: 4, B3: 5, C3: 6, D3: 7
			 });
			createCellAt('A4', { formula: 'json.range(dictionary(A1:D3,true),A5:A5,"dictionary")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe('v2');
			expect(sheet.cellAt('C5').value).toBe('v3');
			expect(sheet.cellAt('D5').value).toBe('v4');
			expect(sheet.cellAt('A6').value).toBe(0);
			expect(sheet.cellAt('B6').value).toBe(1);
			expect(sheet.cellAt('C6').value).toBe(2);
			expect(sheet.cellAt('D6').value).toBe(3);
			expect(sheet.cellAt('A7').value).toBe(4);
			expect(sheet.cellAt('B7').value).toBe(5);
			expect(sheet.cellAt('C7').value).toBe(6);
			expect(sheet.cellAt('D7').value).toBe(7);
			createCellAt('A4', { formula: 'json.range(dictionary(A1:D3,true),A5,"dictionary", false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe(0);
			expect(sheet.cellAt('C5').value).toBe(4);
			expect(sheet.cellAt('A6').value).toBe('v2');
			expect(sheet.cellAt('B6').value).toBe(1);
			expect(sheet.cellAt('C6').value).toBe(5);
			expect(sheet.cellAt('A7').value).toBe('v3');
			expect(sheet.cellAt('B7').value).toBe(2);
			expect(sheet.cellAt('C7').value).toBe(6);
			expect(sheet.cellAt('A8').value).toBe('v4');
			expect(sheet.cellAt('B8').value).toBe(3);
			expect(sheet.cellAt('C8').value).toBe(7);
			sheet.loadCells({
				A1: 'v1', B1: 0, C1: 1,
				A2: 'v2', B2: 2, C2: 3,
				A3: 'v3', B3: 4, C3: 5,
				A4: 'v4', B4: 6, C4: 7
			});
			createCellAt('A5', { formula: 'json.range(dictionary(A1:C4,false),A6,"dictionary")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A5').value).toBe(true);
			expect(sheet.cellAt('A6').value).toBe('v1');
			expect(sheet.cellAt('B6').value).toBe('v2');
			expect(sheet.cellAt('C6').value).toBe('v3');
			expect(sheet.cellAt('D6').value).toBe('v4');
			expect(sheet.cellAt('A7').value).toBe(0);
			expect(sheet.cellAt('B7').value).toBe(2);
			expect(sheet.cellAt('C7').value).toBe(4);
			expect(sheet.cellAt('D7').value).toBe(6);
			expect(sheet.cellAt('A8').value).toBe(1);
			expect(sheet.cellAt('B8').value).toBe(3);
			expect(sheet.cellAt('C8').value).toBe(5);
			expect(sheet.cellAt('D8').value).toBe(7);
			createCellAt('A5', { formula: 'json.range(dictionary(A1:C4,false),A6:A6,"dictionary",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A5').value).toBe(true);
			expect(sheet.cellAt('A6').value).toBe('v1');
			expect(sheet.cellAt('B6').value).toBe(0);
			expect(sheet.cellAt('C6').value).toBe(1);
			expect(sheet.cellAt('A7').value).toBe('v2');
			expect(sheet.cellAt('B7').value).toBe(2);
			expect(sheet.cellAt('C7').value).toBe(3);
			expect(sheet.cellAt('A8').value).toBe('v3');
			expect(sheet.cellAt('B8').value).toBe(4);
			expect(sheet.cellAt('C8').value).toBe(5);
			expect(sheet.cellAt('A9').value).toBe('v4');
			expect(sheet.cellAt('B9').value).toBe(6);
			expect(sheet.cellAt('C9').value).toBe(7);
		});
	});
	describe('type range', () => {
		it('should write range() encoded JSON', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 0, A2: 'v2', B2: 1, A3: 'v3', B3: 2 });
			createCellAt('A4', { formula: 'json.range(range(A1:B3),A5:B7,"range")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe(0);
			expect(sheet.cellAt('A6').value).toBe('v2');
			expect(sheet.cellAt('B6').value).toBe(1);
			expect(sheet.cellAt('A7').value).toBe('v3');
			expect(sheet.cellAt('B7').value).toBe(2);
			sheet.loadCells({ A1: 'v1', B1: 0, C1: 1, A2: 'v2', B2: 2, C2: 3 });
			createCellAt('A4', { formula: 'json.range(range(A1:C2),A5:C6,"range")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe(0);
			expect(sheet.cellAt('C5').value).toBe(1);
			expect(sheet.cellAt('A6').value).toBe('v2');
			expect(sheet.cellAt('B6').value).toBe(2);
			expect(sheet.cellAt('C6').value).toBe(3);
		});
		it('should write range() encoded JSON horizontally if direction is set to false', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 0, A2: 'v2', B2: 1, A3: 'v3', B3: 2 });
			createCellAt('A4', { formula: 'json.range(range(A1:B3),A5:C6,"range",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe('v2');
			expect(sheet.cellAt('C5').value).toBe('v3');
			expect(sheet.cellAt('A6').value).toBe(0);
			expect(sheet.cellAt('B6').value).toBe(1);
			expect(sheet.cellAt('C6').value).toBe(2);
			sheet.loadCells({ A1: 'v1', B1: 0, C1: 1, A2: 'v2', B2: 2, C2: 3 });
			createCellAt('A4', { formula: 'json.range(range(A1:C2),A5:B7,"range",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe('v2');
			expect(sheet.cellAt('A6').value).toBe(0);
			expect(sheet.cellAt('B6').value).toBe(2);
			expect(sheet.cellAt('A7').value).toBe(1);
			expect(sheet.cellAt('B7').value).toBe(3);
		});
		it('should clear target range if range() encoded JSON is empty', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A4: 'v1', B4: 23, A5: 'v2', B5: 42 });
			createCellAt('A3', { formula: 'json.range(range(A1:B2),A4:B5,"range")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(sheet.cellAt('A4')).toBeUndefined();
			expect(sheet.cellAt('B4')).toBeUndefined();
			expect(sheet.cellAt('A5')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
		});
		it('should bound decoding of range() encoded JSON by target range', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 0, A2: 'v2', B2: 1, A3: 'v3', B3: 2 });
			createCellAt('A4', { formula: 'json.range(range(A1:B3),A5:B6,"range")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe(0);
			expect(sheet.cellAt('A6').value).toBe('v2');
			expect(sheet.cellAt('B6').value).toBe(1);
			expect(sheet.cellAt('A7')).toBeUndefined();
			expect(sheet.cellAt('B7')).toBeUndefined();
			sheet.loadCells({ A1: 'v1', B1: 0, A2: 'v2', B2: 1, A3: 'v3', B3: 2 });
			createCellAt('A4', { formula: 'json.range(range(A1:B3),A5:A7,"range")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5')).toBeUndefined();
			expect(sheet.cellAt('A6').value).toBe('v2');
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('A7').value).toBe('v3');
			expect(sheet.cellAt('B7')).toBeUndefined();
			sheet.loadCells({ A1: 'v1', B1: 0, A2: 'v2', B2: 1, A3: 'v3', B3: 2 });
			createCellAt('A4', { formula: 'json.range(range(A1:B3),A5:C5,"range", false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe('v2');
			expect(sheet.cellAt('C5').value).toBe('v3');
			expect(sheet.cellAt('A6')).toBeUndefined();
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('C6')).toBeUndefined();
			sheet.loadCells({ A1: 'v1', B1: 0, A2: 'v2', B2: 1, A3: 'v3', B3: 2 });
			createCellAt('A4', { formula: 'json.range(range(A1:B3),A5:B6,"range",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe('v2');
			expect(sheet.cellAt('C5')).toBeUndefined();
			expect(sheet.cellAt('A6').value).toBe(0);
			expect(sheet.cellAt('B6').value).toBe(1);
			expect(sheet.cellAt('C6')).toBeUndefined();
		});
		it('should create a suitable target range if specified one contains only one cell', async () => {
			const { machine, sheet } = setup();
			sheet.loadCells({ A1: 'v1', B1: 0, A2: 'v2', B2: 1, A3: 'v3', B3: 2 });
			createCellAt('A4', { formula: 'json.range(range(A1:B3),A5:A5,"range")' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(true);
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe(0);
			expect(sheet.cellAt('A6').value).toBe('v2');
			expect(sheet.cellAt('B6').value).toBe(1);
			expect(sheet.cellAt('A7').value).toBe('v3');
			expect(sheet.cellAt('B7').value).toBe(2);
			sheet.loadCells({ A1: 'v1', B1: 0, A2: 'v2', B2: 1, A3: 'v3', B3: 2 });
			createCellAt('A4', { formula: 'json.range(range(A1:B3),A5:A5,"range",false)' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A5').value).toBe('v1');
			expect(sheet.cellAt('B5').value).toBe('v2');
			expect(sheet.cellAt('C5').value).toBe('v3');
			expect(sheet.cellAt('A6').value).toBe(0);
			expect(sheet.cellAt('B6').value).toBe(1);
			expect(sheet.cellAt('C6').value).toBe(2);
		});	
	});
});