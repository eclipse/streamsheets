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
const utils = require('./src/utils');
const help = require('./help');
const functions = require('./src/functions');
const FunctionFactory = require('./src/factory/FunctionFactory');
const testutils = require('./test/utilities');

module.exports = {
	help,
	utils,
	test: {
		utils: testutils
	},
	functions,
	FunctionFactory
};
