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
const { Locale, Operand, Parser, ParserContext, Reference, Term, FuncTerm, CondTerm } = require('..');

const DEF_CONTEXT = new ParserContext();

const parse = formula => Parser.parse(formula, DEF_CONTEXT);
const termToString = formula => parse(formula).toString();

describe('Term', () => {
	describe('creation', () => {
		it('should be possible to create a term with an operator', () => {
			let term = Term.withOperator('*', Term.fromNumber(2), Term.fromNumber(6));
			expect(term).toBeDefined();
			expect(term.value).toBe(12);

			term = Term.withOperator('-', Term.fromNumber(7), Term.fromNumber(4));
			expect(term).toBeDefined();
			expect(term.value).toBe(3);

			term = Term.withOperator('/', Term.fromNumber(14), Term.fromNumber(7));
			expect(term).toBeDefined();
			expect(term.value).toBe(2);

			term = Term.withOperator('!=', Term.fromNumber(14), Term.fromNumber(7));
			expect(term).toBeDefined();
			expect(term.value).toBe(true);

			term = Term.withOperator('=', Term.fromString('test'), Term.fromString('test'));
			expect(term).toBeDefined();
			expect(term.value).toBe(true);

			term = Term.withOperator('==', Term.fromString('test'), Term.fromString('test'));
			expect(term).toBeDefined();
			expect(term.value).toBe(true);

			term = Term.withOperator('>', Term.fromNumber(42), Term.fromNumber(23));
			expect(term).toBeDefined();
			expect(term.value).toBe(true);

			term = Term.withOperator('>=', Term.fromNumber(23), Term.fromNumber(42));
			expect(term).toBeDefined();
			expect(term.value).toBe(false);

			term = Term.withOperator('<', Term.fromNumber(42), Term.fromNumber(23));
			expect(term).toBeDefined();
			expect(term.value).toBe(false);

			term = Term.withOperator('<=', Term.fromNumber(23), Term.fromNumber(42));
			expect(term).toBeDefined();
			expect(term.value).toBe(true);

			term = Term.withOperator('&', Term.fromBoolean(true), Term.fromBoolean(true));
			expect(term).toBeDefined();
			expect(term.value).toBe(true);

			term = Term.withOperator('|', Term.fromBoolean(true), Term.fromBoolean(false));
			expect(term).toBeDefined();
			expect(term.value).toBe(true);

			term = Term.withOperator('!', Term.fromBoolean(false));
			expect(term).toBeDefined();
			expect(term.value).toBe(true);

			term = Term.withOperator('?', Term.fromBoolean(true), Term.fromString('truthy'), Term.fromString('falsy'));
			expect(term).toBeDefined();
			expect(term.value).toBe('truthy');
		});

		it('should be possible to create a term from value', () => {
			let term = Term.fromValue(1);
			expect(term).toBeDefined();
			expect(term.operand.type).toBe(Operand.TYPE.NUMBER);
			expect(term.value).toBe(1);
			term = Term.fromValue(0);
			expect(term).toBeDefined();
			expect(term.operand.type).toBe(Operand.TYPE.NUMBER);
			expect(term.value).toBe(0);

			term = Term.fromValue(true);
			expect(term).toBeDefined();
			expect(term.operand.type).toBe(Operand.TYPE.BOOL);
			expect(term.value).toBeTruthy();
			term = Term.fromValue(false);
			expect(term).toBeDefined();
			expect(term.operand.type).toBe(Operand.TYPE.BOOL);
			expect(term.value).toBeFalsy();

			term = Term.fromValue([1, 2, 3]);
			expect(term).toBeDefined();
			expect(term.operand.type).toBe(Operand.TYPE.STRING);
			expect(term.value).toBe('1,2,3');

			term = Term.fromValue('hello');
			expect(term).toBeDefined();
			expect(term.operand.type).toBe(Operand.TYPE.STRING);
			expect(term.value).toBe('hello');
		});
	});
	describe('copy', () => {
		it('should create a fresh context for copied term', () => {
			const onDispose = () => {};
			const fnTerm = new FuncTerm();
			fnTerm.context.addDisposeListener(onDispose);
			fnTerm.context.state1 = 'state1';
			fnTerm.context.complexState = { state: 'complex' };
			const copy = fnTerm.copy();
			expect(copy).toBeDefined();
			expect(copy.context).toBeDefined();
			expect(copy.context.term).toEqual(copy);
			expect(copy.context.hasDisposeListener(onDispose)).toBe(false);
			expect(copy.context.state1).toBeUndefined();
			expect(copy.context.complexState).toBeUndefined();
		});
	});
	describe('toString', () => {
		it('should return a string which represents term', () => {
			const term = Parser.parse('-2', DEF_CONTEXT);
			expect(term.toString()).toBe('-2');
			expect(termToString('(0-1)*-2')).toBe('(0-1)*-2');
			expect(termToString('3--4')).toBe('3--4');
			expect(termToString('4/2+4/2*-0.97*(1-3*2)')).toBe('4/2+4/2*-0.97*(1-3*2)');
			expect(termToString('-2*-2')).toBe('-2*-2');
			expect(termToString('2*-(2+1)')).toBe('2*-(2+1)');
			expect(termToString('-1<=1-1')).toBe('-1<=1-1');
		});
		it('should return a string which represents a function term', () => {
			const term = Parser.parse('SUM(1,2,3,4,5)', DEF_CONTEXT);
			expect(term.toString()).toBe('SUM(1,2,3,4,5)');
			expect(termToString('SUM(1,2,3,4) + MAX(5,3,4)')).toBe('SUM(1,2,3,4)+MAX(5,3,4)');
			expect(termToString('SUM (1,2,MAX  (0,3,2,1),4,MAX (5,3,4))')).toBe('SUM(1,2,MAX(0,3,2,1),4,MAX(5,3,4))');
			expect(termToString('maX(2, sum(1,2,3,4), 23, 9, 8)')).toBe('MAX(2,SUM(1,2,3,4),23,9,8)');
			expect(termToString('PI() + 1')).toBe('PI()+1');
		});
		it('should return a string which represents a condition term', () => {
			expect(termToString('?(4!=2,1,0)')).toBe('?(4!=2,1,0)');
			expect(termToString('?(4>=2,1,0)')).toBe('?(4>=2,1,0)');
			expect(termToString('?(4<=2,1,0)')).toBe('?(4<=2,1,0)');
			expect(termToString('?(-4<=2,1,0)')).toBe('?(-4<=2,1,0)');
			expect(termToString('?(3+3>1 & 4+3<1, "a", "b")')).toBe('?(3+3>1&4+3<1,"a","b")');
			expect(termToString('?(3+3>-1 | -4+3<1, "a", "b")')).toBe('?(3+3>-1|-4+3<1,"a","b")');
			expect(termToString('2+2*?(4>1,2,0)')).toBe('2+2*?(4>1,2,0)');
			expect(termToString('.5*?(3>2,250,"falsch")')).toBe('0.5*?(3>2,250,"falsch")');
			expect(termToString('?(3+2 > 1, ?(4 + 2 < 2, 42, 43), 44)')).toBe('?(3+2>1,?(4+2<2,42,43),44)');
			expect(termToString('?(1+2>0,"ja", "no")')).toBe('?(1+2>0,"ja","no")');
			expect(termToString('?(5>1, "YES", "NO")')).toBe('?(5>1,"YES","NO")');
			expect(termToString('?(5>1, ?(5<1, "mm", 42))')).toBe('?(5>1,?(5<1,"mm",42),)');
			expect(termToString('?(5>1, ?(5<1, "mm", ""), "")')).toBe('?(5>1,?(5<1,"mm",""),"")');
			expect(termToString('?(4,2,0)')).toBe('?(4,2,0)');
			expect(termToString('?("hallo",2,0)')).toBe('?("hallo",2,0)');
		});
		it('should return a string which represents an IF condition term', () => {
			expect(termToString('.5*IF(3>2,250,"falsch")')).toBe('0.5*IF(3>2,250,"falsch")');
			expect(termToString('if ("IF",2,0)')).toBe('IF("IF",2,0)');
			expect(termToString('iF("IF"=="if",2,4)')).toBe('IF("IF"=="if",2,4)');
			expect(termToString('If (4<=2,1,0)')).toBe('IF(4<=2,1,0)');
			expect(termToString('iF     (-4<=2,1,0)')).toBe('IF(-4<=2,1,0)');
			expect(termToString('iF + of')).toBe('"iF"+"of"');
		});
		it('should preserve brackets', () => {
			expect(parse('10-(4-2)').value).toBe(8);
			expect(parse('10-(4-2)').toString()).toBe('10-(4-2)');
			expect(parse('(10-10/2)/(10/2)').value).toBe(1);
			expect(parse('(10-10/2)/(10/2)').toString()).toBe('(10-10/2)/(10/2)');
		});
		it('should work with unary operator', () => {
			expect(parse('!true', DEF_CONTEXT).value).toBe(false);
			expect(parse('!true', DEF_CONTEXT).toString()).toBe('!TRUE');
			expect(parse('-2', DEF_CONTEXT).value).toBe(-2);
			expect(parse('-2', DEF_CONTEXT).toString()).toBe('-2');
			expect(parse('+-2', DEF_CONTEXT).value).toBe(-2);
			expect(parse('+-2', DEF_CONTEXT).toString()).toBe('+-2');
			expect(parse('-(2+3)', DEF_CONTEXT).value).toBe(-5);
			expect(parse('-(2+3)', DEF_CONTEXT).toString()).toBe('-(2+3)');
			expect(parse('!3+2', DEF_CONTEXT).value).toBe(2);
			expect(parse('!3+2', DEF_CONTEXT).toString()).toBe('!3+2');
		});
	});
	describe('toLocaleString', () => {
		it('should use decimal separator which correspond to specified locale', () => {
			const term = Parser.parse('-2.23', DEF_CONTEXT);
			expect(term.toLocaleString()).toBe('-2.23');
			expect(term.toLocaleString(Locale.DE)).toBe('-2,23');
			expect(term.toLocaleString(Locale.EN)).toBe('-2.23');
			expect(term.toLocaleString(Locale.DEFAULT)).toBe('-2.23');
		});
		it('should use parameter separator which correspond to specified locale', () => {
			let term = Parser.parse('SUM(1,2,3,4,5)', DEF_CONTEXT);
			expect(term.toLocaleString()).toBe('SUM(1,2,3,4,5)');
			expect(term.toLocaleString(Locale.DE)).toBe('SUM(1;2;3;4;5)');
			expect(term.toLocaleString(Locale.EN)).toBe('SUM(1,2,3,4,5)');
			term = Parser.parse('?(4!=2,1,0)', DEF_CONTEXT);
			expect(term.toLocaleString()).toBe('?(4!=2,1,0)');
			expect(term.toLocaleString(Locale.DE)).toBe('?(4!=2;1;0)');
			term = Parser.parse('iF("IF"=="if",2,4)', DEF_CONTEXT);
			expect(term.toLocaleString()).toBe('IF("IF"=="if",2,4)');
			expect(term.toLocaleString(Locale.DE)).toBe('IF("IF"=="if";2;4)');
		});
		it('should respect custom locale', () => {
			const myseps = { separators: { decimal: '#', parameter: '/' } };
			const nrTerm = Parser.parse('-2.23', DEF_CONTEXT);
			expect(nrTerm.toLocaleString(myseps)).toBe('-2#23');
			expect(nrTerm.toLocaleString(Locale.DE)).toBe('-2,23');
			expect(nrTerm.toLocaleString()).toBe('-2.23');
			const funcTerm = Parser.parse('SUM(1,2,3,4,5)', DEF_CONTEXT);
			expect(funcTerm.toLocaleString(myseps)).toBe('SUM(1/2/3/4/5)');
			expect(funcTerm.toLocaleString(Locale.DE)).toBe('SUM(1;2;3;4;5)');
			expect(funcTerm.toLocaleString()).toBe('SUM(1,2,3,4,5)');
		});
	});
	describe('isStatic', () => {
		it('should return true if term was create from boolean, number or sring', () => {
			expect(Term.fromBoolean(true).isStatic).toBe(true);
			expect(Term.fromBoolean(false).isStatic).toBe(true);
			expect(Term.fromNumber(42).isStatic).toBe(true);
			expect(Term.fromString('').isStatic).toBe(true);
			expect(Term.fromString('hello').isStatic).toBe(true);
		});
		it('should return true if term was created from negative number', () => {
			expect(Term.fromValue(-42).isStatic).toBe(true);
			expect(Term.fromNumber(-42).isStatic).toBe(true);
			expect(Parser.parse('-23', DEF_CONTEXT).isStatic).toBe(true);
		});
		it('should return false if term has an operator or reference', () => {
			expect(Parser.parse('2*2', DEF_CONTEXT).isStatic).toBe(false);
			expect(new Term(new Reference()).isStatic).toBe(false);
		});
		it('should return false if term is a FuncTerm, CondTerm or ListTerm', () => {
			expect(new FuncTerm().isStatic).toBe(false);
			expect(new CondTerm().isStatic).toBe(false);
		});
	});
});
