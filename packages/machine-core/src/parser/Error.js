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
const { Operand, Term } = require('@cedalo/parser');

class ErrorOperand extends Operand {

	static fromError(error, formula) {
		return new ErrorOperand(error, formula);
	}

	constructor(error, formula) {
		super(Operand.TYPE.STRING, `${error}`);
		this.isError = true;
		this.formula = formula;
	}

	copy() {
		return new ErrorOperand(this.type, this.value);
	}

	isEqualTo(operand) {
		return super.isEqualTo(operand) && operand.isError;
	}

	toString() {
		return this.formula;
	}
}

class ErrorTerm extends Term {

	static fromError(error, formula) {
		return new ErrorTerm(ErrorOperand.fromError(error), formula);
	}

	constructor(op, formula) {
		super(op);
		this.isError = true;
		this.formula = formula;
	}

	copy() {
		return ErrorTerm.fromError(this.operand.value, this.formula);
	}

	isEqualTo(term) {
		return !!term && term.isError && this.formula === term.formula;
	}


	toString(/* ...params */) {
		return this.formula || this.value;
	}
}

module.exports = {
	ErrorOperand,
	ErrorTerm
};
