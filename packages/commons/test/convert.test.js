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
const { convert } = require('..');

describe('convert', () => {
	describe('toBoolean', () => {
		it('should convert "FALSE" to false', () => {
			expect(convert.toBoolean('false')).toBe(false);
			expect(convert.toBoolean('FALSE')).toBe(false);
			expect(convert.toBoolean('FaLsE')).toBe(false);
		});
		it('should convert false or 0 to false', () => {
			expect(convert.toBoolean(0)).toBe(false);
			expect(convert.toBoolean(false)).toBe(false);
		});
		it('should convert "TRUE" to true', () => {
			expect(convert.toBoolean('true')).toBe(true);
			expect(convert.toBoolean('TRUE')).toBe(true);
			expect(convert.toBoolean('tRuE')).toBe(true);
		});
		it('should convert all numbers not equal 0 to true', () => {
			expect(convert.toBoolean(-1)).toBe(true);
			expect(convert.toBoolean(1)).toBe(true);
			expect(convert.toBoolean(Number.MAX_VALUE)).toBe(true);
			expect(convert.toBoolean(Number.MAX_SAFE_INTEGER)).toBe(true);
			expect(convert.toBoolean(Number.MIN_VALUE)).toBe(true);
			expect(convert.toBoolean(Number.MIN_SAFE_INTEGER)).toBe(true);
		});
		it('should convert true to true', () => {
			expect(convert.toBoolean(true)).toBe(true);
		});
		it('should return undefined for all strings not equal to "TRUE" or "FALSE"', () => {
			expect(convert.toBoolean()).toBeUndefined();
			expect(convert.toBoolean('')).toBeUndefined();
			expect(convert.toBoolean('hello')).toBeUndefined();
			expect(convert.toBoolean('world or others')).toBeUndefined();
		});
		it('should return undefined for all strings and numbers for just converting boolean', () => {
			const strictBool = convert.from().boolean.toBoolean;
			expect(strictBool(-1)).toBeUndefined();
			expect(strictBool(1)).toBeUndefined();
			expect(strictBool(0)).toBeUndefined();
			expect(strictBool()).toBeUndefined();
			expect(strictBool('')).toBeUndefined();
			expect(strictBool('true')).toBeUndefined();
			expect(strictBool('false')).toBeUndefined();
			expect(strictBool('42')).toBeUndefined();
			expect(strictBool('1')).toBeUndefined();
		});
	});
	describe('toNumber', () => {
		it('should convert boolean values to number', () => {
			expect(convert.toNumber(true)).toBe(1);
			expect(convert.toNumber(false)).toBe(0);
		});
		it('should convert string values to number', () => {
			expect(convert.toNumber('')).toBe(0);
			expect(convert.toNumber('0')).toBe(0);
			expect(convert.toNumber('1')).toBe(1);
			expect(convert.toNumber('1.234')).toBe(1.234);
			expect(convert.toNumber('-0.1234')).toBe(-0.1234);
		});
		it('should return undefined for all string values which do not represent a number', () => {
			expect(convert.toNumber('1,2')).toBeUndefined();
			expect(convert.toNumber('hello')).toBeUndefined();
			expect(convert.toNumber('$')).toBeUndefined();
		});
		it('should simply return number for all numbers', () => {
			expect(convert.toNumber(0)).toBe(0);
			expect(convert.toNumber(1)).toBe(1);
			expect(convert.toNumber(-12.23)).toBe(-12.23);
		});
		it('should return undefined for all strings and booleans for just converting numbers', () => {
			const strictNumber = convert.from().number.toNumber;
			expect(strictNumber(true)).toBeUndefined();
			expect(strictNumber(false)).toBeUndefined();
			expect(strictNumber()).toBeUndefined();
			expect(strictNumber('')).toBeUndefined();
			expect(strictNumber('true')).toBeUndefined();
			expect(strictNumber('false')).toBeUndefined();
			expect(strictNumber('1')).toBeUndefined();
			expect(strictNumber('-123')).toBeUndefined();
		});
	});
	describe('toString', () => {
		it('should convert boolean values to string', () => {
			expect(convert.toString(true)).toBe('true');
			expect(convert.toString(false)).toBe('false');
		});
		it('should convert number values to string', () => {
			expect(convert.toString(0)).toBe('0');
			expect(convert.toString(1)).toBe('1');
			expect(convert.toString(1.234)).toBe('1.234');
			expect(convert.toString(-0.1234)).toBe('-0.1234');
		});
		it('should return undefined for undefined value', () => {
			expect(convert.toString()).toBeUndefined();
			expect(convert.toString(null)).toBeUndefined();
		});
		it('should simply return string for all strings', () => {
			expect(convert.toString('')).toBe('');
			expect(convert.toString('true')).toBe('true');
			expect(convert.toString('0')).toBe('0');
			expect(convert.toString('-12.23')).toBe('-12.23');
		});
		it('should return undefined for all numbers and booleans for just converting strings', () => {
			const strictString = convert.from().string.toString;
			expect(strictString(true)).toBeUndefined();
			expect(strictString(false)).toBeUndefined();
			expect(strictString()).toBeUndefined();
			expect(strictString(12)).toBeUndefined();
			expect(strictString(0)).toBeUndefined();
			expect(strictString(-56.67)).toBeUndefined();
		});
	});
});
