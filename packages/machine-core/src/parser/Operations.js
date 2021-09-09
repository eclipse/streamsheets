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
const { FunctionErrors, ErrorInfo } = require('@cedalo/error-codes');
const { BinaryOperator, BoolOperator, UnaryOperator } = require('@cedalo/parser');
const DotReferenceOperator = require('./DotReferenceOperator');
const { calc, createErrorInfo, getTermValue } = require('./utils');

const ERROR = FunctionErrors.code;
const DIV0 = () => ErrorInfo.create(ERROR.DIV0);


class SheetBinaryOperator extends BinaryOperator {
	calc(term1, term2) {
		const val1 = term1 && term1.value;
		const val2 = term2 && term2.value;
		if (FunctionErrors.isError(val1)) return createErrorInfo(val1, term1);
		if (FunctionErrors.isError(val2)) return createErrorInfo(val2, term2);
		return this.operation(val1, val2);
	}
}
class SheetUnaryOperator extends UnaryOperator {
	calc(term) {
		const value = term && term.value;
		if (FunctionErrors.isError(value)) return createErrorInfo(value, term);
		return this.operation(value);
	}
}
class SheetBoolOperator extends BoolOperator {
	calc(term1, term2) {
		const val1 = this.isResolved(term1) ? term1.value : false;
		const val2 = this.isResolved(term2) ? term2.value : false;
		if (FunctionErrors.isError(val1)) return createErrorInfo(val1, term1);
		if (FunctionErrors.isError(val2)) return createErrorInfo(val2, term2);
		return this.operation(val1, val2);
	}
}
// replace some basic operations to behave more excel like, including excel-like error values...
module.exports.Operations = [
	new SheetBinaryOperator('+', (left, right) => calc(left, right, (l, r) => l + r)),
	new SheetBinaryOperator('-', (left, right) => calc(left, right, (l, r) => l - r)),
	new SheetBinaryOperator('*', (left, right) => calc(left, right, (l, r) => l * r)),
	// eslint-disable-next-line
	new SheetBinaryOperator('/', (left, right) => calc(left, right, (l, r) => (!r ? DIV0() : !l ? 0 : l / r))),
	new SheetUnaryOperator('-', (right) => calc(-1, right, (l, r) => l * r)),

	// eslint-disable-next-line
	new SheetBoolOperator('!=', (left, right) => left != right),
	// eslint-disable-next-line
	new SheetBoolOperator('<>', (left, right) => left != right),
	// eslint-disable-next-line
	new SheetBoolOperator('=', (left, right) => left == right),
	// eslint-disable-next-line
	new SheetBoolOperator('==', (left, right) => left == right),
	new SheetBoolOperator('>', (left, right) => left > right),
	new SheetBoolOperator('>=', (left, right) => left >= right),
	new SheetBoolOperator('<', (left, right) => left < right),
	new SheetBoolOperator('<=', (left, right) => left <= right),
	new SheetBoolOperator('|', (left, right) => (left || right))
];

module.exports.ConcatOperator = class ConcatOperator extends SheetBinaryOperator {

	constructor() {
		super('&');
	}

	calc(left, right) {
		return `${getTermValue(left, '')}${getTermValue(right, '')}`;
	}
};

// used by timequery's where clause
module.exports.AndOperator = class AndOperator extends SheetBoolOperator {
	constructor() {
		super('&&', (left, right) => left && right);
	}
};

module.exports.DotOperator = DotReferenceOperator;