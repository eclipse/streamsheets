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

const ERROR = FunctionErrors.code;


const createPauseFn = (sheet) => () => {
	if (!sheet.isPaused) sheet.streamsheet.pauseProcessing();
};
const createResumeFn = (sheet) => () => {
	if (sheet.isPaused) sheet.streamsheet.resumeProcessing();
};
const clearResumeTimeout = (context) => {
	if (context.resumeTimeoutId) {
		clearTimeout(context.resumeTimeoutId);
		context.resumeTimeoutId = undefined;
	}
};
const resume = (context) => {
	clearResumeTimeout(context);
	context.resumeFn();
};
const pause = (context, ms) => {
	clearResumeTimeout(context);
	context.pauseFn();
	context.period = ms;
	context.resumeTimeoutId = setTimeout(() => resume(context), ms);
};
const cancel = (sheet) => (context) => {
	clearResumeTimeout(context);
	sheet.streamsheet.stopProcessing();
};
const doSleep = (context, seconds, isPaused) => {
	const ms = seconds * 1000;
	if (ms < 1) {
		resume(context);
	} else if (context.hasCell) {
		if (!context.resumeTimeoutId || ms !== context.period || !isPaused) {
			pause(context, ms);
		}
	} else {
		// triggered outside of sheet, e.g. by button press. so create new timeout
		pause(context, ms);
	}
	return true;
};
const initContext = (context, sheet) => {
	if (!context.initialized) {
		context.initialized = true;
		context.pauseFn = createPauseFn(sheet);
		context.resumeFn = createResumeFn(sheet);
		// flag to handle usage in cell.
		context.hasCell = !!context.term.cell;
		context.addDisposeListener(cancel(sheet));
	}
};
const sleep = (sheet, ...terms) =>
	runFunction(sheet, terms, sleep)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((seconds) => convert.toNumberStrict(seconds.value, ERROR.VALUE))
		.beforeRun(() => initContext(sleep.context, sheet))
		.run((seconds) => doSleep(sleep.context, seconds, sheet.isPaused));
sleep.displayName = true;

module.exports = sleep;
