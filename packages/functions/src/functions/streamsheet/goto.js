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

// maybe renamed to continue...
const goto = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg(term => term.operand)
		.addMappedArg((operand) => {
			const index = operand.index;
			return index != null ? index : ERROR.INVALID_PARAM;
		})
		.run((oprand, index) => {
			sheet.processor.goto(index);
			return true;
		});


module.exports = goto;
