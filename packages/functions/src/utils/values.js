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
const { convert } = require('@cedalo/commons');

const isNumber = (val) => convert.toNumber(val) != null;

const isEven = nr => nr % 2 === 0;

const asString = (val, defval) => (val == null ? defval : `${val}`);

// taken from MDN Math.round() doc
const _shift = (nr, precision, reverse) => {
	const numArray = asString(nr).split('e');
	precision = reverse ? -precision : precision;
	// return +(numArray[0] + 'e' + (numArray[1] ? +numArray[1] + precision : precision));
	return +(`${numArray[0]}e${(numArray[1] ? +numArray[1] + precision : precision)}`);
};
const roundNumber = (nr, precision) => _shift(Math.round(_shift(nr, precision, false)), precision, true);

module.exports = {
	isNumber,
	isEven,
	roundNumber
};
