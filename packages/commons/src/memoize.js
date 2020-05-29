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
const keyGenerator = (...args) => args.join(',');

const func = (fn, keyfn = keyGenerator) => {
	const mem = {};
	return (...args) => {
		const key = keyfn(...args);
		if (mem[key] == null) mem[key] = fn(...args);
		return mem[key];
	};
};

module.exports = {
	func
};
