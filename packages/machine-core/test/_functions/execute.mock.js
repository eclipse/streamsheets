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
	}

	const doExecute = (calledStreamSheet, pace) => (context) => {
		const message = context.msgdata ? new Message(context.msgdata) : context.message;
		calledStreamSheet.execute(context.resumeFn, message, pace, context.repetitions);
	};

	if (sheet.isProcessing) {
		const machine = sheet.machine;
		const context = execute.context;
		const callingStreamSheet = sheet.streamsheet;
		const calledStreamSheet = machine.getStreamSheetByName(terms[0].value);
		const repetitions = terms[1] ? terms[1].value : 1;
		const pace = terms[3] != null ? !!terms[3].value : null;
		if (terms[2]) {
			const msgdata = terms[2].value;
			if (typeof msgdata === 'string') {
				const box = msgdata.startsWith('in:') ? callingStreamSheet.inbox : machine.outbox;
				const msgId = msgdata.startsWith('in:') ? msgdata.substr(3) : msgdata.substr(4);
				context.message = box.peek(msgId);
			} else {
				context.msgdata = msgdata;
			}
		}
		if (!context.initialized) {
			context.initialized = true;
			context.repetitions = Math.max(1, repetitions);
			context.resumeFn = resumeFromExecute(context, callingStreamSheet);
			context.repeatExecute = doExecute(calledStreamSheet, pace);
			context.addDisposeListener(cancelExecute(calledStreamSheet));
		}
		if (!sheet.isPaused) {
			// always pause calling sheet, since we do not know how long execute takes (due to pause/sleep functions)
			callingStreamSheet.pauseProcessing();
			context.repeatExecute(context);
		}
		

		return true;
	}
	return true;
};
module.exports = execute;
