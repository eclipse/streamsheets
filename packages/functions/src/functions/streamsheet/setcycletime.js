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
const { runFunction, sheet: { getMachine } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const setcycletime = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((cycletime) => {
			const time = convert.toNumber(cycletime.value);
			return time == null || time < 1 ? ERROR.VALUE : time;
		})
		.addMappedArg(() => getMachine(sheet) || ERROR.NO_MACHINE)
		.run((cycletime, machine) => {
			machine.cycletime = cycletime;
			return true;
		});


module.exports = setcycletime;
