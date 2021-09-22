/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { BinaryOperator, Operation, IdentifierOperand, Term } = require('@cedalo/parser');

const DOT_REF_SYMBOL = '.';

// register dummy dot operator
Operation.register(new BinaryOperator(DOT_REF_SYMBOL, (/* left, right */) => '#CALC'), 12);

const checkPrefix = (prefix, expr, index) => (name) =>
	name.startsWith(prefix) && expr.charAt(index + name.length) === '(';

const isFirst = (node, parent) => node.start === parent.left.start && parent.left.operator == null;

const DotOperatorParserContext = (BaseParserContext) =>
	class extends BaseParserContext {
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

		isFunctionPrefix(prefix = '', expr, index) {
			prefix = prefix.toUpperCase();
			const hasPrefix = checkPrefix(prefix, expr, index);
			return this.functionNames.some(hasPrefix);
		}
	};

module.exports = DotOperatorParserContext;
