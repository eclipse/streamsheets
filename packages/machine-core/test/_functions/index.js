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
const EXECUTE = require('./execute.mock');
const PAUSE = require('./pause.mock');
const LOOPINDICES = require('./loopIndices');

module.exports = {
	ARRAY: (sheet, ...terms) => {
		return terms.map((term) => term.value);
	},
	EXECUTE,
	MOD: (sheet, ...terms) => {
		const val = terms[0] ? terms[0].value : 0;
		const dividend = terms[1] ? terms[1].value : 1;
		return val % dividend;
	},
	RETURN: (sheet, ...terms) => {
		let retval = true;
		if (sheet.isProcessing) {
			retval = terms[0] ? terms[0].value : true;
			sheet.streamsheet.stopProcessing(retval);
		}
		return retval;
	},
	LOOPINDICES,
	PAUSE
	// ,
	// RESUME: (sheet /* , ...terms */) => {
	// 	if (sheet.isProcessing) {
	// 		sheet.streamsheet.resumeProcessing();
	// 	}
	// }
};
