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
const { runFunction } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const indexFromTerm = (term) => term.operand && term.operand.index;

const continueAt = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((term) => indexFromTerm(term) || ERROR.INVALID_PARAM)
		.run((index) => {
			const streamsheet = sheet.streamsheet;
			if (streamsheet) {
				streamsheet.continueProcessingAt(index);
				return true;
			}
			return ERROR.NO_STREAMSHEET;
		});

module.exports = continueAt;
