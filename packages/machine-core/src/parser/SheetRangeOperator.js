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
const BinaryOperator = require('@cedalo/parser').BinaryOperator;
const SheetRange = require('../machine/SheetRange');


const indexFromTerm = (term) => {
	let index;
	if (term) {
		const value = term.value;
		const operand = value != null && value.operand ? value.operand : term.operand;
		if (operand.isTypeOf('CellReference')) index = operand.index;
	}
	return index;
};

class SheetRangeOperator extends BinaryOperator {

	constructor() {
		super(':');
		this.range = SheetRange.fromRangeStr('A1:A1');
	}

	calc(left, right) {
		const end = indexFromTerm(right);
		const start = indexFromTerm(left);
		return start && end ? SheetRange.fromStartEnd(start, end, this.range) : null;
	}
}

module.exports = SheetRangeOperator;
