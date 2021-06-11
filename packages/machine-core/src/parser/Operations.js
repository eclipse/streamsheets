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
	return isNaN(left) || isNaN(right) ? ErrorInfo.create(ERROR.VALUE) : op(left, right);
};

const getParamIndex = (term) => {
	return term.name || term.toString();
	// const index = errorinfo.paramIndex;
	// return index == null || typeof index !== 'string' ? errorinfo.setParamIndex(paramString(term)) : errorinfo;
};
const setErrorInfo = (code, term, parent) => {
	const cell = parent && parent.cell;
	if(cell) {
		const error = ErrorInfo.create(code);
		// TODO: improve index hint
		cell.setCellInfo('error', error.setParamIndex(getParamIndex(term)));
		// info.setParamIndex ? setParamIndex(info, term) : info;
	}
	return code;
}

class SheetBinaryOperator extends BinaryOperator {
	calc(term1, term2, parent) {
		const val1 = term1 && term1.value;
		const val2 = term2 && term2.value;
		if (FunctionErrors.isError(val1)) return setErrorInfo(val1, term1, parent);
		if (FunctionErrors.isError(val2)) return setErrorInfo(val2, term2, parent);
		return this.operation(val1, val2);
	}
}
class SheetUnaryOperator extends UnaryOperator {
	calc(term1, term2, parent) {
		const value = term1 && term1.value;
		if (FunctionErrors.isError(value)) return setErrorInfo(value, term1, parent);
		return this.operation(value);
	}
}
class SheetBoolOperator extends BoolOperator {
	calc(term1, term2, parent) {
		const val1 = this.isResolved(term1) ? term1.value : false;
		const val2 = this.isResolved(term2) ? term2.value : false;
		if (FunctionErrors.isError(val1)) return setErrorInfo(val1, term1, parent);
		if (FunctionErrors.isError(val2)) return setErrorInfo(val2, term2, parent);
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
		return `${termValue(left, '')}${termValue(right, '')}`;
	}
};

// used by timequery's where clause
module.exports.AndOperator = class AndOperator extends SheetBoolOperator {
	constructor() {
		super('&&', (left, right) => left && right);
	}
};
