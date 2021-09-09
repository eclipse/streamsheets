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
const logger = require('../logger').create({ name: 'SheetParserContext' });
const FunctionRegistry = require('../FunctionRegistry');
const ErrorTerm = require('./ErrorTerm');
const { IdentifierOperand, ParserContext, Term } = require('@cedalo/parser');
const DotReferenceOperator = require('./DotReferenceOperator');
const { referenceFromNode } = require('./References');

// DL-1431
const EXCLUDE_FUNCTIONS = ['ACOS', 'ASIN', 'ATAN', 'ATAN2'];
const filter = (functions) => Object.entries(functions).reduce((acc, [name, func]) => {
		if (!EXCLUDE_FUNCTIONS.includes(name)) acc[name] = func;
		return acc;
	}, {});

const executor = (func) => function wrappedFunction(sheet, ...terms) {
	let result;
	const term = wrappedFunction.term;
	func.term = term; // deprecated
	func.context = term.context;
	wrappedFunction.displayName = func.displayName;
	try {
		result = func(sheet, ...terms);
	} catch (err) {
		logger.error('Error', err);
		return ErrorInfo.create(FunctionErrors.code.FUNC_EXEC, err.message, term.name);
	}
	func.term = undefined;
	func.context = undefined;
	return result;
};

// DL-1253: an identifier can contain an error code, so create an ErrorTerm for it
const createErrorTermFromNode = (node) =>
	node.type === 'identifier' && FunctionErrors.isError(node.value) ? ErrorTerm.fromError(node.value) : undefined;

const referenceTerm = (node, context) => {
	const operand = referenceFromNode(node, context);
	if (operand) {
		const term = new Term();
		term.operand = operand;
		return term;
	}
	return createErrorTermFromNode(node);
};

// for internally use only => to ease parsing
const noop = (/* sheet, ...terms */) => null;
const checkPrefix = (prefix, expr, index) => (name) =>
	name.startsWith(prefix) && expr.charAt(index + name.length) === '(';
const isDotFunction = (name2) => name2.indexOf(DotReferenceOperator.SYMBOL) > 0;
const isFirst = (node, parent) => node.start === parent.left.start && parent.left.operator == null;

class SheetParserContext extends ParserContext {
	constructor() {
		super();
		this.strict = true;
		this.functions = Object.assign({ NOOP: noop }, filter(this.functions));
		this.functionNames = Object.keys(this.functions).filter(isDotFunction);
	}

	updateFunctions(newFunctions) {
		this.functions = Object.assign(this.functions, newFunctions);
		this.functionNames = Object.keys(this.functions).filter(isDotFunction);
	}
	createIdentifierTerm(node, parent) {
		if (parent && parent.operator === DotReferenceOperator.SYMBOL) {
			// capitalize first part if its a function, mainly used for inbox, inboxdata...
			const str = node.value;
			const identifier = isFirst(node, parent) && this.hasFunction(str) ? str.toUpperCase() : str;
			return new Term(new IdentifierOperand(identifier));
		}
		return super.createIdentifierTerm(node, parent);
	}

	// node: is a parser AST node
	// return a reference term or undefined...
	createReferenceTerm(node) {
		return referenceTerm(node, this);
	}

	isFunctionPrefix(prefix = '', expr, index) {
		prefix = prefix.toUpperCase();
		const hasPrefix = checkPrefix(prefix, expr, index);
		return FunctionRegistry.getDotFunctions().some(hasPrefix) || this.functionNames.some(hasPrefix);
	}

	getFunction(id) {
		const func = FunctionRegistry.getFunction(id) || super.getFunction(id);
		// wrap into an execution function...
		return func ? executor(func) : func;
	}

	hasFunction(id) {
		return FunctionRegistry.hasFunction(id) || super.hasFunction(id);
	}
}

module.exports = SheetParserContext;
