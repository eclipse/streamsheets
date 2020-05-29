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
'use strict';

const NumberFormatter = require('./src/NumberFormatter');
const Localizer = require('./src/Localizer');
const DaysOfWeek = require('./src/language/daysofweek');
const MonthsOfYear = require('./src/language/months');

module.exports = {
	NumberFormatter,
	Localizer,
	DaysOfWeek,
	MonthsOfYear
};
