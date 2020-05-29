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
const { Operand } = require('./Operand');
const Tokenizer = require('./Tokenizer');

const TYPES = {
	GENERAL: 'general',
	BINARY: 'binary',
	BOOL: 'bool',
	CONDITION: 'condition',
	UNARY: 'unary',
	UNIT: 'unit'
};

class Operator {
	constructor(symbol, operation) {
		this.symbol = symbol;
		this.operation = operation;
	}

	get type() {
		return TYPES.GENERAL;
	}

	calc() {
	}

	isEqualTo(operator) {
		return operator && this.symbol === operator.symbol;
	}

	isTypeOf(type) {
		return this.type === type;
	}
}
class UnaryOperator extends Operator {
	constructor(symbol, operation) {
		super(symbol, operation);
		this.toRight = false;
	}

	get type() {
		return TYPES.UNARY;
	}

	calc(term) {
		const value = term && term.value;
		return this.operation(value);
	}
}
// extra type necessary? same as unary operator...
class UnitOperator extends UnaryOperator {
	constructor(symbol, operation) {
		super(symbol, operation);
		this.toRight = true;
	}

	get type() {
		return TYPES.UNIT;
	}

	isTypeOf(type) {
		return this.type === type || super.type === type;
	}

	calc(term1, term2) {
		const term = term1 || term2;
		const value = term && term.value;
		return this.operation(value);
	}
}
class BinaryOperator extends Operator {
	get type() {
		return TYPES.BINARY;
	}

	calc(term1, term2) {
		const val1 = term1 && term1.value;
		const val2 = term2 && term2.value;
		return this.operation(val1, val2);
	}
}
// BooleOperator needed to implement new behaviour!! => for unresolved References its should return false!!!
class BoolOperator extends Operator {
	get type() {
		return TYPES.BOOL;
	}

	calc(term1, term2) {
		const val1 = this.isResolved(term1) ? term1.value : false;
		const val2 = this.isResolved(term2) ? term2.value : false;
		return this.operation(val1, val2);
	}

	isResolved(term) {
		const operand = term && term.operand;
		return operand && (term.operand.type !== Operand.TYPE.REFERENCE || operand.isResolved());
	}
}
class ConditionOperator extends Operator {
	constructor() {
		super('?');
	}

	get type() {
		return TYPES.CONDITION;
	}

	calc(condition, onTrue, onFalse) {
		const isTrue = condition ? !!condition.value : false;
		return isTrue ? onTrue.value : onFalse.value;
	}
}

const Operation = (() => {
	const ops = {};
	const unaryops = {};

	function set(op) {
		const toOps = op.isTypeOf(TYPES.UNARY) ? unaryops : ops;
		toOps[op.symbol] = op;
	}

	function get(symbol) {
		return ops[symbol] || unaryops[symbol];
	}
	function getUnary(symbol) {
		return unaryops[symbol];
	}

	// UNDER REVIEW: registers an operation, so that its symbol is recognized by parser too:
	function register(operation, precedence) {
		set(operation);
		Tokenizer.registerOperation(operation.symbol, operation.type, precedence);
	}

	// UNDER REVIEW: unregisters operation registered under given symbol. type is optional. if not given first operation
	// found is unregistered
	function unregister(symbol, type) {
		Tokenizer.unregisterOperation(symbol, type);
	}

	// eslint-disable-next-line
	const XOR = (left, right) => left == null ? (right != null ? right : null) : (right == null ? left : null);
	const xorOrValue = (left, right, value) => {
		const xor = XOR(left, right);
		return xor != null ? xor : value();
	};

	// add default operations:
	set(new BinaryOperator('+', (left, right) => xorOrValue(left, right, () => left + right)));
	set(new BinaryOperator('-', (left, right) => xorOrValue(left, right, () => left - right)));
	set(new BinaryOperator('%', (left, right) => left % right));
	set(new BinaryOperator('*', (left, right) => (XOR(left, right) == null ? left * right : null)));
	set(new BinaryOperator('/', (left, right) => (left && right ? left / right : 0)));
	set(new BinaryOperator('^', (left, right) => (Number.isNaN(Number(right)) ? 1 : left ** right)));

	set(new UnaryOperator('!', val => !val));
	set(new UnaryOperator('+', val => val));
	set(new UnaryOperator('-', val => -1 * val));

	set(new UnitOperator('%', val => val / 100));

	// original code did not use === => so we leave it like it is...
	// eslint-disable-next-line
	set(new BoolOperator('!=', (left, right) => left != right));
	// eslint-disable-next-line
	set(new BoolOperator('<>', (left, right) => left != right));
	// eslint-disable-next-line
	set(new BoolOperator('=', (left, right) => left == right));
	// eslint-disable-next-line
	set(new BoolOperator('==', (left, right) => left == right));
	// ~
	set(new BoolOperator('>', (left, right) => left > right));
	set(new BoolOperator('>=', (left, right) => left >= right));
	set(new BoolOperator('<', (left, right) => left < right));
	set(new BoolOperator('<=', (left, right) => left <= right));
	set(new BoolOperator('&', (left, right) => left && right));
	set(new BoolOperator('|', (left, right) => left || right));
	// '^': new BinaryOperator((left, right) => (left && !right) || (!left && right))

	// register condition operation:
	set(new ConditionOperator());

	return {
		set,
		get,
		getUnary,
		register,
		unregister,
		TYPE: TYPES
	};
})();

module.exports = {
	Operator,
	BoolOperator,
	BinaryOperator,
	ConditionOperator,
	UnaryOperator,
	UnitOperator,
	Operation
};
