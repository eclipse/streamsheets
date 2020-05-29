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
const { Parser, ParserContext } = require('..');

const DEF_CONTEXT = new ParserContext();

const expectInfoHas = (info, has) => {
	Object.entries(has).forEach(([key, value]) => {
		try {
			expect(info[key]).toBe(value);
		} catch (err) {
			throw new Error(
				`Error: expect().toBe()\nKey: ${key}\nExpected value:\n\t${value}\nReceived:\n\t${info[key]}`
			);
		}
	});
};
const expectConditionTerm = (term, ...params) => {
	expect(term).toBeDefined();
	expect(term.params.length).toBe(params.length);
	params.forEach((value, index) => expect(term.params[index].value).toBe(value));
};

describe('parsing conditions', () => {
	it('should parse conditions with ?', () => {
		expect(Parser.parse('.5*?(3>2,250,"falsch")', DEF_CONTEXT).value).toBe(125);

		expect(Parser.parse('?(4!=2,1,0)', DEF_CONTEXT).value).toBe(1);
		expect(Parser.parse('?(4>=2,1,0)', DEF_CONTEXT).value).toBe(1);
		expect(Parser.parse('?(4<=2,1,0)', DEF_CONTEXT).value).toBe(0);
		expect(Parser.parse('?(-4<=2,1,0)', DEF_CONTEXT).value).toBe(1);
		expect(Parser.parse('?(4==2,1,0)', DEF_CONTEXT).value).toBe(0);
		expect(Parser.parse('?(4==4,1,0)', DEF_CONTEXT).value).toBe(1);

		expect(Parser.parse('?(3+3>1 & 4+3<1, a, b)', DEF_CONTEXT).value).toBe('b');
		expect(Parser.parse('?(3+3>1 | 4+3<1, a, b)', DEF_CONTEXT).value).toBe('a');

		expect(Parser.parse('2+2*?(4>1,2,0)', DEF_CONTEXT).value).toBe(6);
		expect(Parser.parse('.5*?(3>2,250,"falsch")', DEF_CONTEXT).value).toBe(125);
		expect(Parser.parse('?(1+2>0,"ja", "no")', DEF_CONTEXT).value).toBe('ja');
		expect(Parser.parse('?(5>1, "YES", "NO")', DEF_CONTEXT).value).toBe('YES');
		expect(Parser.parse('?(3, ?(4 < 2, 42, 43), 44)', DEF_CONTEXT).value).toBe(43);
		expect(Parser.parse('?(5>1, ?(5<1, "mm", 42), "NO")', DEF_CONTEXT).value).toBe(42);
		expect(Parser.parse('?(3+2 > 1, ?(4 + 2 < 2, 42, 43), 44)', DEF_CONTEXT).value).toBe(43);

		expect(Parser.parse('?(4,2,0)', DEF_CONTEXT).value).toBe(2);
		expect(Parser.parse('?(4==,2,0)', DEF_CONTEXT).value).toBe(0);
		expect(Parser.parse('?("hallo",2,0)', DEF_CONTEXT).value).toBe(2);
	});
	it('should parse conditions with IF', () => {
		expect(Parser.parse('.5*IF(3>2,250,"falsch")', DEF_CONTEXT).value).toBe(125);
		expect(Parser.parse('if ("IF",2,0)', DEF_CONTEXT).value).toBe(2);
		expect(Parser.parse('iF("IF"=="if",2,4)', DEF_CONTEXT).value).toBe(4);
		expect(Parser.parse('If (4<=2,1,0)', DEF_CONTEXT).value).toBe(0);
		expect(Parser.parse('iF     (-4<=2,1,0)', DEF_CONTEXT).value).toBe(1);
		// notes this:
		expect(Parser.parse('iF + of', DEF_CONTEXT).value).toBe('iFof');
	});
	it('should support optional FALSE parameter', () => {
		expect(Parser.parse('IF(4>2,2)', DEF_CONTEXT).value).toBe(2);
		expect(Parser.parse('IF(4<2,2)', DEF_CONTEXT).value).toBe(null);
		expect(Parser.parse('IF(4<2,3,"hi")', DEF_CONTEXT).value).toBe('hi');
		expect(Parser.parse('IF(4>2,1)', DEF_CONTEXT).value).toBe(1);
		expect(Parser.parse('IF(4<2,1)', DEF_CONTEXT).value).toBe(null);
	});
	it('should return string expression of parsed conditions', () => {
		expect(Parser.parse('If (4<=2,1,0)', DEF_CONTEXT).toString()).toBe('IF(4<=2,1,0)');
		expect(Parser.parse('if     (-4<=2,1,0)', DEF_CONTEXT).toString()).toBe('IF(-4<=2,1,0)');
		expect(Parser.parse('?(5>1, "YES", "NO")', DEF_CONTEXT).toString()).toBe('?(5>1,"YES","NO")');
		expect(Parser.parse('?(3+3>1 & 4+3<1, a, b))', DEF_CONTEXT).toString()).toBe('?(3+3>1&4+3<1,"a","b")');
	});
	it('should work with references', () => {
		const testexpr = '?(Item.4!SYMBOL:reference!="","", "undefined")';
		const term = Parser.parse(testexpr, DEF_CONTEXT);
		expect(term.condition).toBeDefined();
		expect(term.condition.left.value).toBe('Item.4!SYMBOL:reference');
		expect(term.condition.operator.symbol).toBe('!=');
	});
});
describe('parsing invalid conditions', () => {
	const context = new ParserContext();
	context.ignoreErrors = true;

	it('should mark returned term as invalid', () => {
		expect(Parser.parse('?(3+3 1 & 4+3<1, a)', context).isInvalid).toBeTruthy();
		expect(Parser.parse('?(Item.4!SYMBOL:reference!="")', context).isInvalid).toBeTruthy();
		expect(Parser.parse('?(3+2 > 1, ?(4 + 2 < 2, 42, 43, 44)', context).isInvalid).toBeTruthy();
	});
	it('should return recognized terms so far', () => {
		const term = Parser.parse('if(1,"sa', context);
		const params = term.params;
		expect(term.isInvalid).toBe(true);
		expect(params.length).toBe(2);
		expect(params[0].value).toBe(1);
		expect(params[1].value).toBe('sa');
		// additional tests
		expectConditionTerm(Parser.parse('if(', context), null);
		expectConditionTerm(Parser.parse('if(,,', context), null, null, null);
		expectConditionTerm(Parser.parse('if(1', context), 1);
		expectConditionTerm(Parser.parse('if(1,', context), 1, null);
		expectConditionTerm(Parser.parse('if(1,,', context), 1, null, null);
		expectConditionTerm(Parser.parse('if(1,,"h', context), 1, null, 'h');
		expectConditionTerm(Parser.parse('if(1,,"h)', context), 1, null, 'h)');
		expectConditionTerm(Parser.parse('if(1,(2', context), 1, 2);
	});
	it('should parse info of invalid condition', () => {
		let info = Parser.getFormulaInfos('if(1,"sa', context);
		expect(info).toBeDefined();
		expect(info.length).toBe(3);
		expectInfoHas(info[0], { start: 0, end: 8, paramIndex: undefined, type: 'function', value: 'if' });
		expectInfoHas(info[1], { start: 3, end: 4, paramIndex: 0, type: 'number', value: '1' });
		expectInfoHas(info[2], { start: 5, end: 8, paramIndex: 1, type: 'string', value: 'sa' });

		info = Parser.getFormulaInfos('if(1', context);
		expect(info).toBeDefined();
		expect(info.length).toBe(2);
		expectInfoHas(info[0], { start: 0, end: 4, paramIndex: undefined, type: 'function', value: 'if' });
		expectInfoHas(info[1], { start: 3, end: 4, paramIndex: 0, type: 'number', value: '1' });

		info = Parser.getFormulaInfos('if(1,s', context);
		expect(info).toBeDefined();
		expect(info.length).toBe(3);
		expectInfoHas(info[0], { start: 0, end: 6, paramIndex: undefined, type: 'function', value: 'if' });
		expectInfoHas(info[1], { start: 3, end: 4, paramIndex: 0, type: 'number', value: '1' });
		expectInfoHas(info[2], { start: 5, end: 6, paramIndex: 1, type: 'identifier', value: 's' });

		info = Parser.getFormulaInfos('if(1,sum,s', context);
		expect(info.length).toBe(4);
		expectInfoHas(info[0], { start: 0, end: 10, paramIndex: undefined, type: 'function', value: 'if' });
		expectInfoHas(info[1], { start: 3, end: 4, paramIndex: 0, type: 'number', value: '1' });
		expectInfoHas(info[2], { start: 5, end: 8, paramIndex: 1, type: 'identifier', value: 'sum' });
		expectInfoHas(info[3], { start: 9, end: 10, paramIndex: 2, type: 'identifier', value: 's' });

		info = Parser.getFormulaInfos('if(12,"sum",', context);
		expect(info.length).toBe(4);
		expectInfoHas(info[0], { start: 0, end: 12, paramIndex: undefined, type: 'function', value: 'if' });
		expectInfoHas(info[1], { start: 3, end: 5, paramIndex: 0, type: 'number', value: '12' });
		expectInfoHas(info[2], { start: 6, end: 11, paramIndex: 1, type: 'string', value: 'sum' });
		expectInfoHas(info[3], { start: 12, end: 13, paramIndex: 2, type: 'undef', value: undefined });

		info = Parser.getFormulaInfos('if("s', context);
		expect(info.length).toBe(2);
		expectInfoHas(info[0], { start: 0, end: 5, paramIndex: undefined, type: 'function', value: 'if' });
		expectInfoHas(info[1], { start: 3, end: 5, paramIndex: 0, type: 'string', value: 's' });
	});
	// DL-2704
	it('should sort operator before its operands', () => {
		const info = Parser.getFormulaInfos('if(and(1,2)=true,42,23)', context);
		expect(info).toBeDefined();
		expect(info.length).toBe(8);
		expectInfoHas(info[0], { start: 0, end: 23, paramIndex: undefined, type: 'function' });
		expectInfoHas(info[1], { start: 3, end: 16, paramIndex: 0, type: 'binaryop' });
		expectInfoHas(info[2], { start: 3, end: 11, paramIndex: undefined, type: 'function', value: 'and' });
		expectInfoHas(info[3], { start: 7, end: 8, paramIndex: 0, type: 'number', value: '1' });
		expectInfoHas(info[4], { start: 9, end: 10, paramIndex: 1, type: 'number', value: '2' });
		expectInfoHas(info[5], { start: 12, end: 16, paramIndex: undefined, type: 'identifier', value: 'true' });
		expectInfoHas(info[6], { start: 17, end: 19, paramIndex: 1, type: 'number', value: '42' });
		expectInfoHas(info[7], { start: 20, end: 22, paramIndex: 2, type: 'number', value: '23' });
	});
});

