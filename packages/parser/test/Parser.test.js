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
const { Locale, Parser, ParserContext } = require('..');

const DEF_CONTEXT = new ParserContext();

const validateToString = (expr) => {
	const term = Parser.parse(expr, DEF_CONTEXT);
	expect(term.toString()).toBe(expr);
};

const expectInfo = (info) => ({
	toContain(obj) {
		Object.entries(obj).forEach(([key, value]) => {
			expect(info[key]).toEqual(value);
		});
	}
});

describe('parser', () => {
	describe('parse', () => {
		// DL-1067
		it('should allow brackets inside function', () => {
			// e.g.: =SQRT((B12)*2)
			expect(Parser.parse('-24', DEF_CONTEXT).value).toBe(-24);
			expect(Parser.parse('-12 * 2', DEF_CONTEXT).value).toBe(-24);
			expect(Parser.parse('(-12) * 2', DEF_CONTEXT).value).toBe(-24);
			const term = Parser.parse('SUM((-12)*2)', DEF_CONTEXT);
			expect(term.value).toBe(-24);
		});
		it('should parse simple formula', () => {
			const term = Parser.parse('2 + 2 * 2', DEF_CONTEXT);
			expect(term.value).toBe(6);
		});
	});
	describe('parseValue', () => {
		it('should parse boolean representation', () => {
			expect(Parser.parseValue('true', DEF_CONTEXT).value).toBe(true);
			expect(Parser.parseValue('TrUe', DEF_CONTEXT).value).toBe(true);
			expect(Parser.parseValue('false', DEF_CONTEXT).value).toBe(false);
			expect(Parser.parseValue('fAlsE', DEF_CONTEXT).value).toBe(false);
		});
		it('should parse number representation', () => {
			expect(Parser.parseValue('0', DEF_CONTEXT).value).toBe(0);
			expect(Parser.parseValue('56', DEF_CONTEXT).value).toBe(56);
			expect(Parser.parseValue('-23', DEF_CONTEXT).value).toBe(-23);
			expect(Parser.parseValue('1234.56789', DEF_CONTEXT).value).toBe(1234.56789);
		});
		it('should parse number with custom decimal separators', () => {
			const contextDE = new ParserContext();
			contextDE.separators = Locale.DE.separators;
			// note that internally we use JS numbers!!
			expect(Parser.parseValue('0,00', contextDE).value).toBe(0.0);
			expect(Parser.parseValue('0,123', contextDE).value).toBe(0.123);
			expect(Parser.parseValue('1234,56789', contextDE).value).toBe(1234.56789);
		});
		it('should parse any string', () => {
			expect(Parser.parseValue('2,4 + 5,6', DEF_CONTEXT).value).toBe('2,4 + 5,6');
			expect(Parser.parseValue('A1:D4', DEF_CONTEXT).value).toBe('A1:D4');
			expect(Parser.parseValue('SUM(1;2)', DEF_CONTEXT).value).toBe('SUM(1;2)');
			expect(Parser.parseValue('400 / 2 + 400 / 2 * 0,5 * (1 - 2 * 2)', DEF_CONTEXT).value).toBe(
				'400 / 2 + 400 / 2 * 0,5 * (1 - 2 * 2)'
			);
			expect(Parser.parseValue('SUM (1,2,MAX  (0,3,2,1),4,MAX (5,3,4))', DEF_CONTEXT).value).toBe(
				'SUM (1,2,MAX  (0,3,2,1),4,MAX (5,3,4))'
			);
		});
		// DL-1529
		it('should keep leading or trailing spaces when parsing string', () => {
			expect(Parser.parseValue('   hello', DEF_CONTEXT).value).toBe('   hello');
			expect(Parser.parseValue('hello    ', DEF_CONTEXT).value).toBe('hello    ');
			expect(Parser.parseValue('   hi    ', DEF_CONTEXT).value).toBe('   hi    ');
		});
		it('should return string term if provided value is not a valid boolean or number', () => {
			expect(Parser.parseValue('true 12', DEF_CONTEXT).value).toBe('true 12');
			expect(Parser.parseValue('false42', DEF_CONTEXT).value).toBe('false42');
			expect(Parser.parseValue('0,00', DEF_CONTEXT).value).toBe('0,00');
			expect(Parser.parseValue('0,123', DEF_CONTEXT).value).toBe('0,123');
			// octal values in excel?
			expect(Parser.parseValue('0x00', DEF_CONTEXT).value).toBe('0x00');
			expect(Parser.parseValue('1 means', DEF_CONTEXT).value).toBe('1 means');
			expect(Parser.parseValue('42,', DEF_CONTEXT).value).toBe('42,');
			expect(Parser.parseValue('1. 23', DEF_CONTEXT).value).toBe('1. 23');
			expect(Parser.parseValue('1. topic', DEF_CONTEXT).value).toBe('1. topic');
			// change parameter separators
			const contextDE = new ParserContext();
			contextDE.separators = Locale.DE.separators;
			expect(Parser.parseValue('42,', contextDE).value).toBe(42);
			expect(Parser.parseValue('42,00', contextDE).value).toBe(42.0);
			expect(Parser.parseValue('23,ab', contextDE).value).toBe('23,ab');
			expect(Parser.parseValue('1.', contextDE).value).toBe('1.');
			expect(Parser.parseValue('23.45', contextDE).value).toBe('23.45');
		});
	});
	describe('getFormulaInfos', () => {
		it('should return a list of info objects for given formula', () => {
			const ctxt = new ParserContext();
			const infos = Parser.getFormulaInfos('sum(B1)', ctxt);
			expect(infos).toBeDefined();
			expect(infos.length).toBe(2);
			expectInfo(infos[0]).toContain({ start: 0, end: 7, type: 'function', value: 'sum' });
			expectInfo(infos[1]).toContain({ start: 4, end: 6, type: 'identifier', value: 'B1' });
		});
		it('should return a sorted list of info objects', () => {
			const ctxt = new ParserContext();
			const infos = Parser.getFormulaInfos('sum(12)+sum(34)', ctxt);
			expect(infos).toBeDefined();
			expect(infos.length).toBe(5);
			expectInfo(infos[0]).toContain({ start: 0, end: 15, type: 'binaryop', value: '+' });
			expectInfo(infos[1]).toContain({ start: 0, end: 7, type: 'function', value: 'sum' });
			expectInfo(infos[2]).toContain({ start: 4, end: 6, type: 'number', value: '12' });
			expectInfo(infos[3]).toContain({ start: 8, end: 15, type: 'function', value: 'sum' });
			expectInfo(infos[4]).toContain({ start: 12, end: 14, type: 'number', value: '34' });
		});
		it('should sort returned list by start position', () => {
			const ctxt = new ParserContext();
			const infos = Parser.getFormulaInfos('sum(B1,sum(A1))', ctxt);
			expect(infos.length).toBe(4);
			const ascending = infos.every((info, index) => index < 1 || info.start > infos[index - 1].start);
			expect(ascending).toBeTruthy();
			expectInfo(infos[0]).toContain({ start: 0, end: 15, type: 'function', value: 'sum' });
			expectInfo(infos[1]).toContain({ start: 4, end: 6, type: 'identifier', value: 'B1' });
			expectInfo(infos[2]).toContain({ start: 7, end: 14, type: 'function', value: 'sum' });
			expectInfo(infos[3]).toContain({ start: 11, end: 13, type: 'identifier', value: 'A1' });
		});
		it('should return empty list for empty formula', () => {
			const ctxt = new ParserContext();
			expect(Parser.getFormulaInfos('', ctxt)).toEqual([]);
			expect(Parser.getFormulaInfos(null, ctxt)).toEqual([]);
			expect(Parser.getFormulaInfos(undefined, ctxt)).toEqual([]);
		});
		it('should contain info about brackets positions', () => {
			const ctxt = new ParserContext();
			// simple formula
			let infos = Parser.getFormulaInfos('sum(B1)', ctxt);
			expectInfo(infos[0]).toContain({ value: 'sum', brackets: { open: 3, close: 6 } });
			expectInfo(infos[1]).toContain({ value: 'B1', brackets: { open: -1, close: -1 } });
			// nested formula
			infos = Parser.getFormulaInfos('sum(sum(B1))', ctxt);
			expectInfo(infos[0]).toContain({ value: 'sum', brackets: { open: 3, close: 11 } });
			expectInfo(infos[1]).toContain({ value: 'sum', brackets: { open: 7, close: 10 } });
			expectInfo(infos[2]).toContain({ value: 'B1', brackets: { open: -1, close: -1 } });
			// formula with operation, e.g. sum + sum
			infos = Parser.getFormulaInfos('sum(A1) + sum(B1)', ctxt);
			expectInfo(infos[0]).toContain({ value: '+', brackets: { open: -1, close: -1 } });
			expectInfo(infos[1]).toContain({ value: 'sum', brackets: { open: 3, close: 6 } });
			expectInfo(infos[2]).toContain({ value: 'A1', brackets: { open: -1, close: -1 } });
			expectInfo(infos[3]).toContain({ value: 'sum', brackets: { open: 13, close: 16 } });
			expectInfo(infos[4]).toContain({ value: 'B1', brackets: { open: -1, close: -1 } });
			// nested formula with operation
			infos = Parser.getFormulaInfos('1*sum(sum(B1))', ctxt);
			expectInfo(infos[0]).toContain({ value: '*', brackets: { open: -1, close: -1 } });
			expectInfo(infos[1]).toContain({ value: '1', brackets: { open: -1, close: -1 } });
			expectInfo(infos[2]).toContain({ value: 'sum', brackets: { open: 5, close: 13 } });
			expectInfo(infos[3]).toContain({ value: 'sum', brackets: { open: 9, close: 12 } });
			expectInfo(infos[4]).toContain({ value: 'B1', brackets: { open: -1, close: -1 } });
			// some special cases like =sum(1,2,)
			infos = Parser.getFormulaInfos('sum(sum(B1,1,),)', ctxt);
			expectInfo(infos[0]).toContain({ value: 'sum', brackets: { open: 3, close: 15 } });
			expectInfo(infos[1]).toContain({ value: 'sum', brackets: { open: 7, close: 13 } });
			expectInfo(infos[2]).toContain({ value: 'B1', brackets: { open: -1, close: -1 } });
			expectInfo(infos[3]).toContain({ value: '1', brackets: { open: -1, close: -1 } });
			// test with condition
			infos = Parser.getFormulaInfos('?(sum(B1,1,),max(42,23))', ctxt);
			expectInfo(infos[0]).toContain({ type: 'condition', brackets: { open: 1, close: 23 } });
			expectInfo(infos[1]).toContain({ value: 'sum', brackets: { open: 5, close: 11 } });
			expectInfo(infos[2]).toContain({ value: 'B1', brackets: { open: -1, close: -1 } });
			expectInfo(infos[3]).toContain({ value: '1', brackets: { open: -1, close: -1 } });
			expectInfo(infos[5]).toContain({ value: 'max', brackets: { open: 16, close: 22 } });
		});
		it('should support simple group/precedence brackets', () => {
			const ctxt = new ParserContext();
			let infos = Parser.getFormulaInfos('1 * (3 + 4)', ctxt);
			expectInfo(infos[0]).toContain({ value: '*', brackets: { open: -1, close: -1 } });
			expectInfo(infos[1]).toContain({ value: '1', brackets: { open: -1, close: -1 } });
			expectInfo(infos[2]).toContain({ value: '+', brackets: { open: 4, close: 10 } });
			expectInfo(infos[3]).toContain({ value: '3', brackets: { open: -1, close: -1 } });
			expectInfo(infos[4]).toContain({ value: '4', brackets: { open: -1, close: -1 } });
			infos = Parser.getFormulaInfos('1 * (1 + 2 + 3)', ctxt);
			expectInfo(infos[0]).toContain({ value: '*', brackets: { open: -1, close: -1 } });
			expectInfo(infos[2]).toContain({ value: '+', brackets: { open: 4, close: 14 } });
			expectInfo(infos[3]).toContain({ value: '+', brackets: { open: -1, close: -1 } });
			expectInfo(infos[4]).toContain({ value: '1', brackets: { open: -1, close: -1 } });
			expectInfo(infos[5]).toContain({ value: '2', brackets: { open: -1, close: -1 } });
			expectInfo(infos[6]).toContain({ value: '3', brackets: { open: -1, close: -1 } });
			infos = Parser.getFormulaInfos('5 * ((1 - 2) * 2)', ctxt);
			expectInfo(infos[0]).toContain({ value: '*', brackets: { open: -1, close: -1 } });
			expectInfo(infos[2]).toContain({ value: '*', brackets: { open: 4, close: 16 } });
			expectInfo(infos[3]).toContain({ value: '-', brackets: { open: 5, close: 11 } });
			expectInfo(infos[4]).toContain({ value: '1', brackets: { open: -1, close: -1 } });
			expectInfo(infos[5]).toContain({ value: '2', brackets: { open: -1, close: -1 } });
			expectInfo(infos[6]).toContain({ value: '2', brackets: { open: -1, close: -1 } });
		});
		it('should contain -1 for missing bracket', () => {
			const ctxt = new ParserContext();
			ctxt.ignoreErrors = true;
			// simple formula
			let infos = Parser.getFormulaInfos('sum(B1', ctxt);
			expectInfo(infos[0]).toContain({ value: 'sum', brackets: { open: 3, close: -1 } });
			infos = Parser.getFormulaInfos('sum(sum(B1)', ctxt);
			expectInfo(infos[0]).toContain({ value: 'sum', brackets: { open: 3, close: -1 } });
			expectInfo(infos[1]).toContain({ value: 'sum', brackets: { open: 7, close: 10 } });
			infos = Parser.getFormulaInfos('sum(A1 + sum(B1', ctxt);
			expectInfo(infos[0]).toContain({ value: 'sum', brackets: { open: 3, close: -1 } });
			expectInfo(infos[3]).toContain({ value: 'sum', brackets: { open: 12, close: -1 } });
			infos = Parser.getFormulaInfos('1*sum(sum(B1', ctxt);
			expectInfo(infos[2]).toContain({ value: 'sum', brackets: { open: 5, close: -1 } });
			expectInfo(infos[3]).toContain({ value: 'sum', brackets: { open: 9, close: -1 } });
			infos = Parser.getFormulaInfos('sum(sum(B1,1,,)', ctxt);
			expectInfo(infos[0]).toContain({ value: 'sum', brackets: { open: 3, close: -1 } });
			expectInfo(infos[1]).toContain({ value: 'sum', brackets: { open: 7, close: 14 } });
			// test with condition
			infos = Parser.getFormulaInfos('?(sum(B1,1,),max(42,23', ctxt);
			expectInfo(infos[0]).toContain({ type: 'condition', brackets: { open: 1, close: -1 } });
			expectInfo(infos[1]).toContain({ value: 'sum', brackets: { open: 5, close: 11 } });
			expectInfo(infos[5]).toContain({ value: 'max', brackets: { open: 16, close: -1 } });
		});
	});
	describe('toString', () => {
		it('should return string representation', () => {
			validateToString('-2');
			validateToString('(0-1)*-2');
			validateToString('3--4');
			validateToString('4/2+4/2*-0.97*(1-3*2)');
			validateToString('-2*-2');
			validateToString('2*-(2+1)');
			validateToString('-1<=1-1');
		});
	});
});
