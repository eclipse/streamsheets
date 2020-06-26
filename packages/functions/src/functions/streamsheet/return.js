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

const _return = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMaxArgs(1)
		.addMappedArg(() => sheet.streamsheet || ERROR.NO_STREAMSHEET)
		.ignoreError()
		.mapNextArg((retval) => retval && retval.value)
		.run((streamsheet, retval) => {
			streamsheet.stopProcessing(retval);
			return retval != null ? retval : true;
		});

module.exports = _return;
