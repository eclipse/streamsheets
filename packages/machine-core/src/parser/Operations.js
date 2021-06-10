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

const ERROR = FunctionErrors.code;
const DIV0 = () => ErrorInfo.create(ERROR.DIV0);

const termValue = (term, defval) => {
	const val = term != null ? term.value : null;
	return val != null ? val : defval;
};

const calc = (left, right, op) => {
	left = left != null ? Number(left) : 0;
	right = right != null ? Number(right) : 0;
	return isNaN(left) || isNaN(right) ? ERROR.VALUE : op(left, right);
};

const getError = (l, r) => {
	if (FunctionErrors.isError(l)) return l; // .isErrorInfo ? l.setParamIndex('1') : l;
	// return FunctionErrors.isError(r) ? r.isErrorInfo ? r.setParamIndex('2') : r : undefined;
	return FunctionErrors.isError(r) ? r : undefined;
};


// replace some basic operations to behave more excel like, including excel-like error values...
module.exports.Operations = [
	new BinaryOperator('+', (left, right) => getError(left, right) || calc(left, right, (l, r) => l + r)),
	new BinaryOperator('-', (left, right) => getError(left, right) || calc(left, right, (l, r) => l - r)),
	new BinaryOperator('*', (left, right) => getError(left, right) || calc(left, right, (l, r) => l * r)),
	// eslint-disable-next-line
	new BinaryOperator('/', (left, right) => getError(left, right) || calc(left, right, (l, r) => (!r ? DIV0() : !l ? 0 : l / r))),
	new UnaryOperator('-', (right) => getError(right) || calc(-1, right, (l, r) => l * r)),

	// eslint-disable-next-line
	new BoolOperator('!=', (left, right) => getError(left, right) || left != right),
	// eslint-disable-next-line
	new BoolOperator('<>', (left, right) => getError(left, right) || left != right),
	// eslint-disable-next-line
	new BoolOperator('=', (left, right) => getError(left, right) || left == right),
	// eslint-disable-next-line
	new BoolOperator('==', (left, right) => getError(left, right) || left == right),
	new BoolOperator('>', (left, right) => getError(left, right) || left > right),
	new BoolOperator('>=', (left, right) => getError(left, right) || left >= right),
	new BoolOperator('<', (left, right) => getError(left, right) || left < right),
	new BoolOperator('<=', (left, right) => getError(left, right) || left <= right),
	new BoolOperator('|', (left, right) => getError(left, right) || (left || right))
];

module.exports.ConcatOperator = class ConcatOperator extends BinaryOperator {

	constructor() {
		super('&');
	}

	calc(left, right) {
		return getError(left, right) ||  `${termValue(left, '')}${termValue(right, '')}`;
	}
};

// used by timequery's where clause
module.exports.AndOperator = class AndOperator extends BoolOperator {
	constructor() {
		super('&&', (left, right) => getError(left, right) || (left && right));
	}
};
