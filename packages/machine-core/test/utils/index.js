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
const sheet = require('./sheet');
const functions = require('./functions');
const monitor = require('./monitor');
const validate = require('./validate');

const expectValue = (value) => ({
	toBeInRange: (min, max) => {
		expect(value).toBeGreaterThanOrEqual(min);
		expect(value).toBeLessThanOrEqual(max);
	}
});


const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
	expectValue,
	functions,
	...monitor,
	...sheet,
	validate,
	wait
};
