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
import JSG from '@cedalo/jsg-ui';
import { BinaryOperator, BoolOperator, Operation, IdentifierOperand, Term } from '@cedalo/parser';


const { GraphParserContext } = JSG;

const DOT_REF_SYMBOL = '.';

// eslint-disable-next-line eqeqeq
Operation.register(new BoolOperator('<>', (left, right) => left != right), 4); // we need a sheet-parser module!!
Operation.register(new BinaryOperator(DOT_REF_SYMBOL, (/* left, right */) => '#CALC'), 12);

const isFunctionParam = (node, parent) =>
	parent && parent.type === 'function' && (node.type === 'string');

const checkPrefix = (prefix, expr, index) => (name) =>
	name.startsWith(prefix) && expr.charAt(index + name.length) === '(';

const isFirst = (node, parent) => node.start === parent.left.start && parent.left.operator == null;

const keepParserFunctions = (keep, functions) => keep.reduce((acc, name) => ({ ...acc, [name]: functions[name] }), {});

export default class SheetParserContext extends GraphParserContext {
	constructor(functionNames = []) {
		super();
		this.strict = true;
		const sheetFunctions = functionNames.reduce((acc, name) => ({ ...acc, [name]: () => '#CALC' }), {});
		// DL-1587: keep some parser defined functions => NOTE: simply keeping all parser functions didn't work! why???
		const parserFunctions = keepParserFunctions(['MIN', 'MAX'], this.functions);
		this.functions = Object.assign({}, this.functions, sheetFunctions, parserFunctions);
		this.functionNames = Object.keys(this.functions);
	}

	// we may need a sheet-parser module!!
	createIdentifierTerm(node, parent) {
		if (parent && parent.operator === DOT_REF_SYMBOL) {
			// capitalize first part if its a function, mainly used for inbox, inboxdata...
			const str = node.value;
			const identifier = isFirst(node, parent) && this.hasFunction(str) ? str.toUpperCase() : str;
			return new Term(new IdentifierOperand(identifier));
		}
		return super.createIdentifierTerm(node, parent);
	}

	createReferenceTerm(node, parent) {
		return (isFunctionParam(node, parent)) ? undefined : super.createReferenceTerm(node);
	}

	isFunctionPrefix(prefix = '', expr, index) {
		prefix = prefix.toUpperCase();
		const hasPrefix = checkPrefix(prefix, expr, index);
		return this.functionNames.some(hasPrefix) || this.functionNames.some(hasPrefix);
	}
}
