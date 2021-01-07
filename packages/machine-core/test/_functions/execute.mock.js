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
const execute = (sheet, ...terms) => {
	const cancelExecute = (calledStreamSheet) => (context) => {
		calledStreamSheet.cancelExecute();
		context.resumeFn();
	};
	const resume = (context, calledStreamSheet, callingStreamSheet) => (retval /*, message */) => {
		if (context.repetitions < 1) {
			context.term.cell.value = retval != null ? retval : true;
			context.isResumed = true;
			callingStreamSheet.resumeProcessing(retval);
		} else {
			context.doExecute(context /* , message */);
		}
	};
	const doExecute = (calledStreamSheet /* , message */) => (context, message) => {
		context.repetitions -= 1;
		calledStreamSheet.stats.executesteps += 1;
		calledStreamSheet.execute(message, undefined, context.resumeFn);
	};

	if (sheet.isProcessing) {
		let message;
		const machine = sheet.machine;
		const context = execute.context;
		const callingStreamSheet = sheet.streamsheet;
		const calledStreamSheet = machine.getStreamSheetByName(terms[0].value);
		const repetitions = terms[1] ? terms[1].value : 1;
		if (terms[2]) {
			const msgstr = terms[2].value;
			const box = msgstr.startsWith('in:') ? callingStreamSheet.inbox : machine.outbox;
			const msgId = msgstr.startsWith('in:') ? msgstr.substr(3) : msgstr.substr(4);
			message = box.peek(msgId);
		}
		if (!context.initialized) {
			context.initialized = true;
			context.resumeFn = resume(context, calledStreamSheet, callingStreamSheet);
			context.addDisposeListener(cancelExecute(calledStreamSheet));
		}
		if (!sheet.isPaused) {
			// always pause calling sheet, since we do not know how long execute takes (due to pause/sleep functions)
			callingStreamSheet.pauseProcessing();
			context.isResumed = false;
			context.repetitions = Math.max(1, repetitions);
			context.doExecute = doExecute(calledStreamSheet); // , message);
			calledStreamSheet.stats.executesteps = 0;
			// pass message only at beginning:
			context.doExecute(context, message);
		}
		return true;
	}
	return true;
};
module.exports = execute;
