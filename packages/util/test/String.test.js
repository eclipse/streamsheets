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

const { StringUtil } = require('..');

describe('StringUtil', () => {
	describe('capitalize', () => {
		it(`should capitalize a string`, () => {
			expect(StringUtil.capitalize('a')).toBe('A');
			expect(StringUtil.capitalize('hello')).toBe('Hello');
			expect(StringUtil.capitalize('?')).toBe('?');
			expect(StringUtil.capitalize('ü')).toBe('Ü');
			expect(StringUtil.capitalize('å')).toBe('Å');
			expect(StringUtil.capitalize('1')).toBe('1');
			expect(StringUtil.capitalize('')).toBe('');
		});
		it(`should leave capitalized strings unchanged`, () => {
			expect(StringUtil.capitalize('A')).toBe('A');
			expect(StringUtil.capitalize('ALL')).toBe('ALL');
			expect(StringUtil.capitalize('Not all')).toBe('Not all');
		});
	});
	describe('unwrap', () => {
		it(`should strip any quotes from beginning and end of a string`, () => {
			expect(StringUtil.unwrap(`'a'`)).toBe('a');
			expect(StringUtil.unwrap(`"hello`)).toBe('hello');
			expect(StringUtil.unwrap('?"')).toBe('?');
			expect(StringUtil.unwrap('““öl””')).toBe('öl');
			expect(StringUtil.unwrap('')).toBe('');
		});
		it(`should not strip quots form the middle`, () => {
			expect(StringUtil.unwrap('some `" text')).toBe('some `" text');
			expect(StringUtil.unwrap(`another' “öl” `)).toBe(`another' “öl” `);
			expect(StringUtil.unwrap('_"`´”“_')).toBe('_"`´”“_');
		});
	});
});
