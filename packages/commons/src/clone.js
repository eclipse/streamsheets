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
const rfdcClone = require('rfdc')();
// is stable in node 12! => so no need for external lib
// const { deserialize, serialize } = require('v8');

// by far slowest choice
// const v8Clone = (obj) => deserialize(serialize(obj));
// has problems with Date, circular refs and removes undefined!
// const jsonClone = (obj) => JSON.parse(JSON.stringify(obj));


const clone = (obj, throwOnError = false) => {
	try {
		// return v8Clone(obj);
		// return jsonClone(obj);
		return rfdcClone(obj);
	} catch (err) {
		if (throwOnError) throw err;
	}
	return undefined;
};
module.exports = clone;
