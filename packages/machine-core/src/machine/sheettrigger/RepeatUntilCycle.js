/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { ManualCycle, TimerCycle } = require('./cycles');

const RepeatUntilCycle = (BaseCycle) =>
	class extends BaseCycle {
		getCycleTime() {
			return 1;
		}
		step() {
			if (!this.sheet.isPaused && this.sheet.isProcessed) {
				this.streamsheet.stats.repeatsteps += 1;
			}
			this.trigger.processSheet();
		}
	};

class TimerRepeatUntilCycle extends RepeatUntilCycle(TimerCycle) {}
class ManualRepeatUntilCycle extends RepeatUntilCycle(ManualCycle) {}

module.exports = {
	ManualRepeatUntilCycle,
	TimerRepeatUntilCycle,
	withBaseClass: (BaseCycle) => RepeatUntilCycle(BaseCycle)
}