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
const { FunctionErrors, ErrorInfo } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const calc = (left, right, op) => {
	left = left != null ? Number(left) : 0;
	right = right != null ? Number(right) : 0;
	return isNaN(left) || isNaN(right) ? ErrorInfo.create(ERROR.VALUE) : op(left, right);
};

const createErrorInfo = (error, term) => {
	const errorInfo = error.isErrorInfo ? error : ErrorInfo.create(error);
	if (term) {
		if (errorInfo.paramIndex == null) return errorInfo.setParamIndex(term.toString());
		if (term.name) return errorInfo.setFunctionName(term.name);
	}
	return errorInfo;
};

module.exports = {
	calc,
	createErrorInfo
};
