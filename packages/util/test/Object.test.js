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

const { ObjectUtil } = require('..');

describe('ObjectUtil', () => {
	describe('isObject', () => {
		it(`should return true for an objects`, () => {
			expect(ObjectUtil.isObject({})).toBe(true);
			expect(ObjectUtil.isObject({ some: 'value' })).toBe(true);
			expect(ObjectUtil.isObject(new Date())).toBe(true);
		});
		it(`should return false for null and undefined`, () => {
			expect(ObjectUtil.isObject(null)).toBe(false);
			expect(ObjectUtil.isObject(undefined)).toBe(false);
		});
		it(`should return false for all other data types`, () => {
			expect(ObjectUtil.isObject('')).toBe(false);
			expect(ObjectUtil.isObject('not an object')).toBe(false);
			expect(ObjectUtil.isObject(0)).toBe(false);
			expect(ObjectUtil.isObject(NaN)).toBe(false);
			expect(ObjectUtil.isObject(-1111)).toBe(false);
			expect(ObjectUtil.isObject(42.5)).toBe(false);
			expect(ObjectUtil.isObject(() => {})).toBe(false);
			expect(ObjectUtil.isObject(true)).toBe(false);
		});
	});
	describe('hasKeys', () => {
		it(`should return false for non object arguments`, () => {
			expect(ObjectUtil.hasKeys('not an object', ['key'])).toBe(false);
			expect(ObjectUtil.hasKeys('', ['key'])).toBe(false);
			expect(ObjectUtil.hasKeys('not an object', ['key'])).toBe(false);
			expect(ObjectUtil.hasKeys(0, ['key'])).toBe(false);
			expect(ObjectUtil.hasKeys(NaN, ['key'])).toBe(false);
			expect(ObjectUtil.hasKeys(-1111, ['key'])).toBe(false);
			expect(ObjectUtil.hasKeys(42.5, ['key'])).toBe(false);
			expect(ObjectUtil.hasKeys(() => {}, ['key'])).toBe(false);
			expect(ObjectUtil.hasKeys(true, ['key'])).toBe(false);
		});
		it(`should return false if not all keys are present`, () => {
			expect(ObjectUtil.hasKeys({ key: 'value' }, ['key', 'otherKey'])).toBe(false);
			expect(ObjectUtil.hasKeys({ otherKey: 1 }, ['key', 'otherKey'])).toBe(false);
		});
		it(`should return true if all keys are present`, () => {
			expect(ObjectUtil.hasKeys({ key: 'value', otherKey: '' }, ['key', 'otherKey'])).toBe(true);
			expect(ObjectUtil.hasKeys({ key: false, otherKey: 1 }, ['key', 'otherKey'])).toBe(true);
			expect(ObjectUtil.hasKeys({ key: () => {}, otherKey: NaN }, ['key', 'otherKey'])).toBe(true);
		});
	});
	describe('hasKeysNonEmpty', () => {
		it(`should return false for non object arguments`, () => {
			expect(ObjectUtil.hasKeysNonEmpty('not an object', ['key'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty('', ['key'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty('not an object', ['key'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty(0, ['key'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty(NaN, ['key'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty(-1111, ['key'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty(42.5, ['key'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty(() => {}, ['key'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty(true, ['key'])).toBe(false);
		});
		it(`should return false if not all keys are present`, () => {
			expect(ObjectUtil.hasKeysNonEmpty({ key: 'value' }, ['key', 'otherKey'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty({ otherKey: 1 }, ['key', 'otherKey'])).toBe(false);
		});
		it(`should return true if all keys are present`, () => {
			expect(ObjectUtil.hasKeysNonEmpty({ key: 'value', otherKey: 'pew' }, ['key', 'otherKey'])).toBe(true);
			expect(ObjectUtil.hasKeysNonEmpty({ key: false, otherKey: 1 }, ['key', 'otherKey'])).toBe(true);
			expect(ObjectUtil.hasKeysNonEmpty({ key: () => {}, otherKey: NaN }, ['key', 'otherKey'])).toBe(true);
		});
		it(`should return false if all keys are present but empty string/null/undefined`, () => {
			expect(ObjectUtil.hasKeysNonEmpty({ key: 'value', otherKey: null }, ['key', 'otherKey'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty({ key: false, otherKey: '' }, ['key', 'otherKey'])).toBe(false);
			expect(ObjectUtil.hasKeysNonEmpty({ key: () => {}, otherKey: undefined }, ['key', 'otherKey'])).toBe(false);
		});
	});
});
