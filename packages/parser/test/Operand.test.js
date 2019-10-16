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

		strop = new StringOperand('hello backslash \\\\');
		expect(strop.value).toBe('hello backslash \\');
		expect(strop.toString()).toBe('"hello backslash \\\\"');
		
		// we can escape arbitrary characters...
		strop = new StringOperand('hello backslash \\abcd');
		expect(strop.value).toBe('hello backslash abcd');
		expect(strop.toString()).toBe('"hello backslash \\abcd"');
	});
});
