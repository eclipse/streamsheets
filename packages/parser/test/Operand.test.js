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
const { StringOperand } = require('..');
const { isValidIdentifier:isValidReferenceIdentifier } = require('..').Reference;

describe('isValidRefIdentifier', () => {
	it('should return true if identifier consists of alphanumeric characters and/or underscore', () => {
		expect(isValidReferenceIdentifier('aaa11')).toBeTruthy();
		expect(isValidReferenceIdentifier('1AkL23')).toBeTruthy();
		expect(isValidReferenceIdentifier('123')).toBeTruthy();
	});
	it('should return true if identifier contains underscores', () => {
		expect(isValidReferenceIdentifier('___')).toBeTruthy();
		expect(isValidReferenceIdentifier('12_hi_there')).toBeTruthy();
	});
	it('should return false if identifier contains characters which are not alphanumeric', () => {
		expect(isValidReferenceIdentifier('')).toBeFalsy();
		expect(isValidReferenceIdentifier('an identifier')).toBeFalsy();
		expect(isValidReferenceIdentifier('an\nidentifier')).toBeFalsy();
	});
});

describe('StringOperand', () => {
	it('should handle backslashes', () => {
		let strop = new StringOperand('\\"hello\\"');
		expect(strop.value).toBe('"hello"');
		// it seems to be a demand that string values are quoted...
		expect(strop.toString()).toBe('"\\"hello\\""');

		strop = new StringOperand('\\"');
		expect(strop.value).toBe('"');
		expect(strop.toString()).toBe('"\\""');

		strop = new StringOperand('hello backslash \\\\');
		expect(strop.value).toBe('hello backslash \\');
		expect(strop.toString()).toBe('"hello backslash \\\\"');
		
		// we can escape arbitrary characters...
		strop = new StringOperand('hello backslash \\abcd');
		expect(strop.value).toBe('hello backslash abcd');
		expect(strop.toString()).toBe('"hello backslash \\abcd"');
	});
	// it('should only remove backslash for escaped characters', () => {
	// 	const tabstop = '\t';
	// 	expect(new StringOperand(tabstop).value).toBe(tabstop);
	// 	const newline = '\n';
	// 	expect(new StringOperand(newline).value).toBe(newline);
	// 	const escape = '\\';
	// 	expect(new StringOperand(escape).value).toBe(escape);
	// });
});
