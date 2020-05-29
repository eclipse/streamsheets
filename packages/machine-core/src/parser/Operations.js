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
const { FunctionErrors } = require('@cedalo/error-codes');
const { BinaryOperator, BoolOperator, UnaryOperator } = require('@cedalo/parser');

const ERROR = FunctionErrors.code;

const termValue = (term, defval) => {
	const val = term != null ? term.value : null;
	return val != null ? val : defval;
};

const calc = (left, right, op) => {
	left = left != null ? Number(left) : 0;
	right = right != null ? Number(right) : 0;
	return isNaN(left) || isNaN(right) ? ERROR.VALUE : op(left, right);
};

const isError = (left, right) =>
// eslint-disable-next-line no-nested-ternary
	FunctionErrors.isError(left) ? left : (FunctionErrors.isError(right) ? right : undefined);


// replace some basic operations to behave more excel like, including excel-like error values...
module.exports.Operations = [
	new BinaryOperator('+', (left, right) => isError(left, right) || calc(left, right, (l, r) => l + r)),
	new BinaryOperator('-', (left, right) => isError(left, right) || calc(left, right, (l, r) => l - r)),
	new BinaryOperator('*', (left, right) => isError(left, right) || calc(left, right, (l, r) => l * r)),
	// eslint-disable-next-line
	new BinaryOperator('/', (left, right) => isError(left, right) || calc(left, right, (l, r) => (!r ? ERROR.DIV0 : !l ? 0 : l / r))),
	new UnaryOperator('-', (right) => isError(right) || calc(-1, right, (l, r) => l * r)),

	// eslint-disable-next-line
	new BoolOperator('!=', (left, right) => isError(left, right) || left != right),
	// eslint-disable-next-line
	new BoolOperator('<>', (left, right) => isError(left, right) || left != right),
	// eslint-disable-next-line
	new BoolOperator('=', (left, right) => isError(left, right) || left == right),
	// eslint-disable-next-line
	new BoolOperator('==', (left, right) => isError(left, right) || left == right),
	new BoolOperator('>', (left, right) => isError(left, right) || left > right),
	new BoolOperator('>=', (left, right) => isError(left, right) || left >= right),
	new BoolOperator('<', (left, right) => isError(left, right) || left < right),
	new BoolOperator('<=', (left, right) => isError(left, right) || left <= right),
	new BoolOperator('|', (left, right) => isError(left, right) || (left || right))
];

module.exports.ConcatOperator = class ConcatOperator extends BinaryOperator {

	constructor() {
		super('&');
	}

	calc(left, right) {
		return isError(left, right) ||  `${termValue(left, '')}${termValue(right, '')}`;
	}
};

// used by timequery's where clause
module.exports.AndOperator = class AndOperator extends BoolOperator {
	constructor() {
		super('&&', (left, right) => isError(left, right) || (left && right));
	}
};
