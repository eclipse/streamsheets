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
const moment = require('moment');

const code = {
	short: 'en',
	iso: 'en-GB'
};

const formats = [
	'DD.MM.YYYY',
	'YYYY-MM-DD',
	'DD MMM YYYY',
	// support some US typical formats too => late we can decide to extract into own module...
	'MM.DD.YYYY',
	'MM/DD/YYYY',
	'DD-MMM-YYYY',
	'MMM-YY',
	'MMM DD, YYYY',
	'MM.DD.YY k:m',
	'MM.DD.YY h:m a'
];

const separators = { decimal: '.', thousand: ',', parameter: ',' };

const parse = datestr => moment(datestr, formats, code.short).valueOf();


module.exports = {
	code,
	parse,
	separators
};
