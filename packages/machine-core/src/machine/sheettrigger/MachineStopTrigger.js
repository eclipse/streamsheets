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
const BaseTrigger = require('./BaseTrigger');
const { TimerMessageLoopCycle } = require('./MessageLoopCycle');
const RepeatedMessageLoopCycle = require('./RepeatedMessageLoopCycle');
const { NoOpCycle, TimerCycle } = require('./cycles');
const TaskQueue = require('../TaskQueue');

const OneTimeMachineCycle = (BaseClass) =>
	class extends RepeatedMessageLoopCycle.withBaseClass(BaseClass) {
		activate() {
			super.activate();
			// finished, so
			this.machine.finishedPending(this.streamsheet);
		}
		schedule() {}
	};
class OnStopMessageLoopCycle extends TimerMessageLoopCycle {
	getCycleTime() {
		return this.machine.cycletime;
	}
}
class OnStopMachineCycle extends OneTimeMachineCycle(TimerCycle) {
	getMessageLoopCycle() {
		return new OnStopMessageLoopCycle(this.trigger, this);
	}
}

class MachineStopTrigger extends BaseTrigger {
	constructor(config = {}) {
		super(Object.assign({}, config, { type: MachineStopTrigger.TYPE }));
		this.activeCycle = new NoOpCycle(this);
	}

	getManualCycle() {
		return new NoOpCycle(this);
	}
	getTimerCycle() {
		return new OnStopMachineCycle(this);
	}

	stop(forced) {
		if (forced) return super.stop(forced);
		this.activeCycle = this.getTimerCycle();
		// note: have to run after all other streamsheets are stopped...
		TaskQueue.schedule(() => this.activeCycle.run());
		return false;
	}
	resume() {}
	start() {}
	step() {}
}
MachineStopTrigger.TYPE = 'stop';

module.exports = MachineStopTrigger;
