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
const { ManualMessageLoopCycle, TimerMessageLoopCycle } = require('./MessageLoopCycle');
const RepeatedMessageLoopCycle = require('./RepeatedMessageLoopCycle');
const { TriggerCycle } = require('./cycles');


const once = (fn) => {
	let doIt = true;
	return (/* ...args */) => {
		if (doIt) {
			doIt = false;
			fn();
		}
	};
};

const OneTimeMachineCycle = (BaseClass) =>
	class extends RepeatedMessageLoopCycle.withBaseClass(BaseClass) {
		constructor(trigger) {
			super(trigger);
			// called by machine cycle, so ensure only triggered once
			this.step = once(this.step.bind(this));
		}
	};

class OnStartMessageLoopCycle extends TimerMessageLoopCycle {
	schedule() {}
}
class OnStartMachineCycle extends OneTimeMachineCycle(TriggerCycle) {
	getMessageLoopCycle() {
		return new OnStartMessageLoopCycle(this.trigger, this);
	}
}
	
class MachineTrigger extends BaseTrigger {
	constructor(config = {}) {
		super(config);
		this.activeCycle = this.getManualCycle();
	}

	getManualCycle() {
		return new ManualMessageLoopCycle(this);
	}

	getTimerCycle() {
		return new OnStartMachineCycle(this);
	}
	start() {
		this.activeCycle = this.getTimerCycle();
	}
}
MachineTrigger.TYPE = 'start';


module.exports = MachineTrigger;
