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
const { Operand, StringOperand } = require('./Operand');
const Operation = require('./Operation').Operation;
const ErrorCode = require('./ErrorCodes');
const ParserError = require('./ParserError');
const { Term, CondTerm, FuncTerm, ListTerm, NullTerm } = require('./Term');

const boolOperand = (node) => {
	let str = node.value;
	let value = (str === false || str === true) ? str : undefined;
	if (value == null) {
		str = str.toUpperCase();
		// eslint-disable-next-line no-nested-ternary
		value = str === 'FALSE' ? false : (str === 'TRUE' ? true : undefined);
	}
	return value != null ? new Operand(Operand.TYPE.BOOL, value) : undefined;
};
const nrOperand = node => (node.type === 'number' ? new Operand(Operand.TYPE.NUMBER, Number(node.value)) : undefined);
const strOperand = node => new StringOperand(node.rawval != null ? node.rawval : node.value);

const operandFromNode = node =>
	(node.value.length < 1 ? Operand.UNDEF : (nrOperand(node) || boolOperand(node) || strOperand(node)));

const binaryNodeValidator = node =>
	((!node.left || !node.right || node.left.type === 'undef' || node.right.type === 'undef')
		? {	name: 'Parser Error', code: ErrorCode.MISSING_OPERAND, message: 'Missing operand for binary operation!'	}
		: undefined);

const validateNode = (node, context, validator) => {
	if (context.strict && !node.isInvalid) {
		const error = validator(node);
		node.isInvalid = !!error;
		if (error && !context.ignoreErrors) {
			throw ParserError.create(error);
		}
	}
};

function createTerm(context, node, parent) {
	let term = context ? context.createReferenceTerm(node, parent) : undefined;
	if (!term) {
		switch (node.type) {
		case 'unaryop':
			// eslint-disable-next-line
			term = createUnaryTerm(context, node);
			break;
		case 'binaryop':
			// eslint-disable-next-line
			term = createBinaryTerm(context, node);
			break;
		case 'condition':
			// eslint-disable-next-line
			term = createConditionTerm(context, node);
			break;
		case 'list':
			// eslint-disable-next-line
			term = createListTerm(context, node);
			break;
		case 'function':
			// eslint-disable-next-line
			term = createFunctionTerm(context, node, parent);
			break;
		case 'undef':
			term = new NullTerm();
			term._invalid = !!node.isInvalid;
			break;
		default:
			// number, string or identifier:
			if (node.type === 'string' && node.constant === true) {
				// string constant operand:
				term = new Term(new StringOperand(node.value));
			} else if (node.type === Operand.TYPE.NUMBER) {
				term = new Term(new Operand(Operand.TYPE.NUMBER, Number(node.value)));
			} else {
				const operand = Operand.fromString(node.value);
				const checkIdentifier = !operand || operand.isTypeOf(Operand.TYPE.STRING);
				if (checkIdentifier && node.type === 'identifier' && context.strict) {
					// unknown identifier!
					node.isInvalid = true;
					if (!context.ignoreErrors) {
						throw ParserError.create({
							name: 'Parser Error',
							code: ErrorCode.UNKNOWN_IDENTIFIER,
							operand: node.value,
							message: 'Unknown identifier or parameter!' });
					}
				}
				term = new Term();
				term.operand = operand
					|| (node.value === '' ? new StringOperand(node.value) : Operand.UNDEF);
			}
			term._invalid = !!node.isInvalid;
		}
	}
	// term.separators = { ...context.separators };
	return term;
}

function createUnaryTerm(context, node) {
	const term = new Term();
	term._invalid = !!node.isInvalid;
	term.useBrackets = !!node.useBrackets;
	term.operator = Operation.getUnary(node.operator);
	term.left = createTerm(context, node.arg, node);
	return term;
}
function createBinaryTerm(context, node) {
	// DL 1434 (and similar): throw an error if validate, i.e. in strict mode...
	validateNode(node, context, binaryNodeValidator);
	const term = new Term();
	term._invalid = !!node.isInvalid;
	term.useBrackets = !!node.useBrackets;
	term.left = createTerm(context, node.left, node);
	term.right = createTerm(context, node.right, node);
	term.operator = Operation.get(node.operator);
	return term;
}
function createConditionTerm(context, node) {
	const term = new CondTerm();
	term._invalid = !!node.isInvalid;
	term.useBrackets = !!node.useBrackets;
	term.operator = Operation.get('?');
	term.condition = createTerm(context, node.condition, node);
	term.left = createTerm(context, node.onTrue, node);
	term.right = createTerm(context, node.onFalse, node);
	return term;
}
function createListTerm(context, node) {
	const term = new ListTerm();
	term._invalid = !!node.isInvalid;
	term.params = node.params.map(param => createTerm(context, param, node));
	return term;
}
function createFunctionTerm(context, node, parent) {
	let term = context.createFunctionTerm(node, parent);
	if (term) {
		// function parameters can be terms itself, so:
		term.params = node.params.map(param => createTerm(context, param, node));
	} else {
		term = new FuncTerm(node.value);
	}
	term._invalid = !!node.isInvalid;
	term.useBrackets = !!node.useBrackets;
	return term;
}


module.exports = class Transformer {
	static createTerm(ast, context) {
		return createTerm(context, ast);
	}

	static createValueTerm(node, context) {
		return node.operator ? createTerm(context, node) : new Term(operandFromNode(node));
	}
};
