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
const { Message } = require('../..');

const execute = (sheet, ...terms) => {
	const cancelExecute = (calledStreamSheet) => (context) => {
		calledStreamSheet.cancelExecute();
		context.resumeFn();
	};
	const resumeFromExecute = (context, callingStreamSheet) => (retval) => {
		if (context.term.cell) context.term.cell.value = retval != null ? retval : true;
		callingStreamSheet.resumeProcessing(retval);
	};

	if (sheet.isProcessing) {
		const machine = sheet.machine;
		const context = execute.context;
		const callingStreamSheet = sheet.streamsheet;
		const calledStreamSheet = machine.getStreamSheetByName(terms[0].value);
		const repetitions = terms[1] ? terms[1].value : 1;
		const pace = terms[3] != null ? !!terms[3].value : null;
		let message;
		if (terms[2]) {
			const msgdata = terms[2].value;
			if (typeof msgdata === 'string') {
				const box = msgdata.startsWith('in:') ? callingStreamSheet.inbox : machine.outbox;
				const msgId = msgdata.startsWith('in:') ? msgdata.substr(3) : msgdata.substr(4);
				message = box.peek(msgId);
			} else if (msgdata) {
				message = new Message(msgdata);
			}
		}
		if (!context.initialized) {
			context.initialized = true;
			context.resumeFn = resumeFromExecute(context, callingStreamSheet);
			context.addDisposeListener(cancelExecute(calledStreamSheet));
		}
		if (!sheet.isPaused) {
			// always pause calling sheet, since we do not know how long execute takes (due to pause/sleep functions)
			callingStreamSheet.pauseProcessing();
			calledStreamSheet.execute(context.resumeFn, message, pace, repetitions);
		}

		return true;
	}
	return true;
};
module.exports = execute;
