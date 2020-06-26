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
const { Operand } = require('@cedalo/parser');
const TreeItemsNode = require('../model/TreeItemsNode');
const BooleanExpression = require('../expr/BooleanExpression');
const StringExpression = require('../expr/StringExpression');
const NumberExpression = require('../expr/NumberExpression');

const termType = (term, hint) => {
	let { type } = term.operand;
	if (type === Operand.TYPE.UNDEF) {
		type =
			term.isUnit || hint === TreeItemsNode.DataType.NUMBER
				? Operand.TYPE.NUMBER
				: hint === TreeItemsNode.DataType.BOOLEAN
				? Operand.TYPE.BOOL
				: Operand.TYPE.STRING;
	}
	return type;
};

module.exports = class ExpressionHelper {
	static createExpressionFromValueTerm(term, typeHint) {
		let expr = term == null ? new StringExpression('') : undefined;
		if (!expr) {
			let { value } = term;
			const type = termType(term, typeHint);
			switch (type) {
				case Operand.TYPE.BOOL:
					value = `${value}`.toLowerCase() === 'true';
					expr = new BooleanExpression(value);
					break;
				case Operand.TYPE.NUMBER:
					value = value != null ? value : 0;
					expr = new NumberExpression(Number(value));
					break;
				default:
					value = value != null ? value : '';
					expr = new StringExpression(`${value}`);
			}
		}
		return expr;
	}
};
