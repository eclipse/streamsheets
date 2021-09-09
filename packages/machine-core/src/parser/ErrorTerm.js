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
const { ErrorInfo } = require('@cedalo/error-codes');
const { Term } = require('@cedalo/parser');

class ErrorTerm extends Term {
	constructor(errorInfo, formula) {
		super();
		this.isError = true;
		this.formula = formula;
		this.errorInfo = errorInfo;
	}

	get value() {
		return this.errorInfo;
	}

	isEqualTo(term) {
		return !!term && term.isError && this.formula === term.formula;
	}

	newInstance() {
		return ErrorTerm.fromError(this.errorInfo, this.formula);
	}

	toString(/* ...params */) {
		return this.formula || this.errorInfo.code;
	}
}

const fromError = (error, formula) => {
	// error might be an error-code or error-info
	const errInfo = error && error.isErrorInfo ? error : ErrorInfo.create(error);
	return new ErrorTerm(errInfo, formula);
};

module.exports = {
	fromError
};
