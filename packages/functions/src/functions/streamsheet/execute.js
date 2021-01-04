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
const {	runFunction } = require('../../utils');
const { sheet: { createMessageFromTerm, getMachine, getStreamSheetByName } } = require('../../utils');

const ERROR = FunctionErrors.code;

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

const getDefaultReturnValue = (calledStreamSheet) =>
	calledStreamSheet.trigger.isEndless ? true : !calledStreamSheet.inbox.isEmpty();
const getCellValue = (newValue, oldValue, calledStreamSheet) => {
	if (newValue != null) return newValue;
	if (oldValue != null && oldValue !== true) return oldValue;
	return getDefaultReturnValue(calledStreamSheet);
};
const cancelExecute = (calledStreamSheet) => (context) => {
	calledStreamSheet.cancelExecute();
	context.repetitions = -1;
	context.resumeFn();
};
const resume = (callingStreamSheet, calledStreamSheet, context) => (retval) => {
	if (context.repetitions < 1) {
		context.isResumed = true;
		context.returnValue = getCellValue(retval, context.term.cell.value, calledStreamSheet);;
		// we set it directly too:
		context.term.cell.value = context.returnValue;
		if (context.repetitions < 0) callingStreamSheet.stopProcessing();
		else if (calledStreamSheet.trigger.isEndless) callingStreamSheet.resumeProcessing(true, retval);
	} else {
		context.doExecute(context);
	}
};
const doExecute = (calledStreamSheet, selector /* , message */) => (context, message) => {
	context.repetitions -= 1;
	calledStreamSheet.stats.executesteps += 1;
	calledStreamSheet.execute(message, selector, context.resumeFn);
};

const initContext = (context, callingStreamSheet, calledStreamSheet) => {
	context.isInitialized = true;
	context.resumeFn = resume(callingStreamSheet, calledStreamSheet, context);
	context.addDisposeListener(cancelExecute(calledStreamSheet));
};

const execute = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((sheetname) => convert.toString(sheetname.value))
		.mapNextArg((repetitions) => repetitions ? convert.toNumber(repetitions.value, 1) : 1)
		.mapNextArg((message) => message ? createExecuteMessage(message, sheet) : undefined)
		.mapNextArg((selector) => selector ? selector.value : undefined)
		.run((sheetname, repetitions, message, selector) => {
			const calledStreamSheet = getStreamSheetByName(sheetname, sheet);
			if (!calledStreamSheet) return ERROR.NO_STREAMSHEET;
			const context = execute.context;
			const callingStreamSheet = sheet.streamsheet;
			if (!context.isInitialized) initContext(context, callingStreamSheet, calledStreamSheet);
			if (!sheet.isPaused) {
				if (calledStreamSheet.trigger.isEndless) callingStreamSheet.pauseProcessing();
				context.isResumed = false;
				context.repetitions = repetitions;
				context.doExecute = doExecute(calledStreamSheet, selector); // , message);
				calledStreamSheet.stats.executesteps = 0;
				// pass message only at beginning:
				if (repetitions > 0) context.doExecute(context, message);
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
