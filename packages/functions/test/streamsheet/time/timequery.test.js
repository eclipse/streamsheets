const { FunctionErrors } = require('@cedalo/error-codes');
const { createCellAt } = require('../../utilities');
const { newSheet } = require('./utils');

const ERROR = FunctionErrors.code;

describe('timequery', () => {
	describe('parameter mapping', () => {
		it(`should return ${ERROR.ARGS} if two few arguments are given`, () => {
			const sheet = newSheet();
			createCellAt('A3', { formula: 'time.query()' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.ARGS);
			createCellAt('A3', { formula: 'time.query(,)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if query is not a json`, () => {
			const sheet = newSheet();
			createCellAt('A1', { formula: 'time.store(JSON(B1:C1))' }, sheet);
			createCellAt('A3', { formula: 'time.query(A1,)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1, true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,"v1:1")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,42)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it('should accept multiple queries', () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'field', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2))' }, sheet);
			let cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.queries.length).toBe(1);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2))' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.queries.length).toBe(2);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2))' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.queries.length).toBe(3);
		});
		it('should identify interval parameter', () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'field', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2))' }, sheet);
			let cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			// default value signals no interval set
			expect(cell.term.interval).toBe(-1);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),)' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			// default value signals no interval set
			expect(cell.term.interval).toBe(-1);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),60)' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.interval).toBe(60);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2),1)' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.interval).toBe(1);
		});
		it(`should return ${ERROR.VALUE} for invalid interval parameter`, () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'field', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),"")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),"42")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),0)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),-12)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it('should identify range parameter', () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'field', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),1,A5:C6)' }, sheet);
			let cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.range.toString()).toBe('A5:C6');
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,A5:C6)' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.range.toString()).toBe('A5:C6');
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2),,A5:C6)' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.range.toString()).toBe('A5:C6');
		});
		it(`should return ${ERROR.VALUE} for invalid range parameter`, () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'field', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),1,true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,"r1:s2")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2),,42)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2),,)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(true);
		});
		it('should identify limit parameter', () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'field', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2))' }, sheet);
			let cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			// default value
			expect(cell.term.limit).toBe(500);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,)' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			// default value
			expect(cell.term.limit).toBe(500);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,60)' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.limit).toBe(60);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2),1,,1)' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.limit).toBe(1);
			// MIN_LIMIT is 1
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),1,,0)' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.limit).toBe(1);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,-1)' }, sheet);
			cell = sheet.cellAt('A3');
			expect(cell.value).toBe(true);
			expect(cell.term.limit).toBe(1);
		});
		it(`should return ${ERROR.VALUE} for invalid limit parameter`, () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'field', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,"")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,"42")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});



		// it(`should return ${ERROR.VALUE} if passed interval, target range or limt are invalid`, () => {
		// 	const sheet = newSheet();
		// 	createCellAt('A1', { formula: 'time.store(JSON(B1:C1))' }, sheet);
		// 	createCellAt('A3', { formula: 'time.query(A1, true)' }, sheet);
		// 	expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		// 	createCellAt('A3', { formula: 'time.query(A1,)' }, sheet);
		// 	expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		// 	createCellAt('A3', { formula: 'time.query(A1,"v1:1")' }, sheet);
		// 	expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		// 	createCellAt('A3', { formula: 'time.query(A1,42)' }, sheet);
		// 	expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		// });
		// it('should identify limit parameter', () => {

		// });
		// it('should identify target range parameter', () => {

		// });
	});

	// it('should be possible to aggregate values', () => {
	// 	parameter list of query jsons!
	// 	json = {
	// 		value: v1
	// 		aggregate: a predefined time aggregate methods
	// 		min: optional
	// 		max: optional
	// 	}
	// 	parameter: ? interval - optional
	// 	parameter: ? limit - optional
	// 	parameter: ? targetrange - optional
	// 	expect(false).toBe(true);
	// });
	// it('should be possible to aggregate values in intervals', () => {
	// 	expect(false).toBe(true);
	// });
	// it('should support ranges for values', () => {
	// 	expect(false).toBe(true);
	// });
	// it('should be possible to limit values', () => {
	// 	expect(false).toBe(true);
	// });
});
