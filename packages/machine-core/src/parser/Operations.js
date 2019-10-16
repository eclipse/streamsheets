const ERROR = require('../functions/errors');
const { BinaryOperator, BoolOperator, UnaryOperator } = require('@cedalo/parser');


const termValue = (term, defval) => {
	const val = term != null ? term.value : null;
	return val != null ? val : defval;
};

const calc = (left, right, op) => {
	left = left != null ? Number(left) : 0;
	right = right != null ? Number(right) : 0;
	return isNaN(left) || isNaN(right) ? ERROR.VALUE : op(left, right);
};

// eslint-disable-next-line no-nested-ternary
const isError = (left, right) => ERROR.isError(left) ? left : (ERROR.isError(right) ? right : undefined);


// replace some basic operations to behave more excel like, including excel-like error values...
module.exports.Operations = [
	new BinaryOperator('+', (left, right) => isError(left, right) || calc(left, right, (l, r) => l + r)),
	new BinaryOperator('-', (left, right) => isError(left, right) || calc(left, right, (l, r) => l - r)),
	new BinaryOperator('*', (left, right) => isError(left, right) || calc(left, right, (l, r) => l * r)),
	// eslint-disable-next-line
	new BinaryOperator('/', (left, right) => isError(left, right) || calc(left, right, (l, r) => (!r ? ERROR.DIV0 : !l ? 0 : l / r))),
	new UnaryOperator('-', (right) => isError(right) || calc(-1, right, (l, r) => l * r)),

	// eslint-disable-next-line
	new BoolOperator('!=', (left, right) => isError(left, right) || (left != right)),
	// eslint-disable-next-line
	new BoolOperator('<>', (left, right) => isError(left, right) || (left != right)),
	// eslint-disable-next-line
	new BoolOperator('=', (left, right) => isError(left, right) || (left == right)),
	// eslint-disable-next-line
	new BoolOperator('==', (left, right) => isError(left, right) || (left == right)),
	new BoolOperator('>', (left, right) => isError(left, right) || (left > right)),
	new BoolOperator('>=', (left, right) => isError(left, right) || (left >= right)),
	new BoolOperator('<', (left, right) => isError(left, right) || (left < right)),
	new BoolOperator('<=', (left, right) => isError(left, right) || (left <= right)),
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
