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
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { runFunction } = require('../../utils');
const {
	sheet: { createMessageFromTerm, getMachine, getStreamSheetByName }
} = require('../../utils');

const ERROR = FunctionErrors.code;

const createExecuteMessage = (term, sheet) => {
	const machine = getMachine(sheet);
	const message = createMessageFromTerm(term, machine);
	if (message && !FunctionErrors.isError(message)) {
		message.metadata = message.metadata || {};
		message.metadata.source = sheet.streamsheet.name;
		message.metadata.trigger = 'EXECUTE';
	}
	return message;
};

const getDefaultReturnValue = (calledStreamSheet) =>
	calledStreamSheet.trigger.isEndless ? true : !calledStreamSheet.inbox.isEmpty();
const getCellValue = (newValue, oldValue, calledStreamSheet) => {
	if (newValue != null) return newValue;
	if (oldValue != null && oldValue !== true && !FunctionErrors.isError(oldValue)) return oldValue;
	return getDefaultReturnValue(calledStreamSheet);
};
const cancelExecute = (calledStreamSheet) => (context) => {
	calledStreamSheet.cancelExecute();
	context.resumeExecute();
};
const doResume = (context, callingStreamSheet, calledStreamSheet) => (retval) => {
	// remove this
	context.isResumed = true;
	context.returnValue = getCellValue(retval, context.term.cell.value, calledStreamSheet);
	// set it directly to cell:
	context.term.cell.value = context.returnValue;
	callingStreamSheet.resumeProcessing(retval);
};

const execute = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((sheetname) => convert.toString(sheetname.value))
		.mapNextArg((repetitions) => (repetitions ? convert.toNumber(repetitions.value, 1) : 1))
		.mapNextArg((message) => (message ? createExecuteMessage(message, sheet) : undefined))
		.mapNextArg((pace) => (pace ? convert.toBoolean(pace.value) : undefined))
		.run((sheetname, repetitions, message, pace) => {
			const calledStreamSheet = getStreamSheetByName(sheetname, sheet);
			if (!calledStreamSheet) return ERROR.NO_STREAMSHEET;
			const context = execute.context;
			const callingStreamSheet = sheet.streamsheet;
			if (!context.isInitialized) {
				context.isInitialized = true;
				context.resumeExecute = doResume(context, callingStreamSheet, calledStreamSheet);
				context.addDisposeListener(cancelExecute(calledStreamSheet));
			}
			if (repetitions > 0 && !sheet.isPaused) {
				callingStreamSheet.pauseProcessing();
				context.isResumed = false;
				calledStreamSheet.execute(Math.max(1, repetitions), message, pace, context.resumeExecute);
			}
			// eslint-disable-next-line no-nested-ternary
			return sheet.isPaused
				? ERROR.NA
				: context.isResumed
				? context.returnValue
				: getDefaultReturnValue(calledStreamSheet);
		});
execute.displayName = true;

module.exports = execute;
