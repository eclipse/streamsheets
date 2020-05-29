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
const Tokenizer = require('./Tokenizer');
const Transformer = require('./Transformer');

const createInfo = (token, parent, paramIndex) => {
	const { arg, end, isInvalid, start, type } = token;
	const info = { arg, end, isInvalid, start, type, parent, paramIndex, value: token.operator || token.value };
	if (parent && paramIndex != null) {
		const params = parent.params || [];
		params[paramIndex] = info;
		parent.params = params;
	}
	return info;
};
const traverse = (token, cb, parent, index) => {
	const info = createInfo(token, parent,index);
	const isCondition = !!token.condition;
	const left = token.left || token.onTrue;
	const right = token.right || token.onFalse;
	if (left) traverse(left, cb, info, isCondition ? 1 : undefined);
	if (right) traverse(right, cb, info, isCondition ? 2 : undefined);
	if (token.condition) traverse(token.condition, cb, info, 0);
	if (token.params) token.params.forEach((param, idx) => traverse(param, cb, info, idx));
	cb(info);
};
const tokens2info = (tokens) => {
	const alltokens = [];
	traverse(tokens, (info) => alltokens.push(info));
	return alltokens;
};
const compareParamIndex = (idx1, idx2) => {
	// eslint-disable-next-line no-nested-ternary
	const i1 = idx1 != null ? idx1 : idx2 != null ? idx2 + 1 : 0;
	// eslint-disable-next-line no-nested-ternary
	const i2 = idx2 != null ? idx2 : idx1 != null ? idx1 + 1 : 0;
	return i1 - i2;
};
const compareInfo = (i1, i2) => {
	const idx = i1.start - i2.start;
	return idx === 0 ? compareParamIndex(i1.paramIndex, i2.paramIndex): idx;
};

module.exports = class Parser {

	static parse(formula, context) {
		const ast = formula ? Tokenizer.createAST(formula, context) : undefined;
		return ast ? Transformer.createTerm(ast, context) : undefined;
	}

	static parseValue(str, context) {
		const node = Tokenizer.createValueNode(str, context);
		return node ? Transformer.createValueTerm(node, context) : undefined;
	}

	static parseFormula(formula, context) {
		return Parser.parse(formula, context);
	}

	static getFormulaInfos(formula, context) {
		return formula ? tokens2info(Tokenizer.createAST(formula, context)).sort(compareInfo) : [];
	}

	// TESTING PURPOSE ONLY
	static resultFrom(node, context) {
		let result;
		if (node.type === 'unaryop') {
			// eslint-disable-next-line
			const value = (node.arg.value != undefined) ? (node.arg.type === 'number' ? Number(node.arg.value) : node.arg.value) : Parser.resultFrom(node.arg, context);
			if (node.operator === '!') {
				const res = !!value;
				result = !res;
			} else {
				// result = node.arg.type === 'number' ? Number(node.arg.value) : node.arg.value;
				result = node.operator === '-' ? -value : value;
			}
		} else if (node.type === 'binaryop') {
			const leftval = Parser.resultFrom(node.left, context);
			const rightval = Parser.resultFrom(node.right, context);
			switch (node.operator) {
			case '+':
				result = leftval + rightval;
				break;
			case '-':
				result = leftval - rightval;
				break;
			case '*':
				result = leftval * rightval;
				break;
			case '/':
				result = leftval / rightval;
				break;
			case '>':
				result = leftval > rightval;
				break;
			case '>=':
				result = leftval >= rightval;
				break;
			case '<':
				result = leftval < rightval;
				break;
			case '<=':
				result = leftval <= rightval;
				break;
			case '=':
			case '==':
				result = leftval === rightval;
				break;
			case '!=':
				result = leftval !== rightval;
				break;
			case '|':
				result = leftval || rightval;
				break;
			case '&':
				result = leftval && rightval;
				break;
			default:
			}
		} else if (node.type === 'condition') {
			const condition = Parser.resultFrom(node.condition, context);
			result = condition ? Parser.resultFrom(node.onTrue, context) : Parser.resultFrom(node.onFalse, context);
		} else if (node.type === 'function') {
			const func = context && context.getFunction(node.value);
			// eslint-disable-next-line
			const params = node.params.map((param) => ({ value: Parser.resultFrom(param, context) }));
			// const params = node.params.map(param => (param.type === 'number' ? Number(param.value) : (param.type === 'function' ? Parser.resultFrom(param, context) : param.value)));
			result = func ? func(context.scope, ...params) : undefined;
		} else {
			result = node.type === 'number' ? Number(node.value) : node.value;
		}
		return result;
	}
};
