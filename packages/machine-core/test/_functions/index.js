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
const MESSAGEIDS = require('./messageids');

module.exports = {
	ARRAY: (sheet, ...terms) => {
		return terms.map((term) => term.value);
	},
	EXECUTE,
	JSON: (sheet, ...terms) => {
		// simply return an object with key value pairs
		return terms.reduce((obj, curr, index) => {
			if (index % 2 === 0) obj[curr.value] = terms[index + 1].value;
			return obj;
		}, {});
	},
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
	MESSAGEIDS,
	PAUSE
};
