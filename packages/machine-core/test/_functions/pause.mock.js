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

const clearPauseTimeout = (context) => {
	if (context.timeoutId) {
		clearTimeout(context.timeoutId);
		context.timeoutId = undefined;
	}
};

const resume = (sheet, context) => () => {
	clearPauseTimeout(context);
	if (sheet.isPaused) {
		context.resumeCounter += 1;
		sheet.streamsheet.resumeProcessing();
	}
};

const pause = (sheet, ...terms) => {
	if (sheet.isProcessing) {
		const context = pause.context;
		const period = terms[0] && terms[0].value ? terms[0].value * 1000 : 0;
		if (!context.initialized) {
			context.initialized = true;
			context.pauseCounter = 0;
			context.resumeCounter = 0;
			context.addDisposeListener(resume(sheet, context));
		}
		if (!sheet.isPaused) {
			clearPauseTimeout(context);
			if (period > 0) context.timeoutId = setTimeout(resume(sheet, context), period);
			context.pauseCounter += 1;
			sheet.streamsheet.pauseProcessing();
		}
	}
	return true;
};
module.exports = pause;
