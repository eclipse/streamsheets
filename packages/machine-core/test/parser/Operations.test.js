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
const { Sheet, SheetParser } = require('../..');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;
const SHEET = new Sheet();

const validate = (expr, sheet = SHEET) => {
	const term = SheetParser.parse(expr, sheet);
	expect(term).toBeDefined();
	return ({
		equals: (res) => {
			expect(term.value).toBe(res);
		},
		between: (min, max) => {
			expect(term.value).toBeGreaterThanOrEqual(min);
			expect(term.value).toBeLessThanOrEqual(max);
		}
	});
};

describe('Operations', () => {
	it('should use default value if one value for undefined left or right ', () => {
		validate('A1 + 2').equals(2);
		validate('42 - A21').equals(42);
		validate('2 - (A3 - 4)').equals(6);
		validate('"Hi" - (A3 - "Hi")').equals(ERROR.VALUE);
	});
	describe('concat operator', () => {
		it('should concatenate values and return a string', () => {
			validate('"hello" & " world" & "!"').equals('hello world!');
			validate('A1 & "yes" & B2').equals('yes');
			validate('42 & B2').equals('42');
			validate('"Hi number: " & 23 - 11 & "!"').equals('Hi number: 12!');
		});
	});
	describe('should behave excel like for +, -, * and / operations', () => {
		const sheet = new Sheet().loadCells({ A1: 'hello', B1: 23, C1: true, D1: false, E1: null });
		it('with string as left argument', () => {
			validate('A1+A1', sheet).equals(ERROR.VALUE);
			validate('A1+B1', sheet).equals(ERROR.VALUE);
			validate('A1+C1', sheet).equals(ERROR.VALUE);
			validate('A1+D1', sheet).equals(ERROR.VALUE);
			validate('A1+E1', sheet).equals(ERROR.VALUE);

			validate('A1-A1', sheet).equals(ERROR.VALUE);
			validate('A1-B1', sheet).equals(ERROR.VALUE);
			validate('A1-C1', sheet).equals(ERROR.VALUE);
			validate('A1-D1', sheet).equals(ERROR.VALUE);
			validate('A1-E1', sheet).equals(ERROR.VALUE);

			validate('A1*A1', sheet).equals(ERROR.VALUE);
			validate('A1*B1', sheet).equals(ERROR.VALUE);
			validate('A1*C1', sheet).equals(ERROR.VALUE);
			validate('A1*D1', sheet).equals(ERROR.VALUE);
			validate('A1*E1', sheet).equals(ERROR.VALUE);

			validate('A1/A1', sheet).equals(ERROR.VALUE);
			validate('A1/B1', sheet).equals(ERROR.VALUE);
			validate('A1/C1', sheet).equals(ERROR.VALUE);
			validate('A1/D1', sheet).equals(ERROR.VALUE);
			validate('A1/E1', sheet).equals(ERROR.VALUE);
		});
		it('should convert an empty string to 0', () => {
			validate('"" + 1', sheet).equals(1);
			validate('1 + ""', sheet).equals(1);
			validate('"" + 0', sheet).equals(0);
			validate('0 + ""', sheet).equals(0);

			validate('"" - 1', sheet).equals(-1);
			validate('1 - ""', sheet).equals(1);
			validate('"" - 0', sheet).equals(0);
			validate('0 - ""', sheet).equals(0);

			validate('"" * 1', sheet).equals(0);
			validate('1 * ""', sheet).equals(0);
			validate('"" * 0', sheet).equals(0);
			validate('0 * ""', sheet).equals(0);

			validate('"" / 1', sheet).equals(0);
			validate('1 / ""', sheet).equals(ERROR.DIV0);
			validate('"" / 0', sheet).equals(ERROR.DIV0);
			validate('0 / ""', sheet).equals(ERROR.DIV0);
		});
		it('with number as left argument', () => {
			validate('B1+A1', sheet).equals(ERROR.VALUE);
			validate('B1+B1', sheet).equals(46);
			validate('B1+C1', sheet).equals(24);
			validate('B1+D1', sheet).equals(23);
			validate('B1+E1', sheet).equals(23);

			validate('B1-A1', sheet).equals(ERROR.VALUE);
			validate('B1-B1', sheet).equals(0);
			validate('B1-C1', sheet).equals(22);
			validate('B1-D1', sheet).equals(23);
			validate('B1-E1', sheet).equals(23);

			validate('B1*A1', sheet).equals(ERROR.VALUE);
			validate('B1*B1', sheet).equals(529);
			validate('B1*C1', sheet).equals(23);
			validate('B1*D1', sheet).equals(0);
			validate('B1*E1', sheet).equals(0);

			validate('B1/A1', sheet).equals(ERROR.VALUE);
			validate('B1/B1', sheet).equals(1);
			validate('B1/C1', sheet).equals(23);
			validate('B1/D1', sheet).equals(ERROR.DIV0);
			validate('B1/E1', sheet).equals(ERROR.DIV0);
		});

		it('with true as left argument', () => {
			validate('C1+A1', sheet).equals(ERROR.VALUE);
			validate('C1+B1', sheet).equals(24);
			validate('C1+C1', sheet).equals(2);
			validate('C1+D1', sheet).equals(1);
			validate('C1+E1', sheet).equals(1);

			validate('C1-A1', sheet).equals(ERROR.VALUE);
			validate('C1-B1', sheet).equals(-22);
			validate('C1-C1', sheet).equals(0);
			validate('C1-D1', sheet).equals(1);
			validate('C1-E1', sheet).equals(1);

			validate('C1*A1', sheet).equals(ERROR.VALUE);
			validate('C1*B1', sheet).equals(23);
			validate('C1*C1', sheet).equals(1);
			validate('C1*D1', sheet).equals(0);
			validate('C1*E1', sheet).equals(0);

			validate('C1/A1', sheet).equals(ERROR.VALUE);
			validate('C1/B1', sheet).between(0.043, 0.044);
			validate('C1/C1', sheet).equals(1);
			validate('C1/D1', sheet).equals(ERROR.DIV0);
			validate('C1/E1', sheet).equals(ERROR.DIV0);
		});

		it('with false as left argument', () => {
			validate('D1+A1', sheet).equals(ERROR.VALUE);
			validate('D1+B1', sheet).equals(23);
			validate('D1+C1', sheet).equals(1);
			validate('D1+D1', sheet).equals(0);
			validate('D1+E1', sheet).equals(0);

			validate('D1-A1', sheet).equals(ERROR.VALUE);
			validate('D1-B1', sheet).equals(-23);
			validate('D1-C1', sheet).equals(-1);
			validate('D1-D1', sheet).equals(0);
			validate('D1-E1', sheet).equals(0);

			validate('D1*A1', sheet).equals(ERROR.VALUE);
			validate('D1*B1', sheet).equals(0);
			validate('D1*C1', sheet).equals(0);
			validate('D1*D1', sheet).equals(0);
			validate('D1*E1', sheet).equals(0);

			validate('D1/A1', sheet).equals(ERROR.VALUE);
			validate('D1/B1', sheet).equals(0);
			validate('D1/C1', sheet).equals(0);
			validate('D1/D1', sheet).equals(ERROR.DIV0);
			validate('D1/E1', sheet).equals(ERROR.DIV0);
		});

		it('with null as left argument', () => {
			validate('E1+A1', sheet).equals(ERROR.VALUE);
			validate('E1+B1', sheet).equals(23);
			validate('E1+C1', sheet).equals(1);
			validate('E1+D1', sheet).equals(0);
			validate('E1+E1', sheet).equals(0);

			validate('E1-A1', sheet).equals(ERROR.VALUE);
			validate('E1-B1', sheet).equals(-23);
			validate('E1-C1', sheet).equals(-1);
			validate('E1-D1', sheet).equals(0);
			validate('E1-E1', sheet).equals(0);

			validate('E1*A1', sheet).equals(ERROR.VALUE);
			validate('E1*B1', sheet).equals(0);
			validate('E1*C1', sheet).equals(0);
			validate('E1*D1', sheet).equals(0);
			validate('E1*E1', sheet).equals(0);

			validate('E1/A1', sheet).equals(ERROR.VALUE);
			validate('E1/B1', sheet).equals(0);
			validate('E1/C1', sheet).equals(0);
			validate('E1/D1', sheet).equals(ERROR.DIV0);
			validate('E1/E1', sheet).equals(ERROR.DIV0);
		});
	});
	describe('unaray operator - should behave excel', () => {
		const sheet = new Sheet().loadCells({ A1: 'hello', B1: 23, C1: true, D1: false, E1: null });
		it(`should return ${ERROR.VALUE} if right term is a string`, () => {
			validate('-A1', sheet).equals(ERROR.VALUE);
		});
	});
});
