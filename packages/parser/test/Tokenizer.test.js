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
const Locale = require('../src/Locale');
const { Operand } = require('../src/Operand');
const Parser = require('../src/Parser');
const ParserContext = require('../src/ParserContext');
const Tokenizer = require('../src/Tokenizer');

const DEF_CONTEXT = new ParserContext();

const validateResult = (expr, result, context = DEF_CONTEXT) => {
	const ast = Tokenizer.createAST(expr, context);
	expect(ast).toBeDefined();
	expect(Parser.resultFrom(ast, context)).toBe(result);
};

describe('Tokenizer', () => {
	describe('createAST', () => {
		it('should parse simple values', () => {
			let ast = Tokenizer.createAST('100', DEF_CONTEXT);
			expect(ast.type).toBe(Operand.TYPE.NUMBER);
			expect(ast.value).toBe('100');
			ast = Tokenizer.createAST('100mV', DEF_CONTEXT);
			expect(ast.type).toBe('identifier');
			expect(ast.value).toBe('100mV');
			ast = Tokenizer.createAST('100m', DEF_CONTEXT);
			expect(ast.type).toBe('identifier');
			expect(ast.value).toBe('100m');
			ast = Tokenizer.createAST('1.', DEF_CONTEXT);
			expect(ast.value).toBe('1.');
			expect(ast.type).toBe('number');
		});
		it('should parse simple expressions', () => {
			let testexpr = '1+1';
			let ast = Tokenizer.createAST(testexpr, DEF_CONTEXT);
			expect(ast).toBeDefined();
			expect(Parser.resultFrom(ast)).toBe(2);

			testexpr = '-1+1';
			ast = Tokenizer.createAST(testexpr, DEF_CONTEXT);
			expect(Parser.resultFrom(ast)).toBe(0);


			validateResult('1 * 2', 2);
			validateResult('42--23', 65);
			validateResult('-3+-2', -5);

			validateResult('"http://linktome.de"', 'http://linktome.de');
			validateResult('"http://localhost/jsg/JSG/js-src/jsgDemo/index.html"',
				'http://localhost/jsg/JSG/js-src/jsgDemo/index.html');
			validateResult('"http://msdn.microsoft.com/en-us/library/ie/gg699341.aspx"',
				'http://msdn.microsoft.com/en-us/library/ie/gg699341.aspx');
			validateResult('"http://blabla.de/?utm_source=feedburner&utm_campaign=Feed%3A+blub%2FdqXM+%28&utm_content"',
				'http://blabla.de/?utm_source=feedburner&utm_campaign=Feed%3A+blub%2FdqXM+%28&utm_content');

			testexpr = '(x-1)*-2';
			ast = Tokenizer.createAST(testexpr, DEF_CONTEXT);
			expect(ast.operator).toBe('*');
			expect(ast.left.operator).toBe('-');
			expect(ast.right.operator).toBe('-');

			// same expression with x = 1...
			validateResult('(0-1)*-2', 2);
			validateResult('(1-1)*-2', 0);
			validateResult('(2-1)*-2', -2);

			testexpr = 'Y / 2 + Y / 2 * -0.97 * (1 - X * 2)';
			ast = Tokenizer.createAST(testexpr, DEF_CONTEXT);
			expect(ast.operator).toBe('+');
			expect(ast.left.operator).toBe('/');
			expect(ast.right.operator).toBe('*');
			// same expression with Y = 4 & X = 3
			validateResult('4 / 2 + 4 / 2 * -0.97 * (1 - 3 * 2)', 11.7);

			testexpr = '(1 - DEPTH * 2)';
			ast = Tokenizer.createAST(testexpr, DEF_CONTEXT);
			expect(ast.operator).toBe('-');
			expect(ast.left.value).toBe('1');
			expect(ast.right.operator).toBe('*');
			expect(ast.right.left.value).toBe('DEPTH');

			testexpr = '!3+2';
			ast = Tokenizer.createAST(testexpr, DEF_CONTEXT);
			expect(ast.operator).toBe('+');
			expect(ast.left.operator).toBe('!');
			expect(ast.right.value).toBe('2');

			testexpr = '200 * -3.12344e-16'; // -9.094947017729282e-13
			ast = Tokenizer.createAST(testexpr, DEF_CONTEXT);
			expect(ast.operator).toBe('*');
			expect(Math.abs(Parser.resultFrom(ast))).toBeLessThan(Number(1e-13));

			// some new equal tests:
			validateResult('2+2=4', true);
			validateResult('2+2=2*2', true);
		});
		it('should handle precedence', () => {
			validateResult('2+2*2', 6);
			validateResult('4*4+4', 20);
			validateResult('3+2*2+3', 10);
			validateResult('1* -2', -2);
			validateResult('1* +2', 2);
			validateResult('-2*-2', 4);
			validateResult('-2++2', 0);
			validateResult('2+-2', 0);
			validateResult('2 + -2', 0);
		});
		it('should respect groups', () => {
			validateResult('(2+2)*2', 8);
			validateResult('(2*(2+2)+2)*2', 20);
			validateResult('2*-(2+1)', -6);
		});
		it('should recognize ?', () => {
			const testexpr = '.5*?(3>2,250,"falsch")';
			const ast = Tokenizer.createAST(testexpr, DEF_CONTEXT);
			expect(ast.operator).toBe('*');
			expect(ast.left.value).toBe('.5');
			expect(ast.right.condition).toBeDefined();
			expect(Parser.resultFrom(ast.right)).toBe(250);

			validateResult('?(4!=2,1,0)', 1);
			validateResult('?(4>=2,1,0)', 1);
			validateResult('?(4<=2,1,0)', 0);
			validateResult('?(-4<=2,1,0)', 1);
			validateResult('?(4==2,1,0)', 0);
			validateResult('?(4==4,1,0)', 1);

			validateResult('?(3+3>1 & 4+3<1, a, b)', 'b');
			validateResult('?(3+3>1 | 4+3<1, a, b)', 'a');

			validateResult('2+2*?(4>1,2,0)', 6);
			validateResult('.5*?(3>2,250,"falsch")', 125);
			validateResult('?(3+2 > 1, ?(4 + 2 < 2, 42, 43), 44)', 43);
			validateResult('?(1+2>0,"ja", "no")', 'ja');
			validateResult('(5-1)*-2', -8);
			validateResult('5<1', false);
			validateResult('  5  >   1  ', true);
			validateResult('2 >=  1 +  1', true);
			validateResult('-1<=1-1', true);
			validateResult('?(5>1, "YES", "NO")', 'YES');
			validateResult('?(5>1, ?(5<1, "mm", 42), "NO")', 42);

			validateResult('?(4,2,0)', 2);
			validateResult('?(4==,2,0)', 0);
			validateResult('?("hallo",2,0)', 2);
		});
		it('should support IF conditions', () => {
			validateResult('.5*IF(3>2,250,"falsch")', 125);
			validateResult('if ("IF",2,0)', 2);
			validateResult('iF("IF"=="if",2,4)', 4);
			validateResult('If (4<=2,1,0)', 0);
			validateResult('iF     (-4<=2,1,0)', 1);
			validateResult('iF(4<=2,1,)', null);
			// notes this:
			validateResult('iF + of', 'iFof');
		});
		it('should handle references', () => {
			let testexpr = 'Item.3!WIDTH*0.5';
			let ast = Tokenizer.createAST(testexpr, DEF_CONTEXT);
			expect(ast.operator).toBe('*');
			expect(ast.left.value).toBe('Item.3!WIDTH');
			expect(ast.right.value).toBe('0.5');

			testexpr = '?(Item.4!SYMBOL:reference!="","", "undefined")';
			ast = Tokenizer.createAST(testexpr, DEF_CONTEXT);
			expect(ast.condition).toBeDefined();
			expect(ast.condition.left.value).toBe('Item.4!SYMBOL:reference');
			expect(ast.condition.operator).toBe('!=');
		});
		it('should respect values marked as string', () => {
			// var formula = "WIDTH / 2 + WIDTH / 2 * 0.59 * (1 - DEPTH * 2)";
			let formula = '400 / 2 + 400 / 2 * 0.5 * (1 - 2 * 2)';
			validateResult(formula, -100);

			formula = '"  hallo Item.1 != <= => model.attributes:SYMBOL ()"';
			let ast = Tokenizer.createAST(formula, DEF_CONTEXT);
			expect(ast.left).toBeUndefined();
			expect(ast.right).toBeUndefined();
			expect(ast.type).toBe(Operand.TYPE.STRING);
			expect(ast.value).toBe('  hallo Item.1 != <= => model.attributes:SYMBOL ()');

			formula = '"?(3+3>1 & 4+3<1, a, b)"';
			ast = Tokenizer.createAST(formula, DEF_CONTEXT);
			expect(ast.type).toBe(Operand.TYPE.STRING);
			expect(ast.value).toBe('?(3+3>1 & 4+3<1, a, b)');

			formula = '"A1:D4"';
			ast = Tokenizer.createAST(formula, DEF_CONTEXT);
			expect(ast.type).toBe(Operand.TYPE.STRING);
			expect(ast.value).toBe('A1:D4');
		});
		it('should be possible to use vowels...', () => {
			const expr = 'ExakteÜbereinstimmung';
			const ast = Tokenizer.createAST(expr, DEF_CONTEXT);
			expect(ast).toBeDefined();
			expect(ast.type).toBe('identifier');
			expect(ast.value).toBe('ExakteÜbereinstimmung');
			expect(ast.left).toBeUndefined();
			expect(ast.right).toBeUndefined();
		});
		// DL-1111:
		it('should not allow 2 double or 2 single quotes in row at start or end', () => {
			// =EXECUTE("P1",1,SUBTREE(INBOXDATA(,,"”Program”")))
			expect(() => { Tokenizer.createAST('SUM(""Programmm"")', DEF_CONTEXT); }).toThrow();
			// NOTE left & right double quotes used!!!
			expect(() => { Tokenizer.createAST('"”Programmm”")', DEF_CONTEXT); }).toThrow();
		});
		// DL-1370
		it('should support identifiers of type "nr:nr", e.g. 1:1', () => {
			const expr = '1:1';
			const ast = Tokenizer.createAST(expr, DEF_CONTEXT);
			expect(ast).toBeDefined();
			expect(ast.type).toBe('identifier');
			expect(ast.value).toBe('1:1');
			expect(ast.left).toBeUndefined();
			expect(ast.right).toBeUndefined();
		});
	});
	describe('parsing functions', () => {
		const context = new ParserContext();
		// define some functions
		context.setFunction('SuM', (scope, ...params) => {
			let sum = 0;
			for (let i = 0, n = params.length; i < n; i += 1) {
				const param = params[i];
				sum += param.value != null ? param.value : param;
			}
			return sum;
		});
		context.setFunction('pi', () => Math.PI);
		context.setFunction('MAX', (scope, ...params) => {
			let max = Number.MIN_VALUE;
			let value;
			for (let i = 0, n = params.length; i < n; i += 1) {
				value = params[i].value != null ? params[i].value : params[i];
				max = value > max ? value : max;
			}
			return max;
		});
		it('should recognize registered functions ', () => {
			validateResult('SUM(1,2,3,4,5)', 15, context);
			validateResult('SUM(1,2,3,4) + MAX(5,3,4)', 15, context);
			validateResult('SUM (1,2,MAX  (0,3,2,1),4,MAX (5,3,4))', 15, context);
			validateResult('PI() + 1', (Math.PI + 1), context);
		});
		it('should ignore character case', () => {
			validateResult('maX(2, sum(1,2,3,4), 23, 9, 8)', 23, context);
		});
		it('should thrown an error on unknown functions', () => {
			expect(() => { Tokenizer.createAST('NEENEE(1,2,3,4,5)', DEF_CONTEXT); }).toThrow();
		});
		it('should support parameters for functions', () => {
			const _context = new ParserContext();
			_context.setFunction('test', () => {});
			let ast = Tokenizer.createAST('test(,,)', _context);
			expect(ast.params).toBeDefined();
			expect(ast.params.length).toBe(3);
			expect(ast.params[0].type).toBe('undef');
			expect(ast.params[0].value).toBeUndefined();
			expect(ast.params[1].type).toBe('undef');
			expect(ast.params[1].value).toBeUndefined();
			expect(ast.params[2].type).toBe('undef');
			expect(ast.params[2].value).toBeUndefined();
			
			ast = Tokenizer.createAST('test("","","")', _context);
			expect(ast.params).toBeDefined();
			expect(ast.params.length).toBe(3);
			expect(ast.params[0].type).toBe('string');
			expect(ast.params[0].value).toBe('');
			expect(ast.params[1].type).toBe('string');
			expect(ast.params[1].value).toBe('');
			expect(ast.params[2].type).toBe('string');
			expect(ast.params[2].value).toBe('');
		});
		
		// DL-3412
		it('should ignore IFs inside function names', () => {
			const _context = new ParserContext();
			_context.setFunction('COUNTIF', () => 'countif');
			_context.setFunction('COUNTIFS', () => 'countifs');
			validateResult('countif()', 'countif', _context);
			validateResult('countifs()', 'countifs', _context);
			validateResult('countIF()', 'countif', _context);
			validateResult('countIFS()', 'countifs', _context);
		});

		// DL-987
		it('should support list of reference for function parameters', () => {
			const _context = new ParserContext();
			_context.setFunction('test', () => {});
			const ast = Tokenizer.createAST('test([A1,B2],"Hello")', _context);
			expect(ast.params).toBeDefined();
			expect(ast.params.length).toBe(2);
			expect(ast.params[0].type).toBe('list');
			expect(ast.params[0].params.length).toBe(2);
			expect(ast.params[0].params[0].type).toBe('identifier');
			expect(ast.params[0].params[0].value).toBe('A1');
			expect(ast.params[0].params[1].type).toBe('identifier');
			expect(ast.params[0].params[1].value).toBe('B2');
			expect(ast.params[1].type).toBe('string');
			expect(ast.params[1].value).toBe('Hello');
		});
		it('should support lists', () => {
			const _context = new ParserContext();
			let ast = Tokenizer.createAST('["hello", "world"]', _context);
			expect(ast).toBeDefined();
			expect(ast.type).toBe('list');
			expect(ast.params.length).toBe(2);
			expect(ast.params[0].type).toBe('string');
			expect(ast.params[0].value).toBe('hello');
			expect(ast.params[1].type).toBe('string');
			expect(ast.params[1].value).toBe('world');
			ast = Tokenizer.createAST('[A1:B2, A2:B4]', _context);
			expect(ast).toBeDefined();
			expect(ast.type).toBe('list');
			expect(ast.params.length).toBe(2);
			expect(ast.params[0].type).toBe('identifier');
			expect(ast.params[0].value).toBe('A1:B2');
			expect(ast.params[1].type).toBe('identifier');
			expect(ast.params[1].value).toBe('A2:B4');
		});
		it('should throw an error if list is not closed', () => {
			const _context = new ParserContext();
			_context.setFunction('test', () => {});
			expect(() => Tokenizer.createAST('test([A1,B2,"Hello")', _context)).toThrow();
		});
	});
	describe('parsing with different decimal and parameter separator', () => {
		it('should be possible to set different decimal and parameter separator', () => {
			const context = new ParserContext();
			// replace SUM because validateResult() do not pass terms as params!!
			context.setFunction('SUM', (scope, ...params) =>
				params.reduce((sum, curr) => {
					curr = curr.value != null ? curr.value : curr;
					return sum + curr;
				}, 0)
			);
			context.separators = { decimal: ',', parameter: ';' };
			const ast = Tokenizer.createAST('2,4 + 5,6', context);
			expect(ast.left).toBeDefined();
			expect(ast.right).toBeDefined();
			expect(ast.left.type).toBe(Operand.TYPE.NUMBER);
			expect(ast.left.value).toBe('2.4');
			expect(ast.right.type).toBe(Operand.TYPE.NUMBER);
			expect(ast.right.value).toBe('5.6');

			validateResult('2,4 + 5,6', 8, context);
			validateResult('2,4 + 5.6', 7.4, context);
			validateResult('2+2*?(4>1;2;0)', 6, context);
			validateResult('SUM(1;2;3;4;5)', 15, context);
			validateResult('SUM(1,5; 2,5; 3,5; 4,5; 5,5)', 17.5, context);
			// validateResult('SUM(1.5; 2,5; 3,5; 4,5; 5.5)', 17, context);
			validateResult('400 / 2 + 400 / 2 * 0,5 * (1 - 2 * 2)', -100, context);
		});
	});
	describe('error handling', () => {
		it('should throw an error on unknown function', () => {
			expect(() => { Tokenizer.createAST('UnknownFunc(1,2,3,4,5)', DEF_CONTEXT); }).toThrow();
		});
		it('should throw an error on wrong parameter separator', () => {
			expect(() => { Tokenizer.createAST('SUM(1;2)', DEF_CONTEXT); }).toThrow();
			expect(() => { Tokenizer.createAST('SUM(1,2;)', DEF_CONTEXT); }).toThrow();
			// change parameter separators
			const contextDE = new ParserContext();
			contextDE.separators = Locale.DE.separators;
			// expect(() => { Tokenizer.createAST('SUM(1,2)', contextDE); }).toThrow();
			expect(() => { Tokenizer.createAST('SUM(1;2.)', contextDE); }).toThrow();
			// DL-1120
			expect(() => { Tokenizer.createAST('SUM(B3;4,5,0)', DEF_CONTEXT); }).toThrow();
		});
		// DL-1306
		it('should throw an error on none closing quotes or bracket', () => {
			const context = new ParserContext();
			context.setFunction('EXECUTE', (scope, ...params) => params.join(', '));
			expect(() => { Tokenizer.createAST('EXECUTE("P2,1)', context); }).toThrow();
			expect(() => { Tokenizer.createAST('EXECUTE("P2",1', context); }).toThrow();
		});
		it('should throw an error on wrong decimal separator', () => {
			const ctxt = new ParserContext();
			expect(() => { Tokenizer.createAST('2,3+2.4', ctxt); }).toThrow();
		});
		// DL-2549
		it('should throw an error if decimal separator is used multiple times', () => {
			const ctxt = new ParserContext();
			expect(() => { Tokenizer.createAST('2.3.4', ctxt); }).toThrow();
			expect(() => { Tokenizer.createAST('2.3.', ctxt); }).toThrow();
			// change parameter separators
			const contextDE = new ParserContext();
			contextDE.separators = Locale.DE.separators;
			expect(() => { Tokenizer.createAST('2,2,', contextDE); }).toThrow();
			expect(() => { Tokenizer.createAST('2,2,2', contextDE); }).toThrow();
		});
	});
});
