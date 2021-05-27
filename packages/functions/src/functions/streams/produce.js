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
const publishinternal = require('../../utils/publishinternal');
const { runFunction, sheet: { messageFromBoxOrValue, getMachine } } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const produce = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(2)
		.addMappedArg(() => getMachine(sheet) || ERROR.NO_MACHINE)
		.mapNextArg((streamTerm) => streamTerm)
		.mapNextArg((messageTerm, machine) => {
			const message = messageFromBoxOrValue(machine, sheet, messageTerm);
			if (typeof message === 'string') {
				try {
					return JSON.parse(message);
				} catch (e) {
					return ERROR.INVALID_PARAM;
				}
			}
			return message;
		})
		.run((machine, streamTerm, message) => publishinternal(sheet, streamTerm, message));
produce.displayName = true;

module.exports = produce;
