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
const pause = (sheet /* , ...terms */) => {
	if (sheet.isProcessing) {
		const context = pause.context;
		if (!context.initialized) {
			context.initialized = true;
			context.addDisposeListener(() => {
				if (sheet.isPaused) sheet.streamsheet.resumeProcessing();
			});
		}
		if (!sheet.isPaused) sheet.streamsheet.pauseProcessing();
	}
	return true;
};
module.exports = pause;
