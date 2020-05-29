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
const { requestinternallegacy } = require('./request');
const {	sheet: { getMachine } } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Message } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const kafkacommand = (sheet, ...terms) => {
	let error = terms.length < 4 && terms.length > 8 ? ERROR.ARGS : undefined;
	if (!error && sheet.isProcessing) {
		const machine = getMachine(sheet);
		error = FunctionErrors.ifNot(machine, ERROR.NO_MACHINE);
		const [
			streamTerm,
			commandTerm,
			targetBoxTerm,
			timeoutTerm
		] = terms;
		const config = {
			type: 'COMMAND',
			ksqlCommand: commandTerm && commandTerm.value,
			timeout: timeoutTerm && timeoutTerm.value
		};
		if (error) return error;
		return requestinternallegacy(kafkacommand.term, sheet, streamTerm, new Message(config), targetBoxTerm);
	}
	return error || true; // not processing, so its ok...
};

module.exports = kafkacommand;
