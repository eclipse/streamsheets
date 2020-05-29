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

const loopcount = (sheet) =>
	runFunction(sheet)
		.withArgCount(0)
		.addMappedArg(() => sheet.streamsheet || ERROR.NO_STREAMSHEET)
		.run((streamsheet) => {
			const count = streamsheet.getLoopCount();
			return streamsheet.isLoopAvailable() && count >= 0 ? count : ERROR.NA;
		});

const loopindex = (sheet) =>
	runFunction(sheet)
		.withArgCount(0)
		.addMappedArg(() => sheet.streamsheet || ERROR.NO_STREAMSHEET)
		// DL-1080: returned loop index should be based to 1
		.run(streamsheet => (streamsheet.isLoopAvailable() ? streamsheet.getLoopIndex() + 1 : ERROR.NA));


module.exports = {
	LOOPCOUNT: loopcount,
	LOOPINDEX: loopindex,
};
