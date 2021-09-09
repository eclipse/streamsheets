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
const { functions } = require('@cedalo/functions');
const { SheetParser } = require('../');

// WHY? if we mock here instead of mocking in corresponding test it works with above SheetParser require!!
jest.mock('../src/streams/StreamMessagingClient');

// FOR TESTs we do not use persistent outbox
process.env.OUTBOX_PERSISTENT = false;

// define & add some simple helper functions to ease testing
const loopIndices = (sheet /* , ...terms */) => {
	const context = loopIndices.context;
	if (sheet.isProcessing) {
		if (!context.initialized) {
			context.initialized = true;
			context.result = [];
		}
		const loopIndex = sheet.streamsheet.getLoopIndex();
		context.result.push(loopIndex);
	}
	return context.result ? context.result.join(',') : '';
};
const messageids = (sheet /* , ...terms */) => {
	const context = messageids.context;
	if (sheet.isProcessing) {
		if (!context.initialized) {
			context.initialized = true;
			context.result = [];
		}
		const message = sheet.streamsheet.inbox.peek();
		if (message) {
			context.result.push(message.id);
		}
	}
	return context.result ? context.result.join(',') : '';
};
const helperFunctions = {
	ARRAY: (sheet, ...terms) => {
		return terms.map((term) => term.value);
	},
	'JSON.FROM.TEXT': (sheet, jsonstr) => JSON.parse(jsonstr.value),
	LOOPINDICES: loopIndices,
	MESSAGEIDS: messageids,
	MOD: (sheet, ...terms) => {
		const val = terms[0] ? terms[0].value : 0;
		const dividend = terms[1] ? terms[1].value : 1;
		return val % dividend;
	}
};
SheetParser.context.updateFunctions(Object.assign({}, functions, helperFunctions));
