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
const { createTerm } = require('../utilities');
const { FunctionErrors } = require('@cedalo/error-codes');
const { StreamSheet } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

describe('colors', () => {
	describe('convert from cmyk', () => {
		it('should convert to hex', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,0,50", "cmyk", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("(0,0,0,50)", "cmyk", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("cmyk(0,0,0,50)", "cmyk", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("0,0,0,0", "cmyk", "hex")', sheet).value).toBe('FFFFFF');
			expect(createTerm('color.convert("100,100,100,100", "cmyk", "hex")', sheet).value).toBe('000000');
			expect(createTerm('color.convert("101,101,101,101", "cmyk", "hex")', sheet).value).toBe('000000');
			expect(createTerm('color.convert("95,0,80,6", "CMYK", "HEX")', sheet).value).toBe('0CF030');
		});
		it('should convert to hsl', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,0,50", "cmyk", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("(0,0,0,50)", "cmyk", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("cmyk(0,0,0,50)", "cmyk", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("0,0,0,0", "cmyk","hsl")', sheet).value).toBe('0,0,100');
			expect(createTerm('color.convert("100,100,100,100", "cmyk", "hsl")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("101,101,101,101", "cmyk", "hsl")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("95,0,80,6", "CMYK", "HSL")', sheet).value).toBe('129,90,49');
		});
		it('should convert to hsv', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,0,50", "cmyk", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("(0,0,0,50)", "cmyk", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("cmyk(0,0,0,50)", "cmyk", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("0,0,0,0", "cmyk","hsv")', sheet).value).toBe('0,0,100');
			expect(createTerm('color.convert("100,100,100,100", "cmyk", "hsv")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("101,101,101,101", "cmyk", "hsv")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("95,0,80,6", "CMYK", "HSV")', sheet).value).toBe('129,95,94');
		});
		it('should convert to rgb', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,0,50", "cmyk", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("(0,0,0,50)", "cmyk", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("cmyk(0,0,0,50)", "cmyk", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("0,0,0,0", "cmyk", "rgb")', sheet).value).toBe('255,255,255');
			expect(createTerm('color.convert("100,100,100,100", "cmyk", "rgb")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("101,101,101,101", "cmyk", "rgb")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("95,0,80,6", "CMYK", "RGB")', sheet).value).toBe('12,240,48');
		});
		it('should convert to cmyk', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("cmyk(0,0,0,50)", "CMYK", "CMYK")', sheet).value).toBe('0,0,0,50');
		});
	});
	describe('convert from hex', () => {
		it('should convert to cmyk', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("808080", "hex", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("#808080", "hex", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("000000", "hex", "cmyk")', sheet).value).toBe('0,0,0,100');
			expect(createTerm('color.convert("FFFFFF", "hex", "cmyk")', sheet).value).toBe('0,0,0,0');
			expect(createTerm('color.convert("0CF030", "HEX", "CMYK")', sheet).value).toBe('95,0,80,6');
		});
		it('should convert to hsl', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("808080", "hex", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("#808080", "hex", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("000000", "hex", "hsl")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("FFFFFF", "hex", "hsl")', sheet).value).toBe('0,0,100');
			expect(createTerm('color.convert("0CF030", "HEX", "HSL")', sheet).value).toBe('129,90,49');
		});
		it('should convert to hsv', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("808080", "hex", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("#808080", "hex", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("000000", "hex", "hsv")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("FFFFFF", "hex", "hsv")', sheet).value).toBe('0,0,100');
			expect(createTerm('color.convert("0CF030", "HEX", "HSV")', sheet).value).toBe('129,95,94');
		});
		it('should convert to rgb', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("808080", "hex", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("#808080", "hex", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("000000", "hex", "rgb")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("FFFFFF", "hex", "rgb")', sheet).value).toBe('255,255,255');
			expect(createTerm('color.convert("0CF030", "HEX", "RGB")', sheet).value).toBe('12,240,48');
		});
		it('should convert to hex', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0CF030", "hex", "hex")', sheet).value).toBe('0CF030');
		});
	});
	describe('convert from hsl', () => {
		it('should convert to cmyk', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,50", "hsl", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("(0,0,50)", "hsl", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("hsl(0,0,50)", "hsl", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("0,0,0", "hsl", "cmyk")', sheet).value).toBe('0,0,0,100');
			expect(createTerm('color.convert("360,100,100", "hsl", "cmyk")', sheet).value).toBe('0,0,0,0');
			expect(createTerm('color.convert("361,101,101", "hsl", "cmyk")', sheet).value).toBe('0,0,0,0');
			expect(createTerm('color.convert("129,95,94", "HSL", "CMYK")', sheet).value).toBe('11,0,9,0');
		});
		it('should convert to hex', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,50", "hsl", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("(0,0,50)", "hsl", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("hsl(0,0,50)", "hsl", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("0,0,0", "hsl", "hex")', sheet).value).toBe('000000');
			expect(createTerm('color.convert("360,100,100", "hsl", "hex")', sheet).value).toBe('FFFFFF');
			expect(createTerm('color.convert("361,101,101", "hsl", "hex")', sheet).value).toBe('FFFFFF');
			expect(createTerm('color.convert("129,95,94", "HSL", "HEX")', sheet).value).toBe('E1FEE6');
		});
		it('should convert to hsv', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,50", "hsl", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("(0,0,50)", "hsl", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("hsl(0,0,50)", "hsl", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("0,0,0", "hsl", "hsv")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("360,100,100", "hsl", "hsv")', sheet).value).toBe('0,0,100');
			expect(createTerm('color.convert("361,101,101", "hsl", "hsv")', sheet).value).toBe('0,0,100');
			expect(createTerm('color.convert("129,95,94", "HSL", "HSV")', sheet).value).toBe('130,11,100');
		});
		it('should convert to rgb', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,50", "hsl", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("(0,0,50)", "hsl", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("hsl(0,0,50)", "hsl", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("0,0,0", "hsl", "rgb")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("360,100,100", "hsl", "rgb")', sheet).value).toBe('255,255,255');
			expect(createTerm('color.convert("361,101,101", "hsl", "rgb")', sheet).value).toBe('255,255,255');
			expect(createTerm('color.convert("129,95,94", "HSL", "RGB")', sheet).value).toBe('225,254,230');
		});
		it('should convert to hsl', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("hsl(0,0,50)", "hsl", "hsl")', sheet).value).toBe('0,0,50');
		});
	});
	describe('convert from hsv', () => {
		it('should convert to cmyk', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,50", "hsv", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("(0,0,50)", "hsv", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("hsv(0,0,50)", "hsv", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("0,0,0", "hsv", "cmyk")', sheet).value).toBe('0,0,0,100');
			expect(createTerm('color.convert("360,100,100", "hsv", "cmyk")', sheet).value).toBe('0,100,100,0');
			expect(createTerm('color.convert("361,101,101", "hsv", "cmyk")', sheet).value).toBe('0,100,100,0');
			expect(createTerm('color.convert("129,95,94", "HSV", "CMYK")', sheet).value).toBe('95,0,81,6');
		});
		it('should convert to hex', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,50", "hsv", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("(0,0,50)", "hsv", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("hsv(0,0,50)", "hsv", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("0,0,0", "hsv", "hex")', sheet).value).toBe('000000');
			expect(createTerm('color.convert("360,100,100", "hsv", "hex")', sheet).value).toBe('FF0000');
			expect(createTerm('color.convert("361,101,101", "hsv", "hex")', sheet).value).toBe('FF0000');
			expect(createTerm('color.convert("129,95,94", "HSV", "HEX")', sheet).value).toBe('0CF02E');
		});
		it('should convert to hsl', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,50", "hsv", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("(0,0,50)", "hsv", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("hsv(0,0,50)", "hsv", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("0,0,0", "hsv", "hsl")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("360,100,100", "hsv", "hsl")', sheet).value).toBe('0,100,50');
			expect(createTerm('color.convert("361,101,101", "hsv", "hsl")', sheet).value).toBe('0,100,50');
			expect(createTerm('color.convert("129,95,94", "HSV", "HSL")', sheet).value).toBe('129,90,49');
		});
		it('should convert to rgb', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("0,0,50", "hsv", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("(0,0,50)", "hsv", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("hsv(0,0,50)", "hsv", "rgb")', sheet).value).toBe('128,128,128');
			expect(createTerm('color.convert("0,0,0", "hsv", "rgb")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("360,100,100", "hsv", "rgb")', sheet).value).toBe('255,0,0');
			expect(createTerm('color.convert("361,101,101", "hsv", "RGB")', sheet).value).toBe('255,0,0');
			expect(createTerm('color.convert("129,95,94", "HSV", "rgb")', sheet).value).toBe('12,240,46');
		});
		it('should convert to hsv', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("hsv(0,0,50)", "hsv", "hsv")', sheet).value).toBe('0,0,50');
		});
	});
	describe('convert from rgb', () => {
		it('should convert to cmyk', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("128,128,128", "rgb", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("(128,128,128)", "rgb", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("rgb(128,128,128)", "rgb", "cmyk")', sheet).value).toBe('0,0,0,50');
			expect(createTerm('color.convert("0,0,0", "rgb", "cmyk")', sheet).value).toBe('0,0,0,100');
			expect(createTerm('color.convert("255,255,255", "RGB", "cmyk")', sheet).value).toBe('0,0,0,0');
			expect(createTerm('color.convert("256,256,256", "rgb", "CMYK")', sheet).value).toBe('0,0,0,0');
			expect(createTerm('color.convert("12,240,48", "RGB", "CMYK")', sheet).value).toBe('95,0,80,6');
		});
		it('should convert to hex', () => {
			// TODO test with neg. values, 0 values, 255 values and 256 values...
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("128,128,128", "rgb", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("(128,128,128)", "rgb", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("rgb(128,128,128)", "rgb", "hex")', sheet).value).toBe('808080');
			expect(createTerm('color.convert("0,0,0", "rgb", "hex")', sheet).value).toBe('000000');
			expect(createTerm('color.convert("255,255,255", "rgb", "hex")', sheet).value).toBe('FFFFFF');
			expect(createTerm('color.convert("256,256,256", "RGB", "hex")', sheet).value).toBe('FFFFFF');
			expect(createTerm('color.convert("12,240,48", "rgb", "HEX")', sheet).value).toBe('0CF030');
		});
		it('should convert to hsl', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("128,128,128", "rgb", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("(128,128,128)", "rgb", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("rgb(128,128,128)", "rgb", "hsl")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("0,0,0", "rgb", "hsl")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("255,255,255", "rgb", "hsl")', sheet).value).toBe('0,0,100');
			expect(createTerm('color.convert("256,256,256", "RGB", "hsl")', sheet).value).toBe('0,0,100');
			expect(createTerm('color.convert("12,240,48", "rgb", "HSL")', sheet).value).toBe('129,90,49');
		});
		it('should convert to hsv', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("128,128,128", "rgb", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("(128,128,128)", "rgb", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("rgb(128,128,128)", "rgb", "hsv")', sheet).value).toBe('0,0,50');
			expect(createTerm('color.convert("0,0,0", "rgb", "hsv")', sheet).value).toBe('0,0,0');
			expect(createTerm('color.convert("255,255,255", "rgb", "hsv")', sheet).value).toBe('0,0,100');
			expect(createTerm('color.convert("256,256,256", "RGB", "hsv")', sheet).value).toBe('0,0,100');
			expect(createTerm('color.convert("12,240,48", "rgb", "HSV")', sheet).value).toBe('129,95,94');
		});
		it('should convert to rgb', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("128,128,128", "rgb", "rgb")', sheet).value).toBe('128,128,128');
		});
	});
	describe('error handling', () => {
		it(`should return ${ERROR.ARGS} error if called with to few or to many arguments`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('color.convert(,)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('color.convert(,,)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('color.convert("#FFFFF")', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('color.convert("#FFFFF",)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('color.convert("#FFFFF","hex")', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('color.convert("#FFFFF","hex",)', sheet).value).toBe(ERROR.ARGS);
		});
		// DL-2355
		it(`should return ${ERROR.VALUE} for unsupported color values`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("red","rgb","hsl")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('color.convert("#FFFFFF","rgb","hsl")', sheet).value).toBe(ERROR.VALUE);
		});
		it('should return an error for unknown from-color', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("#FFFFFF","hey","hsl")', sheet).value).toBe(ERROR.VALUE);
		});
		it('should return an error for unknown to-color', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('color.convert("#FFFFFF","hex","fck")', sheet).value).toBe(ERROR.VALUE);
		});
	});
});
