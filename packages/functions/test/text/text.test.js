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
const { createCellAt, createTerm } = require('../utilities');
const { Machine, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

describe('char', () => {
	it('should return ansi/cp1252 character for specified number', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('char(33)', sheet).value).toBe('!');
		expect(createTerm('char(41)', sheet).value).toBe(')');
		expect(createTerm('char(61)', sheet).value).toBe('=');
		expect(createTerm('char(65)', sheet).value).toBe('A');
		expect(createTerm('char(128)', sheet).value).toBe('€');
		expect(createTerm('char(138)', sheet).value).toBe('Š');
		expect(createTerm('char(156)', sheet).value).toBe('œ');
		expect(createTerm('char(228)', sheet).value).toBe('ä');
		expect(createTerm('char(240)', sheet).value).toBe('ð');
		expect(createTerm('char(255)', sheet).value).toBe('ÿ');
	});
	it('should round floating numbers down to next integer number', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('char(61.999)', sheet).value).toBe('=');
		expect(createTerm('char(255.123)', sheet).value).toBe('ÿ');
	});
	it('should support specifying ansi/cp1252 as character set', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('char(33, "ansi")', sheet).value).toBe('!');
		expect(createTerm('char(65, "ansi")', sheet).value).toBe('A');
		expect(createTerm('char(128, "ansi")', sheet).value).toBe('€');
		expect(createTerm('char(138, "ansi")', sheet).value).toBe('Š');
		expect(createTerm('char(156, "ansi")', sheet).value).toBe('œ');
		expect(createTerm('char(240, "ansi")', sheet).value).toBe('ð');
		expect(createTerm('char(33, "cp1252")', sheet).value).toBe('!');
		expect(createTerm('char(65, "cp1252")', sheet).value).toBe('A');
		expect(createTerm('char(128, "cp1252")', sheet).value).toBe('€');
		expect(createTerm('char(138, "cp1252")', sheet).value).toBe('Š');
		expect(createTerm('char(156, "cp1252")', sheet).value).toBe('œ');
		expect(createTerm('char(240, "cp1252")', sheet).value).toBe('ð');
	});
	it('should NOT support mac/roman as character set', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('char(33, "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // '!');
		expect(createTerm('char(65, "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // 'A');
		expect(createTerm('char(126, "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // '~');
		expect(createTerm('char(128, "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // 'Ä');
		expect(createTerm('char(138, "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // 'ä');
		expect(createTerm('char(219, "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // '€');
		expect(createTerm('char(33, "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // '!');
		expect(createTerm('char(65, "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // 'A');
		expect(createTerm('char(126, "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // '~');
		expect(createTerm('char(128, "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // 'Ä');
		expect(createTerm('char(138, "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // 'ä');
		expect(createTerm('char(219, "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // '€');
	});
	it(`return ${ERROR.VALUE} if given number is not between 1 and 255 or specified value is not a number`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('char()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('char(0)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('char(256)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('char("")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('char("hi")', sheet).value).toBe(ERROR.VALUE);
	});
});
describe('clean', () => {
	it('should remove non-printable characters from given string', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('clean(concat(CHAR(9),"Monthly report", CHAR(10)))', sheet).value).toBe('Monthly report');
		expect(createTerm('clean(concat("hello", CHAR(1), CHAR(2), "world", CHAR(31), CHAR(33)))', sheet).value).toBe(
			'helloworld!'
		);
	});
	it('should remove additional non-printable characters if extended-flag is set', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('clean(concat("hello", CHAR(127), "world", CHAR(129), CHAR(33)), true)', sheet).value).toBe(
			'helloworld!'
		);
		expect(
			createTerm('clean(concat(CHAR(141), "hello", CHAR(143), "world", CHAR(144), CHAR(33)), true)', sheet).value
		).toBe('helloworld!');
		expect(createTerm('clean(concat("hello", "world", CHAR(33), CHAR(157)), true)', sheet).value).toBe(
			'helloworld!'
		);
	});
	it('should do nothing on empty strings', () => {
		const sheet = new StreamSheet().sheet;
		sheet.loadCells({ A1: '' });
		expect(createTerm('clean("")', sheet).value).toBe('');
		expect(createTerm('clean(A1)', sheet).value).toBe('');
		expect(createTerm('clean(B1)', sheet).value).toBe('');
		expect(createTerm('clean("", true)', sheet).value).toBe('');
	});
	it(`return ${ERROR.ARGS} if too many or not enough parameters given`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('clean()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('clean("", true, A1)', sheet).value).toBe(ERROR.ARGS);
	});
});
describe('code', () => {
	it('should return ansi character code for first character of provided string', () => {
		const sheet = new StreamSheet().sheet;
		// expect(createTerm('char(1)', sheet).value).toBe('');
		expect(createTerm('code("!")', sheet).value).toBe(33);
		expect(createTerm('code("A")', sheet).value).toBe(65);
		expect(createTerm('code("^")', sheet).value).toBe(94);
		expect(createTerm('code("hello")', sheet).value).toBe(104);
		expect(createTerm('code("€")', sheet).value).toBe(128);
		expect(createTerm('code("Š")', sheet).value).toBe(138);
		expect(createTerm('code("œ")', sheet).value).toBe(156);
		expect(createTerm('code("ð")', sheet).value).toBe(240);
	});
	it('should support specifying ansi/cp1252 as character set', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('code("!", "ansi")', sheet).value).toBe(33);
		expect(createTerm('code("A", "ansi")', sheet).value).toBe(65);
		expect(createTerm('code("€", "ansi")', sheet).value).toBe(128);
		expect(createTerm('code("Š", "ansi")', sheet).value).toBe(138);
		expect(createTerm('code("œ", "ansi")', sheet).value).toBe(156);
		expect(createTerm('code("ð", "ansi")', sheet).value).toBe(240);
		expect(createTerm('code("!", "cp1252")', sheet).value).toBe(33);
		expect(createTerm('code("A", "cp1252")', sheet).value).toBe(65);
		expect(createTerm('code("€", "cp1252")', sheet).value).toBe(128);
		expect(createTerm('code("Š", "cp1252")', sheet).value).toBe(138);
		expect(createTerm('code("œ", "cp1252")', sheet).value).toBe(156);
		expect(createTerm('code("ð", "cp1252")', sheet).value).toBe(240);
	});
	it('should NOT support mac/roman as character set', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('code("!", "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // 33);
		expect(createTerm('code("A", "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // 65);
		expect(createTerm('code("~", "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // 126);
		expect(createTerm('code("Ä", "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // 128);
		expect(createTerm('code("ä", "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // 138);
		expect(createTerm('code("€", "mac")', sheet).value).toBe(ERROR.INVALID_PARAM); // 219);
		expect(createTerm('code("!", "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // 33);
		expect(createTerm('code("A", "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // 65);
		expect(createTerm('code("~", "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // 126);
		expect(createTerm('code("Ä", "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // 128);
		expect(createTerm('code("ä", "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // 138);
		expect(createTerm('code("€", "roman")', sheet).value).toBe(ERROR.INVALID_PARAM); // 219);
	});
	it(`return ${ERROR.VALUE} if given string is empty or not a string`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('code("")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('code(A1)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('code()', sheet).value).toBe(ERROR.ARGS);
	});
});
describe('concat', () => {
	it('should concat given strings', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('concat("hello")', sheet).value).toBe('hello');
		expect(createTerm('concat("hel", "lo")', sheet).value).toBe('hello');
		expect(createTerm('concat("h", "e", "l", "l", "o")', sheet).value).toBe('hello');
		expect(createTerm('concat("h", "", "", "", "o")', sheet).value).toBe('ho');
		expect(createTerm('concat()', sheet).value).toBe('');
	});
	it('should concat cells and cell ranges', () => {
		const cells = {
			A1: 'h',
			B1: 'e',
			C1: 'l',
			A2: 'l',
			B2: 'o',
			C2: '?',
			D2: 123
		};
		const sheet = new StreamSheet().sheet.load({ cells });
		expect(createTerm('concat(A1, B1, C1)', sheet).value).toBe('hel');
		expect(createTerm('concat(-D2, B1, C1)', sheet).value).toBe('-123el');
		expect(createTerm('concat(A2:C2)', sheet).value).toBe('lo?');
		expect(createTerm('concat(A1, B1:C1, A2:B2,C2)', sheet).value).toBe('hello?');
		expect(createTerm('concat(A1:A2, B2)', sheet).value).toBe('hlo');
	});
	it('should concat values, cells and cell ranges', () => {
		const cells = { A1: 'h', B1: 'e', C1: 'l', A2: 'l', B2: 'o', C2: '?' };
		const sheet = new StreamSheet().sheet.load({ cells });
		expect(createTerm('concat(A1:C1, A2:B2, " ", "world")', sheet).value).toBe('hello world');
		expect(createTerm('concat(A1, "ow", " ar", B1:B1, " y", B2:B2, "u", C2)', sheet).value).toBe('how are you?');
	});
	it(`should return ${ERROR.VALUE} if at least one concated value is invalid `, () => {
		const cells = {
			A1: 'h',
			B1: 'e',
			C1: 'l',
			A2: 'l',
			B2: 'o',
			C2: '?',
			D2: 123
		};
		const sheet = new StreamSheet().sheet.load({ cells });
		expect(createTerm('concat(-A1, B1, C1)', sheet).value).toBe(ERROR.VALUE);
	});
	// DL-2296:
	it('should be possible to specify quotes', () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', 'ABCD', sheet);
		const term = createTerm('concat("\\"abcd\\"")', sheet);
		expect(term.value).toBe('"abcd"');
		expect(term.toString()).toBe('CONCAT("\\"abcd\\"")');
		expect(createTerm('concat("{\\"X-Access-Token\\":\\"", A1, "\\"}")', sheet).value).toBe(
			'{"X-Access-Token":"ABCD"}'
		);
	});
});
describe('find', () => {
	it('should find given search text in specified string', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Miriam McGovern' }
		});
		expect(createTerm('find("M", A1)', sheet).value).toBe(1);
		expect(createTerm('find("m", A1)', sheet).value).toBe(6);
		expect(createTerm('find("M", A1, 3)', sheet).value).toBe(8);
		expect(createTerm('find("over", A1, 4)', sheet).value).toBe(11);
		expect(createTerm('find("M", "Miriam McGovern", 6)', sheet).value).toBe(8);
	});
	it('should match to first character if search text is empty', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Miriam McGovern' }
		});
		expect(createTerm('find("", A1)', sheet).value).toBe(1);
		expect(createTerm('find("", "Hello")', sheet).value).toBe(1);
		expect(createTerm('find( , A1)', sheet).value).toBe(1);
		expect(createTerm('find( , "Hello")', sheet).value).toBe(1);
	});
	it(`should return ${ERROR.VALUE} if search text is not found`, () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Miriam McGovern' }
		});
		expect(createTerm('find("W", A1)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('find("Z", "Hello")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('find("e", "Hello", 4)', sheet).value).toBe(ERROR.VALUE);
	});
	it(`should return ${ERROR.VALUE} if start index is not greater zero`, () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Miriam McGovern' }
		});
		expect(createTerm('find("M", A1, 0)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('find("e", "Hello", -1)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('find("H", "Hello", 1)', sheet).value).toBe(1);
	});
	it(`should return ${ERROR.VALUE} if start index is greater then text`, () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Miriam McGovern' }
		});
		expect(createTerm('find("n", A1, 15)', sheet).value).toBe(15);
		expect(createTerm('find("n", A1, 16)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('find("o", "Hello", 5)', sheet).value).toBe(5);
		expect(createTerm('find("o", "Hello", 6)', sheet).value).toBe(ERROR.VALUE);
	});
});
describe('left', () => {
	it('should return first character or charactes of given string', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Sale Price' }
		});
		expect(createTerm('left(A1)', sheet).value).toBe('S');
		expect(createTerm('left("Hello")', sheet).value).toBe('H');
		expect(createTerm('left("", 1)', sheet).value).toBe('');
		expect(createTerm('left(A1, 1)', sheet).value).toBe('S');
		expect(createTerm('left(A1, 4)', sheet).value).toBe('Sale');
		expect(createTerm('left(A1, 8)', sheet).value).toBe('Sale Pri');
		expect(createTerm('left(A1, 567)', sheet).value).toBe('Sale Price');
		expect(createTerm('left("Hello World", 1)', sheet).value).toBe('H');
		expect(createTerm('left("Hello World", 6)', sheet).value).toBe('Hello ');
		expect(createTerm('left("Hello World", 11)', sheet).value).toBe('Hello World');
		expect(createTerm('left("Hello World", 999)', sheet).value).toBe('Hello World');
		expect(createTerm('left(A1, 0)', sheet).value).toBe('');
	});
	it(`should return ${ERROR.VALUE} if specified number of characters is less than zero`, () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Sale Price' }
		});
		expect(createTerm('left(A1, -1)', sheet).value).toBe(ERROR.VALUE);
	});
	it('should return empty string if no text is specified', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: undefined } });
		expect(createTerm('left(A1)', sheet).value).toBe('');
		expect(createTerm('left(A3)', sheet).value).toBe('');
		expect(createTerm('left(A1, 1)', sheet).value).toBe('');
	});
});
describe('len', () => {
	it('should return number of charactes in given string', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Phoenix, AZ' }
		});
		expect(createTerm('len(A1)', sheet).value).toBe(11);
		expect(createTerm('len("Hello")', sheet).value).toBe(5);
		expect(createTerm('len("")', sheet).value).toBe(0);
		expect(createTerm('len("  ")', sheet).value).toBe(2);
		expect(createTerm('len("  hello")', sheet).value).toBe(7);
	});
	// DL-1327
	it('should return error for invalid parameter', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: 'hello' } });
		expect(createTerm('len(_A1)', sheet).value).toBe(ERROR.NAME);
	});
});
describe('mid', () => {
	it('should return specified number of characters from given string', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Fluid Flow' }
		});
		expect(createTerm('mid(A1, 1, 1)', sheet).value).toBe('F');
		expect(createTerm('mid(A1, 1, 5)', sheet).value).toBe('Fluid');
		expect(createTerm('mid(A1, 7, 20)', sheet).value).toBe('Flow');
		expect(createTerm('mid(A1, 6, 520)', sheet).value).toBe(' Flow');
	});
	it('should return empty string if starting point is greater than given string', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Fluid Flow' }
		});
		expect(createTerm('mid(A1, 20, 20)', sheet).value).toBe('');
	});
	it(`should return ${ERROR.VALUE} if start index is less than 1 or number of characters is less than zero`, () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Fluid Flow' }
		});
		expect(createTerm('mid(A1, 0, 4)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('mid(A1, -1, 5)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('mid(A1, 1, -1)', sheet).value).toBe(ERROR.VALUE);
	});
});
describe('replace', () => {
	it('should replace part of a given string', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'abcdefghijk', A2: 2009, A3: 123456 }
		});
		expect(createTerm('replace(A1, 6, 5, "*")', sheet).value).toBe('abcde*k');
		expect(createTerm('replace(A2, 3, 2, "10")', sheet).value).toBe('2010');
		expect(createTerm('replace(A3, 1, 3, "@")', sheet).value).toBe('@456');
		expect(createTerm('replace("Hello", 2, 1, "a")', sheet).value).toBe('Hallo');
		expect(createTerm('replace("Hello", 2, 3, "")', sheet).value).toBe('Ho');
		expect(createTerm('replace("Hello", 2, 23, "i")', sheet).value).toBe('Hi');
	});
	// DL-1329
	it(`should return ${ERROR.VALUE} or ${ERROR.NAME} for invalid parameter or formula`, () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'hello', F2: { formula: 'JSON(A1:A1)' } }
		});
		expect(createTerm('replace(-A1,12,3,"later")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('replace(-F2,12,3,"later")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('replace(A1-,12,3,"later")', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('replace(B1,12,3,"laterB20,1")', sheet).value).toBe('laterB20,1');
	});
});
describe('rept', () => {
	it('should repeat text a number of times', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: 'Hello' } });
		expect(createTerm('rept(A1, 2)', sheet).value).toBe('HelloHello');
		expect(createTerm('rept("*-", 3)', sheet).value).toBe('*-*-*-');
		expect(createTerm('rept("-", 10)', sheet).value).toBe('----------');
		expect(createTerm('rept(A1, 0)', sheet).value).toBe('');
		expect(createTerm('rept("World", 0)', sheet).value).toBe('');
		expect(createTerm('rept(A3, 3)', sheet).value).toBe('');
	});
	// DL-1330
	it(`should return ${ERROR.VALUE} or ${ERROR.NAME} for invalid parameter`, () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: 'hello' } });
		expect(createTerm('rept(-A1,3)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('rept(_A1,3)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('rept(|A1,3)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('rept(}A1,3)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('rept(]A1,3)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('rept(²A1,3)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('rept(³A1,3)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('rept(~A1,3)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('rept(°A1,3)', sheet).value).toBe(ERROR.NAME);
	});
});
describe('right', () => {
	it('should return last character or characters of given string', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Sale Price' }
		});
		expect(createTerm('right(A1)', sheet).value).toBe('e');
		expect(createTerm('right("Hello")', sheet).value).toBe('o');
		expect(createTerm('right("", 1)', sheet).value).toBe('');
		expect(createTerm('right(A1, 0)', sheet).value).toBe('');
		expect(createTerm('right(A1, 1)', sheet).value).toBe('e');
		expect(createTerm('right(A1, 5)', sheet).value).toBe('Price');
		expect(createTerm('right(A1, 8)', sheet).value).toBe('le Price');
		expect(createTerm('right(A1, 567)', sheet).value).toBe('Sale Price');
		expect(createTerm('right("Hello World", 1)', sheet).value).toBe('d');
		expect(createTerm('right("Hello World", 6)', sheet).value).toBe(' World');
		expect(createTerm('right("Hello World", 11)', sheet).value).toBe('Hello World');
		expect(createTerm('right("Hello World", 999)', sheet).value).toBe('Hello World');
		expect(createTerm('right("", 134)', sheet).value).toBe('');
	});
	it(`should return ${ERROR.VALUE} if specified number of characters is less than zero`, () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Sale Price' }
		});
		expect(createTerm('right(A1, -1)', sheet).value).toBe(ERROR.VALUE);
	});
	it('should return empty string if no text is specified', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: undefined } });
		expect(createTerm('right(A1)', sheet).value).toBe('');
		expect(createTerm('right(A1, 1)', sheet).value).toBe('');
	});
});
describe('search', () => {
	it('should return the index of text within another text', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: 'Find me' } });
		expect(createTerm('search("me", A1)', sheet).value).toBe(6);
		expect(createTerm('search("ME", A1)', sheet).value).toBe(6);
		expect(createTerm('search("me", "Search me again")', sheet).value).toBe(8);
		expect(createTerm('search("E", "Search me again")', sheet).value).toBe(2);
	});
	it('should support wildcards in search text', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('search("a*c", "abc")', sheet).value).toBe(1);
		expect(createTerm('search("a*c", "hello abbbbc")', sheet).value).toBe(7);
		expect(createTerm('search("a*c", "hello abbbbc abc")', sheet).value).toBe(7);
		expect(createTerm('search("?a?c", "1abc")', sheet).value).toBe(1);
	});
	it('should support an optional start index', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: 'Find me' } });
		expect(createTerm('search("me", A1, 5)', sheet).value).toBe(6);
		expect(createTerm('search("aGaIn", "Search me over again and again", 20)', sheet).value).toBe(26);
		expect(createTerm('search("E", "Search me again", 5)', sheet).value).toBe(9);
		expect(createTerm('search("E", "Search me again", 1)', sheet).value).toBe(2);
	});
	it(`should return ${ERROR.VALUE} if text is not found`, () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: 'Find me' } });
		expect(createTerm('search("meet", A1)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('search("me", A1, 10)', sheet).value).toBe(ERROR.VALUE);
	});
	// DL-1331
	it(`should return ${ERROR.VALUE} for invalid parameter`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('search("me", -A1)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('search("me", _A1)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('search("me", |A1)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('search("me", }A1)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('search("me", ]A1)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('search("me", ²A1)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('search("me", ³A1)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('search("me", ~A1)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('search("me", °A1)', sheet).value).toBe(ERROR.NAME);
	});
});
describe('substitute', () => {
	it('should substitute specified string within another string', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Sales Data' }
		});
		expect(createTerm('substitute(A1, "Sales", "Cost")', sheet).value).toBe('Cost Data');
	});
	it('should substitute specified string at given occurrence within another string', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: 'Quarter 1, 2008', A2: 'Quarter 1, 2011' }
		});
		expect(createTerm('substitute(A1, "1", "2", 0)', sheet).value).toBe('Quarter 1, 2008');
		expect(createTerm('substitute(A1, "1", "2", 1)', sheet).value).toBe('Quarter 2, 2008');
		expect(createTerm('substitute(A2, "1", "2", 2)', sheet).value).toBe('Quarter 1, 2021');
		expect(createTerm('substitute(A2, "1", "2", 3)', sheet).value).toBe('Quarter 1, 2012');
		expect(createTerm('substitute(A2, "1", "2")', sheet).value).toBe('Quarter 2, 2022');
	});
	// DL-1313
	it('should work with regular expression characters as replace-pivot', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('substitute("20.45", ".", ",")', sheet).value).toBe('20,45');
	});
});
describe('text', () => {
	it('should convert a value to specified format', () => {
		// for more tests refer to our number-format module...
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', 12200000, sheet);
		expect(createTerm('text(A1, "#,###")', sheet).value).toBe('12,200,000');
		createCellAt('B1', 1234.56, sheet);
		expect(createTerm('text(B1, "$#,##0")', sheet).value).toBe('$1,235');
		createCellAt('C1', 0.2447008, sheet);
		expect(createTerm('text(C1, "0.0%")', sheet).value).toBe('24.5%');
		// DL-1333
		// => NOTE some format strings cannot be passed by used library!!
		// expect(createTerm('TEXT(3456, "#,##.00")', sheet).value).toBe('3,456.00');
		expect(createTerm('TEXT(3456, "#,##0.00")', sheet).value).toBe('3,456.00');
		// expect(createTerm('TEXT(3456, "#.##,00", "DE")', sheet).value).toBe('3.456,00');
		expect(createTerm('TEXT(3456, "#.##0,00", "DE")', sheet).value).toBe('3.456,00');
		expect(createTerm('TEXT(3456,",##.00")', sheet).value).toBe(',3456.00');
		expect(createTerm('TEXT(3456,".##,00", "DE")', sheet).value).toBe('.3456,00');
		// expect(createTerm('TEXT(3456,"######.qwe")', sheet).value).toBe(ERROR.VALUE);
		// expect(createTerm('TEXT(3456,"##.00qws")', sheet).value).toBe(ERROR.VALUE);
		// expect(createTerm('TEXT(3456,"##.00s")', sheet).value).toBe(ERROR.VALUE);
		// expect(createTerm('TEXT(3456,"^Hallo ##.00")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('TEXT(E22,"##,00", "DE")', sheet).value).toBe(',00');
		expect(createTerm('TEXT(0,"#")', sheet).value).toBe('');
		expect(createTerm('TEXT(F10,"#")', sheet).value).toBe('');
		expect(createTerm('TEXT(G12, "#,")', sheet).value).toBe('');
	});
	// DL-1708
	it('should convert to specified time format', () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', 0.891111111, sheet);
		expect(createTerm('text(A1, "hh:mm:ss")', sheet).value).toBe('21:23:12');
		// same even if we use locale...
		expect(createTerm('text(A1, "hh:mm:ss", "DE")', sheet).value).toBe('21:23:12');
		// DL-1333
		expect(createTerm('TEXT(A2,"HH:MM:SS")', sheet).value).toBe('00:00:00');
	});
	it('should return an error if no value, format are given', () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', 123456, sheet);
		expect(createTerm('text(A1, )', sheet).value).toBe(ERROR.INVALID_PARAM);
	});
	it('should convert a value to specified format in different locale', () => {
		const machine = new Machine();
		const t1 = new StreamSheet();
		const sheet = t1.sheet;
		// 'de-DE'
		machine.locale = 'de';
		machine.addStreamSheet(t1);
		createCellAt('A1', 1234.5678, sheet);
		expect(createTerm('text(A1, "##,00")', sheet).value).toBe('1234,57');
		expect(createTerm('text(A1, "##.00")', sheet).value).toBe(ERROR.INVALID_PARAM);
	});
	// DL-1491
	it('should support optional locale parameter to convert different locales', () => {
		const machine = new Machine();
		const t1 = new StreamSheet();
		machine.addStreamSheet(t1);
		createCellAt('A1', 12200000, t1.sheet);
		expect(createTerm('text(A1, "#,###")', t1.sheet).value).toBe('12,200,000');
		expect(createTerm('text(A1, "#.###", "DE")', t1.sheet).value).toBe('12.200.000');
		// switch machine to german
		machine.locale = 'de';
		expect(createTerm('text(A1, "#.###")', t1.sheet).value).toBe('12.200.000');
		// convert to english number although machine is german!
		expect(createTerm('text(A1, "#,###", "EN")', t1.sheet).value).toBe('12,200,000');
	});
	// DL-1215
	it('should convert first cell value if used with cell range', () => {
		const sheet = new StreamSheet().sheet.loadCells({ A1: 400, B1: 500 });
		expect(createTerm('text(A1:B1, "##")', sheet).value).toBe('400');
		// even if we go over several other ranges...
		sheet.loadCells({ A1: 200, B1: { formula: 'A1' }, C1: 500 });
		expect(createTerm('text(B1:C1, "##")', sheet).value).toBe('200');
		sheet.loadCells({ A1: 300, B1: 500, C1: { formula: 'A1' }, D1: { formula: 'C1' }, E1: 600 });
		expect(createTerm('text(D1:E1, "##")', sheet).value).toBe('300');
	});
});
describe('unichar', () => {
	it('should return character for specified unicode number', () => {
		const sheet = new StreamSheet().sheet;
		// expect(createTerm('char(1)', sheet).value).toBe('');
		expect(createTerm('unichar(32)', sheet).value).toBe(' ');
		expect(createTerm('unichar(66)', sheet).value).toBe('B');
		expect(createTerm('unichar(255)', sheet).value).toBe('ÿ');
		expect(createTerm('unichar(8226)', sheet).value).toBe('•');
	});
	it('should round floating numbers down to next integer number', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('unichar(61.999)', sheet).value).toBe('=');
		expect(createTerm('unichar(255.123)', sheet).value).toBe('ÿ');
		expect(createTerm('unichar(8226.901)', sheet).value).toBe('•');
	});
	it(`return ${ERROR.VALUE} if given number is not valid`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('unichar()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('unichar(0)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('unichar(655356)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('unichar("")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('unichar("hi")', sheet).value).toBe(ERROR.VALUE);
	});
});
describe('unicode', () => {
	it('should return character unicode for first character of provided string', () => {
		const sheet = new StreamSheet().sheet;
		// expect(createTerm('char(1)', sheet).value).toBe('');
		expect(createTerm('unicode(" ")', sheet).value).toBe(32);
		expect(createTerm('unicode("B")', sheet).value).toBe(66);
		expect(createTerm('unicode("^")', sheet).value).toBe(94);
		expect(createTerm('unicode("hello")', sheet).value).toBe(104);
		expect(createTerm('unicode("ð")', sheet).value).toBe(240);
		expect(createTerm('unicode("ÿ")', sheet).value).toBe(255);
		expect(createTerm('unicode("Š")', sheet).value).toBe(352);
		expect(createTerm('unicode("œ")', sheet).value).toBe(339);
		expect(createTerm('unicode("•")', sheet).value).toBe(8226);
		expect(createTerm('unicode("€")', sheet).value).toBe(8364);
	});
	it(`return ${ERROR.VALUE} if given string is empty or not a string`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('unicode("")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('unicode(A1)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('unicode()', sheet).value).toBe(ERROR.ARGS);
	});
});
describe('value', () => {
	// DL-1314
	it('should convert a textual number representation to number', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('value("22.45")', sheet).value).toBe(22.45);
		expect(createTerm('value("0.0045")', sheet).value).toBe(0.0045);
		expect(createTerm('value("-0.00123")', sheet).value).toBe(-0.00123);
	});
	it('should ignore different machine locales, because converting is left to client', () => {
		// german
		const machine = new Machine();
		const t1 = new StreamSheet();
		let sheet = t1.sheet;
		machine.locale = 'de';
		machine.addStreamSheet(t1);
		expect(createTerm('value("22,45")', sheet).value).toBe(22.45);
		expect(createTerm('value("12.345,67")', sheet).value).toBe(12345.67);
		expect(createTerm('value("0,0045")', sheet).value).toBe(0.0045);
		expect(createTerm('value("-0,00123")', sheet).value).toBe(-0.00123);
		// english input leads to an error:
		expect(createTerm('value("12.34")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("12,345.67")', sheet).value).toBe(ERROR.VALUE);
		// new streamsheet without added to machine => english is default!
		sheet = new StreamSheet().sheet;
		expect(createTerm('value("22,456.789")', sheet).value).toBe(22456.789);
		expect(createTerm('value("12,34")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("22,45.678")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("12.345,67")', sheet).value).toBe(ERROR.VALUE);
	});
	it('should support specifying different locales', () => {
		// german
		const machine = new Machine();
		const t1 = new StreamSheet();
		machine.locale = 'de';
		machine.addStreamSheet(t1);
		// no locale specified => defaults to machine locale
		expect(createTerm('value("22,45")', t1.sheet).value).toBe(22.45);
		expect(createTerm('value("22.45")', t1.sheet).value).toBe(ERROR.VALUE);
		// specify different locale on the fly:
		expect(createTerm('value("22,45", "en")', t1.sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("22.45", "en")', t1.sheet).value).toBe(22.45);
		expect(createTerm('value("22,45", "DE")', t1.sheet).value).toBe(22.45);
		expect(createTerm('value("22.45", "dE")', t1.sheet).value).toBe(ERROR.VALUE);
		// locale is ignored if value is a number already:
		expect(createTerm('value(22.45, "en")', t1.sheet).value).toBe(22.45);
		expect(createTerm('value(-0.12345, "en")', t1.sheet).value).toBe(-0.12345);
		expect(createTerm('value(123.456, "DE")', t1.sheet).value).toBe(123.456);
		expect(createTerm('value(-0.0012, "dE")', t1.sheet).value).toBe(-0.0012);
	});
	// DL-1737
	it('should simply return value if it is a number already', () => {
		const t1 = new StreamSheet();
		expect(createTerm('value(22.45)', t1.sheet).value).toBe(22.45);
		expect(createTerm('value(-56.78)', t1.sheet).value).toBe(-56.78);
		expect(createTerm('value(0.0001245)', t1.sheet).value).toBe(0.0001245);
		expect(createTerm('value(-0.0012345)', t1.sheet).value).toBe(-0.0012345);
		expect(createTerm('value("-0.0012345")', t1.sheet).value).toBe(-0.0012345);
		expect(createTerm('value("22,456.789")', t1.sheet).value).toBe(22456.789);
		// add t1 to a german machine:
		const machine = new Machine();
		machine.locale = 'de';
		machine.addStreamSheet(t1);
		// even if machine is set to "DE" we calc in "EN"!! Transform to "DE" is done by client!!
		expect(createTerm('value(22.45)', t1.sheet).value).toBe(22.45);
		expect(createTerm('value(-56.78)', t1.sheet).value).toBe(-56.78);
		expect(createTerm('value(0.0001245)', t1.sheet).value).toBe(0.0001245);
		expect(createTerm('value(-0.0012345)', t1.sheet).value).toBe(-0.0012345);
		// machine is in "DE" so we expect string to be in german too:
		expect(createTerm('value("-0,0012345")', t1.sheet).value).toBe(-0.0012345);
		expect(createTerm('value("22.456,789")', t1.sheet).value).toBe(22456.789);
	});
	it('should support multiple thousands separators', () => {
		const s1 = new StreamSheet();
		const machine = new Machine();
		machine.locale = 'de';
		machine.removeAllStreamSheets();
		machine.addStreamSheet(s1);
		expect(createTerm('value("1.234.567,8")', s1.sheet).value).toBe(1234567.8);
		expect(createTerm('value("-1.234.567,8")', s1.sheet).value).toBe(-1234567.8);
		expect(createTerm('value("2.34,56")', s1.sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("34,567,89")', s1.sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("1.234,567.89")', s1.sheet).value).toBe(ERROR.VALUE);
		// do same with english locale
		machine.locale = 'en';
		expect(createTerm('value("1,234,567.8")', s1.sheet).value).toBe(1234567.8);
		expect(createTerm('value("-1,234,567.8")', s1.sheet).value).toBe(-1234567.8);
		expect(createTerm('value("2,34.56")', s1.sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("34.567.89")', s1.sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("1,234.567,89")', s1.sheet).value).toBe(ERROR.VALUE);
		// check with locale setting:
		expect(createTerm('value("1.234.567,8", "de")', s1.sheet).value).toBe(1234567.8);
		expect(createTerm('value("12.315.613.132,00", "de")', s1.sheet).value).toBe(12315613132);
	});
	// DL-2502
	it('should not cut large values', () => {
		// german
		const machine = new Machine();
		const t1 = new StreamSheet();
		const sheet = t1.sheet;
		machine.locale = 'de';
		machine.addStreamSheet(t1);
		expect(createTerm('value("123,23872375389742")', sheet).value).toBe(123.23872375389742);
		// as a (very) simplified rule of thumb JS can display a number with round about 16-17 digits
		expect(createTerm('value("123,4567890123456")', sheet).value).toBe(123.4567890123456);
		expect(createTerm('value("123,45678901234567")', sheet).value).toBe(123.45678901234567);
		expect(createTerm('value("123,45678901234567")', sheet).value.toString()).toBe('123.45678901234567');
		expect(createTerm('value("999,9999999999999")', sheet).value.toString()).toBe('999.9999999999999');
	});
	it(`should return ${ERROR.VALUE} if text cannot be converted`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('value("22_45")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("22!")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("a22")', sheet).value).toBe(ERROR.VALUE);
	});
	it(`should return ${ERROR.VALUE} if specified unknown locale`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('value("22_45", "sk")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('value("22_45", "us")', sheet).value).toBe(ERROR.VALUE);
	});
});
