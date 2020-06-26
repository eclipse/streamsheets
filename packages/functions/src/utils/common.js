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
// const { FunctionErrors } = require('@cedalo/error-codes');

const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

const cutBrackets = (str) => {
	str = str.startsWith('[') ? str.substr(1) : str;
	return str.endsWith(']') ? str.substr(0, str.length - 1) : str;
};


// const ignoreOnError = (fn) => (res) => FunctionErrors.isError(res) ? res : fn(res);
// const wrapFunctions = (fn, fns) => fns.map(f => fn(f));

// const pipeCheckError = (...fns) => (val) => {
// 	let res = val;
// 	for (let i = 0; i < fns.length && !FunctionErrors.isError(res); i += 1) {
// 		res = fns[i](res);
// 	}
// 	return res;
// };

module.exports = {
	cutBrackets,
	deepCopy
};
