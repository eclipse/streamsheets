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
const { FunctionErrors, ErrorInfo } = require('@cedalo/error-codes');
const { runFunction } = require('../../utils');
const {
	sheet: { createMessageFromTerm, getMachine, getStreamSheetByName }
} = require('../../utils');

const ERROR = FunctionErrors.code;

const errorHint = (sheetname) => `EXECUTE ${sheetname}`;

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
const cancelExecute = (context) => {
	context.calledStreamSheet.cancelExecute();
	context.callingStreamSheet.stopProcessing();
};
const resumeExecute = (context) => (retval) => {
	// remove this
	context.isResumed = true;
	context.returnValue = getCellValue(retval, context.term.cell.value, context.calledStreamSheet);
	// set it directly to cell:
	context.term.cell.value = context.returnValue;
	context.callingStreamSheet.resumeProcessing(retval);
};

const execute = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((sheetname) => convert.toString(sheetname.value))
		.mapNextArg((repetitions) => (repetitions ? convert.toNumber(repetitions.value, 1) : 1))
		.mapNextArg((message) => (message ? createExecuteMessage(message, sheet) : undefined))
		.mapNextArg((speed) => (speed ? convert.toNumber(speed.value) : undefined))
		.run((sheetname, repetitions, message, speed) => {
			const calledStreamSheet = getStreamSheetByName(sheetname, sheet);
			if (!calledStreamSheet) return ERROR.NO_STREAMSHEET;
			const context = execute.context;
			const callingStreamSheet = sheet.streamsheet;
			if (!context.isInitialized) {
				context.isInitialized = true;
				context.calledStreamSheet = calledStreamSheet;
				context.callingStreamSheet = callingStreamSheet;
				context.addDisposeListener(cancelExecute);
			}
			if (repetitions > 0 && !sheet.isPaused) {
				callingStreamSheet.pauseProcessing();
				context.isResumed = false;
				if (!calledStreamSheet.execute(Math.max(1, repetitions), message, speed, resumeExecute(context))) {
					return ErrorInfo.create(ERROR.INVALID_PARAM, errorHint(sheetname)).setParamIndex(1);
				}
			}
			// eslint-disable-next-line no-nested-ternary
			return sheet.isPaused
				? ErrorInfo.create(ERROR.WAITING, errorHint(sheetname))
				: context.isResumed
					? context.returnValue
					: getDefaultReturnValue(calledStreamSheet);
		});
execute.displayName = true;

module.exports = execute;
