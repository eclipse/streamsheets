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

const pause = (sheet) => {
	if (!sheet.isPaused) sheet.pauseProcessing();
	return true;
};
const resume = (sheet) => {
	if (sheet.isPaused) sheet.resumeProcessing();
	return true;
};

const doResume = (context, seconds) => {
	const now = Date.now();
	const ms = seconds * 1000;
	if (!context._lastSleep) context._lastSleep = now;
	const resumeSleep = ms < 1 || now - context._lastSleep > ms;
	if (resumeSleep) context._lastSleep = undefined;
	return resumeSleep;
};

const initContext = (sheet, context) => {
	if (!context._sleepInited) {
		context._sleepInited = true;
		context.addDisposeListener(() => resume(sheet));
	}
};

const sleep = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((seconds) => convert.toNumberStrict(seconds.value, ERROR.VALUE))
		.beforeRun(() => initContext(sheet, sleep.context))
		.run((seconds) => doResume(sleep.context, seconds) ? resume(sheet) : pause(sheet));
sleep.displayName = true;

module.exports = sleep;
