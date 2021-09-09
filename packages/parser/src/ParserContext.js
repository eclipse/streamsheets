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
const ErrorCode = require('./ErrorCodes');
const DefFunctions = require('./Functions').Functions;
const Locale = require('./Locale');
const { Operand, StringOperand } = require('./Operand');
const ParserError = require('./ParserError');
const { Term, FuncTerm } = require('./Term');

/* eslint-disable */
if (typeof Object.assign !== 'function') {
	Object.assign = function(target) {
		if (target == null) {
			throw new TypeError('Cannot convert undefined or null to object');
		}

		target = Object(target);
		for (let index = 1; index < arguments.length; index += 1) {
			const source = arguments[index];
			if (source != null) {
				for (let key in source) {
					if (Object.prototype.hasOwnProperty.call(source, key)) {
						target[key] = source[key];
					}
				}
			}
		}
		return target;
	};
}
/* eslint-enable */

class ParserContext {
	constructor(scope) {
		this.scope = scope;
		this.functions = Object.assign({}, DefFunctions);
		this.ignoreErrors = false;
		// use separators from default locale...
		this.separators = Object.assign({}, Locale.DEFAULT.separators);

		// DO NOT USE!! tmp. under review. used to check identifier
		this.strict = false; // support different levels?
	}

	createIdentifierTerm(node /*, parent */) {
		const identifier = Operand.fromString(node.value);
		const isInvalid = identifier && identifier.isTypeOf(Operand.TYPE.STRING);
		// return isInvalid && this.strict ? undefined : identifier;
		if (isInvalid && this.strict) {
			node.isInvalid = true;
			if (!this.ignoreErrors) {
				throw ParserError.create({
					name: 'Parser Error',
					code: ErrorCode.UNKNOWN_IDENTIFIER,
					operand: node.value,
					message: 'Unknown identifier or parameter!'
				});
			}
		}
		const term = new Term();
		term.operand = identifier || (node.value === '' ? new StringOperand(node.value) : Operand.UNDEF);
		return term;
	}

	/**
	 * @param node 	An AST node provided by parser
	 * @param [parent] An AST node provided by parser which is the parent node. Optional!
	 * @return Term or <code>undefined</code>
	 */
	// eslint-disable-next-line
	createReferenceTerm(node, parent) {}

	/**
	 * @param node 	An AST node provided by parser
	 * @param [parent] An AST node provided by parser which is the parent node. Optional!
	 * @return Term or <code>undefined</code>. <b>Note:</b> since function parameters are terms it is recommended to
	 * not set them in returned term.
	 */
	// eslint-disable-next-line
	createFunctionTerm(node, parent) {
		const func = this.getFunction(node.value);
		const term = func && new FuncTerm(node.value);
		if (term) {
			term.func = func;
			term.scope = this.scope;
		}
		return term;
	}

	hasFunction(id) {
		return !!this.functions[id.toUpperCase()];
	}

	isFunctionPrefix(/* prefix, expr, index */) {
		return false;
	}

	// should return function to call or undefined
	getFunction(id) {
		return this.functions[id.toUpperCase()];
	}

	setFunction(id, func) {
		this.functions[id.toUpperCase()] = func;
	}
}

module.exports = ParserContext;
