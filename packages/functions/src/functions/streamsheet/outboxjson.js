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
const { runFunction, sheet: { getMachine, getMessagesFromBox } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const getOutbox = (sheet) => {
	const machine = getMachine(sheet);
	return machine && machine.outbox;
};


const outboxjson = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.addMappedArg(() => getOutbox(sheet) || ERROR.INVALID_PARAM)
		.mapNextArg(inclMetaData => convert.toBoolean(inclMetaData && inclMetaData.value, false))
		.run((outbox, inclMetaData) => getMessagesFromBox(outbox, inclMetaData));


module.exports = outboxjson;
