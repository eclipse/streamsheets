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
const math = require('./math');
const sum = require('./sum');
const { ARCTAN, ARCTAN2, COS, PI, SIN, TAN } = require('@cedalo/parser').Functions;

module.exports = {
	functions: {
		...math,
		...sum,
		ARCTAN,
		ARCTAN2,
		COS,
		PI,
		SIN,
		TAN
	}
};
