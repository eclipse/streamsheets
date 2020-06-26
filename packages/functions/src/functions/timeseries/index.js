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
const help = require('./help');
const TIMEAGGREGATE = require('./timeaggregate');
const TIMEQUERY = require('./timequery');
const TIMESTORE = require('./timestore');

module.exports = {
	help,
	functions: {
		TIMEAGGREGATE,
		TIMEQUERY,
		TIMESTORE
	}
};
