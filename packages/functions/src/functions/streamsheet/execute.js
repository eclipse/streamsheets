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
const { sheet: { createMessageFromTerm, getMachine, getStreamSheetByName } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const markAs = (term, marker) => {
	if (term) term._marker = marker;
};
// const isMarkedAs = (term, marker) => term && term._marker === marker;
const isMarkedAs = (term, ...markers) => term && markers.some(marker => term._marker === marker);

const returnValue = term => (term ? term._retval : null);
const setReturnValue = (term, value) => {
	if (term) term._retval = value;
};

const repeatCount = term => (term && term._repeatcount ? term._repeatcount : 0);
const setRepeatCount = (term, counter) => {
	const doIt = term && term._repeatcount !== counter;
	if (doIt) term._repeatcount = counter;
	return doIt;
};

const setDisposeHandler = (term, callingStreamSheet, calledStreamSheet) => {
	if (term) {
		term.dispose = () => {
			calledStreamSheet.machine.off('didStop', term._onDidStop);
			calledStreamSheet.executeCallback = undefined;
			callingStreamSheet.resumeProcessing();
			const proto = Object.getPrototypeOf(term);
			if (proto) proto.dispose.call(term);
		};
	}
};

// our execute callback, which is called by streamsheet if repeated execution finished...
const setOnExecuted = (term, streamsheet) => {
	if (term && !term._onExecuted) {
		term._onExecuted = (retval, calledStreamSheet) => {
			setReturnValue(term, retval);
			// DL-1114 decrease repeat count only if message is processed
			const decr = calledStreamSheet.isMessageProcessed() ? 1 : 0;
			const count = repeatCount(term) - decr;
			if (count > 0) {
				markAs(term, 'repeat');
				setRepeatCount(term, count);
			} else {
				markAs(term, 'resumed');
				streamsheet.resumeProcessing();
			}
		};
	}
};
const onExecuted = term => (term ? term._onExecuted : undefined);

// const registerOnStep = (term, callingStreamSheet, calledStreamSheet) => {
// 	if (term && !term._onStep) {
// 		term._onStep = (prefx, tr, retval) => {
// 			setReturnValue(term, retval);
// 			const count = repeatCount(term) - 1;
// 			if (count > 0) {
// 				markAs(term, 'repeat');
// 				setRepeatCount(term, count);
// 			} else {
// 				markAs(term, 'resumed');
// 				callingStreamSheet.resumeProcessing();
// 			}
// 		};
// 		calledStreamSheet.on('step', term._onStep);
// 	}
// };

const registerOnDidStop = (term, streamsheet) => {
	if (term && !term._onDidStop) {
		term._onDidStop = () => {
			setReturnValue(term, true);
			markAs(term, null);
		};
		streamsheet.machine.on('didStop', term._onDidStop);
	}
};

const createExecuteMessage = (term, sheet) => {
	const machine = getMachine(sheet);
	const message = createMessageFromTerm(term, machine);
	if (message) {
		message.metadata = message.metadata || {};
		message.metadata.source = sheet.streamsheet.name;
		message.metadata.trigger = 'EXECUTE';
	}
	return message;
};

const execute = (sheet, ...terms) => {
	let error = !sheet || terms.length < 1 ? ERROR.ARGS : undefined;
	if (!error && sheet.isProcessing) {
		const repeat = terms.length > 1 ? convert.toNumber(terms[1].value, 1) : 1;
		const selector = terms[3] ? terms[3].value : undefined;
		const streamsheet = getStreamSheetByName(terms[0].value, sheet);
		error = FunctionErrors.ifTrue((!streamsheet || streamsheet === sheet.streamsheet), ERROR.NO_STREAMSHEET);
		if (!error && repeat > 0) {
			let result = true;
			const executeTerm = execute.term;
			// DL-1075 & DL-1114: we pass a message to execute function & only if current message is processed!!
			let message;
			if (streamsheet.isMessageProcessed()) {
				// eslint-disable-next-line no-nested-ternary
				message = terms[2]
					? createExecuteMessage(terms[2], sheet)
					: streamsheet.trigger.isEndless ? streamsheet.getMessage() : undefined;
			}
			if (!isMarkedAs(executeTerm, 'pending', 'repeat', 'resumed')) {
				markAs(executeTerm, 'repeat');
				setRepeatCount(executeTerm, repeat);
				setDisposeHandler(executeTerm, sheet.streamsheet, streamsheet);
				setOnExecuted(executeTerm, sheet.streamsheet, streamsheet);
				registerOnDidStop(executeTerm, sheet.streamsheet);
				streamsheet.stats.executesteps = 0;
				sheet.streamsheet.repeatProcessing();
			}
			if (isMarkedAs(executeTerm, 'repeat', 'pending')) {
				markAs(executeTerm, 'pending');
				// eslint-disable-next-line
				streamsheet.stats.executesteps = repeat - repeatCount(executeTerm) + 1;
				// DL-1114 increase executestep only if current message is finished (loop) and streamsheet is not waiting
				result = streamsheet.execute({ message, selector }, onExecuted(executeTerm));
				// changed docu: should return NA in endless mode and successful trigger
				result = result && streamsheet.trigger.isEndless ? ERROR.NA : result;
			}
			if (isMarkedAs(executeTerm, 'resumed')) {
				let retval = returnValue(executeTerm);
				markAs(executeTerm, null);
				setReturnValue(executeTerm, null);
				// DL-1281: conform to docu....
				if (retval == null) {
					retval = streamsheet.trigger.isEndless ? ERROR.NA : !streamsheet.inbox.isEmpty();
				}
				result = retval; // != null ? retval : true;
			}
			return result;
		}
		return false;  // repeat < 1 => signal no execute...
	}
	return error || true; // not processing, so its ok...
};
execute.displayName = true;

module.exports = execute;
