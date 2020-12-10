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
const { SheetParser } = require('../');

// WHY? if we mock here instead of mocking in corresponding test it works with above SheetParser require!!
jest.mock('../src/streams/StreamMessagingClient');

// FOR TESTs we do not use persistent outbox
process.env.OUTBOX_PERSISTENT = false;

// some dummy function implementations:
const EXECUTE = (sheet, ...terms) => {
	// execute({ message, selector }, callback, repetitions) {
	if (sheet.isProcessing) {
		let message;
		const machine = sheet.machine;
		const context = EXECUTE.context;
		const streamsheet = machine.getStreamSheetByName(terms[0].value);
		const repetitions = terms[1] ? terms[1].value : 1;
		if (terms[2]) {
			const msgstr = terms[2].value;
			const box = msgstr.startsWith('in:') ? sheet.streamsheet.inbox : machine.outbox;
			const msgId = msgstr.startsWith('in:') ? msgstr.substr(3) : msgstr.substr(4);
			message = box.peek(msgId);
		}
		if (!context.initialized) {
			context.initialized = true;
			context.addDisposeListener(() => {
				streamsheet.cancelExecute();
				if (sheet.isPaused) sheet.streamsheet.resumeProcessing();
			});
		}
		return streamsheet.execute(message, repetitions, sheet.streamsheet);
	}
	return true;
};

const functions = {
	EXECUTE,
	MOD: (sheet, ...terms) => {
		const val = terms[0] ? terms[0].value : 0;
		const dividend = terms[1] ? terms[1].value : 1;
		return val % dividend;
	},
	RETURN: (sheet, ...terms) => {
		let retval = true;
		if (sheet.isProcessing) {
			retval = terms[0] ? terms[0].value : true;
			sheet.streamsheet.stopProcessing(retval);
		}
		return retval;
	},
	PAUSE: (sheet /* , ...terms */) => {
		if (sheet.isProcessing) {
			sheet.streamsheet.pauseProcessing();
		}
	}
	// ,
	// RESUME: (sheet /* , ...terms */) => {
	// 	if (sheet.isProcessing) {
	// 		sheet.streamsheet.resumeProcessing();
	// 	}
	// }
};

// setup parser and its context...
Object.assign(SheetParser.context.functions, functions);
