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
const { Operand, Parser, ParserContext } = require('..');

const DEF_CONTEXT = new ParserContext();

const validateTermIsInvalid = (term) => {
	expect(term).toBeDefined();
	expect(term.isInvalid).toBeTruthy();
};

describe('Transformer', () => {
	test('simple expressions', () => {
		expect(Parser.parse('1+1', DEF_CONTEXT).value).toBe(2);
		expect(Parser.parse('-1+1', DEF_CONTEXT).value).toBe(0);

		expect(Parser.parse('1 * 2', DEF_CONTEXT).value).toBe(2);
		expect(Parser.parse('42--23', DEF_CONTEXT).value).toBe(65);
		expect(Parser.parse('-3+-2', DEF_CONTEXT).value).toBe(-5);

		expect(Parser.parse('(0-1)*-2', DEF_CONTEXT).value).toBe(2);
		expect(Parser.parse('(1-1)*-2', DEF_CONTEXT).value).toBe(0);
		expect(Parser.parse('(2-1)*-2', DEF_CONTEXT).value).toBe(-2);
		expect(Parser.parse('4 / 2 + 4 / 2 * -0.97 * (1 - 3 * 2)', DEF_CONTEXT).value).toBe(11.7);

		expect(Parser.parse('200 * -3.12344e-16', DEF_CONTEXT).value).toBeLessThan(Number(1e-13));
		expect(Parser.parse('400 / 2 + 400 / 2 * 0.5 * (1 - 2 * 2)', DEF_CONTEXT).value).toBe(-100);
	});
	test('simple boolean', () => {
		expect(Parser.parse('2+2=4', DEF_CONTEXT).value).toBe(true);
		expect(Parser.parse('2+2=2*2', DEF_CONTEXT).value).toBe(true);
	});
	test('precedence & groups', () => {
		expect(Parser.parse('2+2*2', DEF_CONTEXT).value).toBe(6);
		expect(Parser.parse('4*4+4', DEF_CONTEXT).value).toBe(20);
		expect(Parser.parse('.2*1.1-0.22+.5', DEF_CONTEXT).value).toBeGreaterThanOrEqual(0.5);
		expect(Parser.parse('(2+2)*2', DEF_CONTEXT).value).toBe(8);
		expect(Parser.parse('(2*(2+2)+2)*2', DEF_CONTEXT).value).toBe(20);
		expect(Parser.parse('3+2*2+3', DEF_CONTEXT).value).toBe(10);
		expect(Parser.parse('1* -2', DEF_CONTEXT).value).toBe(-2);
		expect(Parser.parse('1* +2', DEF_CONTEXT).value).toBe(2);
		expect(Parser.parse('-2*-2', DEF_CONTEXT).value).toBe(4);
		expect(Parser.parse('-2++2', DEF_CONTEXT).value).toBe(0);
		expect(Parser.parse('2+-2', DEF_CONTEXT).value).toBe(0);
		expect(Parser.parse('2 + -2', DEF_CONTEXT).value).toBe(0);
		expect(Parser.parse('2*-(2+1)', DEF_CONTEXT).value).toBe(-6);
		expect(Parser.parse('(5-1)*-2', DEF_CONTEXT).value).toBe(-8);
		expect(Parser.parse('5<1', DEF_CONTEXT).value).toBe(false);
		expect(Parser.parse('  5  >   1  ', DEF_CONTEXT).value).toBe(true);
		expect(Parser.parse('2 >=  1 +  1', DEF_CONTEXT).value).toBe(true);
		expect(Parser.parse('-1<=1-1', DEF_CONTEXT).value).toBe(true);
	});

	test('unary op', () => {
		expect(Parser.parse('!true', DEF_CONTEXT).value).toBe(false);
		expect(Parser.parse('-2', DEF_CONTEXT).value).toBe(-2);
		expect(Parser.parse('+-2', DEF_CONTEXT).value).toBe(-2);
	});
	test('unit op', () => {
		expect(Parser.parse('5%', DEF_CONTEXT).value).toBe(0.05);
		expect(Parser.parse('2+5%', DEF_CONTEXT).value).toBe(2.05);
		expect(Parser.parse('(2+5)%', DEF_CONTEXT).value).toBe(0.07);
		expect(Parser.parse('2%+5%', DEF_CONTEXT).value).toBe(0.07);
		expect(Parser.parse('2+5%+3', DEF_CONTEXT).value).toBe(5.05);
		// should distinguish from modulo operator:
		expect(Parser.parse('5%2', DEF_CONTEXT).value).toBe(1);
		// should be useable within functions
		expect(Parser.parse('SUM(5%)', DEF_CONTEXT).value).toBe(0.05);
		expect(Parser.parse('SUM(5%, 5)', DEF_CONTEXT).value).toBe(5.05);
		expect(Parser.parse('SUM(2,3,5%)', DEF_CONTEXT).value).toBe(5.05);
		expect(Parser.parse('SUM(2,3,5%,4)', DEF_CONTEXT).value).toBe(9.05);
		expect(Parser.parse('SUM(5%,5%2,5%)', DEF_CONTEXT).value).toBe(1.1);
		expect(Parser.parse('SUM(5%,5%2)', DEF_CONTEXT).value).toBe(1.05);
		expect(Parser.parse('SUM(5%2)', DEF_CONTEXT).value).toBe(1);
	});
	test('JIRA bugs', () => {
		const HEIGHT = 8;
		const DEPTH = 2;
		// eslint-disable-next-line
		expect(Parser.parse(`${HEIGHT} / 2 + ${HEIGHT} / 2 * -0.71 * (1 - ${DEPTH} * 2)`, DEF_CONTEXT).value).toBe(12.52);
		expect(Parser.parse(`${HEIGHT} / 2 + ${HEIGHT} / 2 * -0.5 * (1 - ${DEPTH} * 2)`, DEF_CONTEXT).value).toBe(10);
	});
	test('toString', () => {
		expect(Parser.parse('-2', DEF_CONTEXT).toString()).toBe('-2');
		expect(Parser.parse('(0-1)*-2', DEF_CONTEXT).toString()).toBe('(0-1)*-2');
		expect(Parser.parse('3--4', DEF_CONTEXT).toString()).toBe('3--4');
		expect(Parser.parse('4/2+4/2*-0.97*(1-3*2)', DEF_CONTEXT).toString()).toBe('4/2+4/2*-0.97*(1-3*2)');
		expect(Parser.parse('-2*-2', DEF_CONTEXT).toString()).toBe('-2*-2');
		expect(Parser.parse('2*-(2+1)', DEF_CONTEXT).toString()).toBe('2*-(2+1)');
		expect(Parser.parse('-1<=1-1', DEF_CONTEXT).toString()).toBe('-1<=1-1');
		expect(Parser.parse('5%', DEF_CONTEXT).toString()).toBe('5%');
		expect(Parser.parse('2+5%', DEF_CONTEXT).toString()).toBe('2+5%');
		expect(Parser.parse('(2+5)%', DEF_CONTEXT).toString()).toBe('(2+5)%');
		expect(Parser.parse('2%+5%', DEF_CONTEXT).toString()).toBe('2%+5%');
		expect(Parser.parse('2+5%+3', DEF_CONTEXT).toString()).toBe('2+5%+3');
	});

	test('reference usage', () => {
		const testexpr = 'Item.3!WIDTH*0.5';
		const term = Parser.parse(testexpr, DEF_CONTEXT);
		expect(term.operator.symbol).toBe('*');
		expect(term.left.value).toBe('Item.3!WIDTH');
		expect(term.right.value).toBe(0.5);
	});
	test('string parsing', () => {
		let formula = '"  hallo Item.1 != <= => model.attributes:SYMBOL ()"';
		let term = Parser.parse(formula, DEF_CONTEXT);
		expect(term.left).toBeUndefined();
		expect(term.right).toBeUndefined();
		expect(term.operand.type).toBe(Operand.TYPE.STRING);
		expect(term.value).toBe('  hallo Item.1 != <= => model.attributes:SYMBOL ()');

		formula = '"?(3+3>1 & 4+3<1, a, b)"';
		term = Parser.parse(formula, DEF_CONTEXT);
		expect(term.operand.type).toBe(Operand.TYPE.STRING);
		expect(term.value).toBe('?(3+3>1 & 4+3<1, a, b)');

		formula = '"A1:D4"';
		term = Parser.parse(formula, DEF_CONTEXT);
		expect(term.operand.type).toBe(Operand.TYPE.STRING);
		expect(term.value).toBe('A1:D4');

		expect(Parser.parse('"http://linktome.de"', DEF_CONTEXT).value).toBe('http://linktome.de');
		expect(Parser.parse('"http://localhost/jsg/JSG/js-src/jsgDemo/index.html"', DEF_CONTEXT).value)
			.toBe('http://localhost/jsg/JSG/js-src/jsgDemo/index.html');
		expect(Parser.parse('"http://msdn.microsoft.com/en-us/library/ie/gg699341.aspx"', DEF_CONTEXT).value)
			.toBe('http://msdn.microsoft.com/en-us/library/ie/gg699341.aspx');
		// eslint-disable-next-line
		expect(Parser.parse('"http://blabla.de/?utm_source=feedburner&utm_campaign=Feed%3A+blub%2FdqXM+%28&utm_content"', DEF_CONTEXT).value)
			.toBe('http://blabla.de/?utm_source=feedburner&utm_campaign=Feed%3A+blub%2FdqXM+%28&utm_content');
	});

	test('function parsing', () => {
		const context = new ParserContext();
		// define some functions
		context.setFunction('SuM', (scope, ...params) => {
			let sum = 0;
			for (let i = 0, n = params.length; i < n; i += 1) {
				sum += params[i].value;
			}
			return sum;
		});
		context.setFunction('pi', () => Math.PI);
		context.setFunction('MAX', (scope, ...params) => {
			let max = Number.MIN_VALUE;
			let value;
			for (let i = 0, n = params.length; i < n; i += 1) {
				value = params[i].value;
				max = value > max ? value : max;
			}
			return max;
		});
		expect(Parser.parse('SUM(1,2,3,4,5)', context).value).toBe(15);
		expect(Parser.parse('SUM(1,2,3,4) + MAX(5,3,4)', context).value).toBe(15);
		expect(Parser.parse('SUM (1,2,MAX  (0,3,2,1),4,MAX (5,3,4))', context).value).toBe(15);
		expect(Parser.parse('maX(2, sum(1,2,3,4), 23, 9, 8)', context).value).toBe(23);
		expect(Parser.parse('PI() + 1', context).value).toBe((Math.PI + 1));
	});

	test('ignoring error should mark term as invalid on error', () => {
		const context = new ParserContext();
		context.ignoreErrors = true;
		// parse some more invalid formula:
		validateTermIsInvalid(Parser.parse('sum(a', context));
		validateTermIsInvalid(Parser.parse('SUM (1,2,tach  (0,3,2,1),4,MAX (5,3,4)', context));
		validateTermIsInvalid(Parser.parse('4/2+4/2*-0.97*(1-3*2', context));
		validateTermIsInvalid(Parser.parse('Y / 2 + Y / 2 * -0.97 * (1 -  * 2)', context));
	});
});
