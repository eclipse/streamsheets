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

const { ArrayUtil } = require('..');

describe('StringUtil', () => {
	describe('unique', () => {
		it(`remove duplicates from an array`, () => {
			const result1 = ArrayUtil.unique([1, 2, 3, 1]);
			expect(result1).toHaveLength(3);
			expect(result1).toEqual([1, 2, 3]);
			const result2 = ArrayUtil.unique(['test', 'hallo', 'test', 'test', 'hallo']);
			expect(result2).toHaveLength(2);
			expect(result2).toEqual(['test', 'hallo']);
			const result3 = ArrayUtil.unique([false, '', null, false, '', null]);
			expect(result3).toHaveLength(3);
			expect(result3).toEqual([false, '', null]);
		});
	});
	describe('intersperse', () => {
		it('should do nothing for empty and one length arrays', () => {
			const result1 = ArrayUtil.intersperse([], 'hello');
			expect(result1).toEqual([]);
			const result2 = ArrayUtil.intersperse(['just one'], 'hello');
			expect(result2).toEqual(['just one']);
		});
		it(`insert an item inbetween array elements`, () => {
			const result1 = ArrayUtil.intersperse([1, 2, 3, 4], 'test');
			expect(result1).toEqual([1, 'test', 2, 'test', 3, 'test', 4]);
		});
		it(`should allow passing an item generator function`, () => {
			const result1 = ArrayUtil.intersperse([1, 2, 3, 4], (index) => `$${index}`);
			expect(result1).toEqual([1, '$0', 2, '$1', 3, '$2', 4]);
		});
	});
	describe('partition', () => {
		it(`partition should parition an array`, () => {
			const result1 = ArrayUtil.partition([1, 2, 3, 4], (x) => x % 2);
			expect(result1).toEqual({
				1: [1, 3],
				0: [2, 4]
			});
			const result2 = ArrayUtil.partition(['just', 'some', 'words'], (x) => x);
			expect(result2).toEqual({
				just: ['just'],
				some: ['some'],
				words: ['words']
			});
		});
	});
	describe('updateWhere', () => {
		it(`should return a new array with all matching elements replaced`, () => {
			const result1 = ArrayUtil.updateWhere([1, 2, 3, 4], 'three', (x) => x === 3);
			expect(result1).toEqual([1, 2, 'three', 4]);
			const result2 = ArrayUtil.updateWhere(['just', 'some', 'sweet', 'words'], null, (x) => x.startsWith('s'));
			expect(result2).toEqual(['just', null, null, 'words']);
		});
		it(`should not change the original array`, () => {
			const data = [1, 2, 3, 4];
			const result1 = ArrayUtil.updateWhere(data, 'three', (x) => x === 3);
			expect(result1).toEqual([1, 2, 'three', 4]);
			expect(data).toEqual(data);
		});
		it(`should add a new element to the end if no elements matched`, () => {
			const result1 = ArrayUtil.updateWhere([1, 2, 3, 4], 'five', (x) => x === 5);
			expect(result1).toEqual([1, 2, 3, 4, 'five']);
		});
		it(`should NOT add a new element to the end if no elements matchd with upsert = false`, () => {
			const result1 = ArrayUtil.updateWhere([1, 2, 3, 4], 'five', (x) => x === 5, false);
			expect(result1).toEqual([1, 2, 3, 4]);
		});
	});
});
