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
const { runFunction, sheet: sheetutils } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const triggerstep = (sheet, ...terms) => runFunction(sheet, terms).withArgCount(0).run(() => {
	// should not be used directly in cell:
	const cell = sheetutils.cellFromFunc(triggerstep);
	const streamsheet = sheet.streamsheet;
	return (cell || !streamsheet) ? ERROR.INVALID : streamsheet.step('force');
});

module.exports = triggerstep;
