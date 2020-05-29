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
const GraphParser = require('../src/graph/parser/GraphParser');

const Parser = new GraphParser();

const ignoreErrors = (doIt) => {
	const ctxt = Parser.context;
	const oldstate = ctxt.ignoreErrors;
	ctxt.ignoreErrors = doIt;
	return oldstate;
};

describe('GraphParser', () => {
	// DL-2412
	describe('parseFormulaInfo', () => {
		it('should parse given string and return info object at specified offset', () => {
			let info = Parser.parseFormulaInfo('sum(B1)', 0);
			expect(info).toEqual({});
			expect(info.paramIndex).toBeUndefined();
			info = Parser.parseFormulaInfo('sum(B1)', 1);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBeUndefined();
			info = Parser.parseFormulaInfo('sum(B1)', 5);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(0);
		});
		it('should use 0 if offset is invalid', () => {
			let info = Parser.parseFormulaInfo('sum(B1)');
			expect(info).toEqual({});
			info = Parser.parseFormulaInfo('sum(B1)', -1);
			expect(info).toEqual({});
			info = Parser.parseFormulaInfo('sum(B1)', 43);
			expect(info).toEqual({});
		});
		it('should return empty info object if no formula is given', () => {
			let info = Parser.parseFormulaInfo();
			expect(info).toEqual({});
			info = Parser.parseFormulaInfo('', 0);
			expect(info).toEqual({});
		});
		it('should return empty info object if offset is not inside a function', () => {
			let info = Parser.parseFormulaInfo('1+3+sum(B1)-42', 0);
			expect(info).toEqual({});
			info = Parser.parseFormulaInfo('1+3+sum(B1)-42', 2);
			expect(info).toEqual({});
			info = Parser.parseFormulaInfo('1+3+sum(B1)-42', 3);
			expect(info).toEqual({});
			info = Parser.parseFormulaInfo('1+3+sum(B1)-42', 11);
			expect(info).toEqual({});
			info = Parser.parseFormulaInfo('1+3+sum(B1)-42', 13);
			expect(info).toEqual({});
		});
		it('should handle nested expressions', () => {
			let info = Parser.parseFormulaInfo('sum(B1,3+5,sum(4,6))', 6);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(B1,3+5,sum(4,6))', 7);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(1);
			info = Parser.parseFormulaInfo('sum(B1,3+5,sum(4,6))', 10);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(1);
			info = Parser.parseFormulaInfo('sum(B1,3+5,cos(1))', 11);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(2);
			info = Parser.parseFormulaInfo('sum(B1,3+5,cos(1))', 12);
			expect(info.function).toBe('cos');
			expect(info.paramIndex).toBeUndefined();
			info = Parser.parseFormulaInfo('sum(B1,3+5,cos(1))', 16);
			expect(info.function).toBe('cos');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(B1,3+5,cos(1))', 17);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(2);

			info = Parser.parseFormulaInfo('cos(sin(B1))', 9);
			expect(info.function).toBe('sin');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('cos(sin(B1))', 11);
			expect(info.function).toBe('cos');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('cos(sin(B1),sin(1))', 18);
			expect(info.function).toBe('cos');
			expect(info.paramIndex).toBe(1);
			info = Parser.parseFormulaInfo('cos(sin(B1),sin(1))', 19);
			expect(info).toEqual({});
			
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 13);
			expect(info.function).toBe('sin');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 14);
			expect(info.function).toBe('sin');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 15);
			expect(info.function).toBe('cos');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 16);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 17);
			expect(info).toEqual({});

			info = Parser.parseFormulaInfo('sum(cos(0.4),sin(B1))', 12);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(0);

			// DL-2461 analog formula
			info = Parser.parseFormulaInfo('sum("producer",cos(A1:A2),"topic")', 14);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum("producer",cos(A1:A2),"topic")', 25);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(1);
		});
		it('should handle units', () => {
			let info = Parser.parseFormulaInfo('5%', 1);
			expect(info).toEqual({});
			info = Parser.parseFormulaInfo('2+5%', 3);
			expect(info).toEqual({});
		});
		it('should work with ignored parsing errors', () => {
			const ignored = ignoreErrors(true);
			let info = Parser.parseFormulaInfo('sum(B1', 1);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBeUndefined();
			info = Parser.parseFormulaInfo('sum(B1,3+5,sum(4,6)', 7);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(1);
			info = Parser.parseFormulaInfo('sum(B1,3+5,sum(4,6)', 12);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBeUndefined();
			// DL-3631 nested 3-level deep:
			info = Parser.parseFormulaInfo('sum("hello","world",cos(if(1<2,"yes","no"),if(2>3,"?","!"))', 63);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBeUndefined();
			ignoreErrors(ignored);
		});
		it('should handle incomplete function names', () => {
			const ignored = ignoreErrors(true);
			let info = Parser.parseFormulaInfo('1+su', 3);
			expect(info.identifier).toBe('su');
			expect(info.function).toBeUndefined();
			expect(info.paramIndex).toBeUndefined();
			info = Parser.parseFormulaInfo('sum(1, 3 + su)', 11);
			expect(info.identifier).toBe('su');
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(1);
			ignoreErrors(ignored);
		});
		// DL-2697
		it('should work with empty/optional parameters', () => {
			const ignored = ignoreErrors(true);
			let info = Parser.parseFormulaInfo('sum(12,,45)', 5);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(12,,45)', 7);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(1);
			// not yet finished 
			info = Parser.parseFormulaInfo('sum(12,', 7);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(1);
			info = Parser.parseFormulaInfo('sum(12,,,', 7);
			expect(info.paramIndex).toBe(1);
			info = Parser.parseFormulaInfo('sum(12,,,', 8);
			expect(info.paramIndex).toBe(2);
			info = Parser.parseFormulaInfo('sum(12,,,', 9);
			expect(info.paramIndex).toBe(3);
			// test with incomplete and nested params!!
			info = Parser.parseFormulaInfo('sum(12,sum(3,))', 13);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(1);
			info = Parser.parseFormulaInfo('sum(12,sum(3,', 13);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(1);
			info = Parser.parseFormulaInfo('sum(12,sum(3,,', 14);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(2);
			info = Parser.parseFormulaInfo('sum(12,sum(3,,cos(1)', 18);
			expect(info.function).toBe('cos');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(12,sum(3,,cos(1)', 20);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(2);
			ignoreErrors(ignored);
		});
		// DL-3208
		it('should set parent of next parameter', () => {
			let info = Parser.parseFormulaInfo('sum(-10,10)', 7);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(-10,10)', 8);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(1);
		});
		// DL-3186
		it('should work with conditions', () => {
			let info = Parser.parseFormulaInfo('if(A1=1,sum(B1:B2),FALSE)', 1);
			expect(info.function).toBe('if');
			expect(info.paramIndex).toBeUndefined();
			info = Parser.parseFormulaInfo('if(A1=1,sum(B1:B2),FALSE)', 4);
			expect(info.function).toBe('if');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('if(A1=1,sum(B1:B2),FALSE)', 7);
			expect(info.function).toBe('if');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('if(A1=1,sum(B1:B2),FALSE)', 8);
			expect(info.function).toBe('if');
			expect(info.paramIndex).toBe(1);
			info = Parser.parseFormulaInfo('if(A1=1,sum(B1:B2),FALSE)', 14);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('if(A1=1,sum(B1:B2),FALSE)', 18);
			expect(info.function).toBe('if');
			expect(info.paramIndex).toBe(1);
			info = Parser.parseFormulaInfo('if(A1=1,sum(B1:B2),FALSE)', 19);
			expect(info.function).toBe('if');
			expect(info.paramIndex).toBe(2);
		});

		// DL-2704
		it('should set function/identifier only if offset is within corresponding name', () => {
			let info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 0);
			expect(info).toEqual({});
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 1);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBeUndefined();
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 4);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 5);
			expect(info.function).toBe('cos');
			expect(info.paramIndex).toBeUndefined();
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 8);
			expect(info.function).toBe('cos');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 9);
			expect(info.function).toBe('sin');
			expect(info.paramIndex).toBeUndefined();
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 12);
			expect(info.function).toBe('sin');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 14);
			expect(info.function).toBe('sin');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 15);
			expect(info.function).toBe('cos');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 16);
			expect(info.function).toBe('sum');
			expect(info.paramIndex).toBe(0);
			info = Parser.parseFormulaInfo('sum(cos(sin(B1)))', 17);
			expect(info).toEqual({});
		});
	});
});
