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

const ERROR = FunctionErrors.code;


const createPauseFn = (sheet) => () => {
	if (!sheet.isPaused) sheet.pauseProcessing();
};
const createResumeFn = (sheet) => () => {
	if (sheet.isPaused) sheet.resumeProcessing();
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
	context.resumed = true;
};
const pause = (context, ms) => {
	clearResumeTimeout(context);
	context.pauseFn();
	context.period = ms;
	context.resumed = false;
	context.resumeTimeoutId = setTimeout(() => resume(context), ms);
};
const doSleep = (context, seconds) => {
	const ms = seconds * 1000;
	if (ms < 1) {
		resume(context);
		context.resumed = false;
	} else if (context.hasCell) {
		if (!context.resumeTimeoutId || ms !== context.period) {
			if (!context.resumed) pause(context, ms);
			else context.resumed = false;
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
		// flags to handle usage in cell.
		context.hasCell = !!context.term.cell;
		context.resumed = false; // pause again in next step, not directly! 
		context.addDisposeListener((ctxt) => resume(ctxt));
	}
};
const sleep = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((seconds) => convert.toNumberStrict(seconds.value, ERROR.VALUE))
		.beforeRun(() => initContext(sleep.context, sheet))
		.run((seconds) => doSleep(sleep.context, seconds));
sleep.displayName = true;

module.exports = sleep;
