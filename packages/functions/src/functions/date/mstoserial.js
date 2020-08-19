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
const { convert, serialnumber: { ms2serial } } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const {	runFunction } = require('../../utils');

const ERROR = FunctionErrors.code;


const mstoserial = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((ms) => convert.toNumber(ms.value, ERROR.INVALID_PARAM))
		.run((ms) => ms2serial(ms));


module.exports = mstoserial;
