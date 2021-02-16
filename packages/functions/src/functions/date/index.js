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
const date = require('./date');
const help = require('./help');
const mstoserial = require('./mstoserial');
const serialtoms = require('./serialtoms');

module.exports = {
	help,
	functions: {
		...date,
		MSTOSERIAL: mstoserial,
		SERIALTOMS: serialtoms
	}
};
