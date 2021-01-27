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
class TriggerCycle {
	constructor(trigger, parent) {
		this.trigger = trigger;
		this.parentcycle = parent;
	}

	get isManual() {
		return false;
	}

	activate() {
		this.trigger.activeCycle = this;
	}

	clear() {}

	run() {
		this.schedule();
		this.step();
	}

	resume() {
		this.schedule();
		// finish current step
		if (this.trigger.sheet.isNotFullyProcessed) this.trigger.processSheet();
	}

	schedule() {}

	step() {}

	stop() {
		this.clear();
		if (this.parentcycle) this.parentcycle.activate();
	}
}

class TimerCycle extends TriggerCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.id = undefined;
		this.run = this.run.bind(this);
	}

	clear() {
		const clearIt = this.id != null;
		if (clearIt) {
			clearTimeout(this.id);
			this.id = undefined;
		}
		return clearIt;
	}

	schedule() {
		this.clear();
		this.id = setTimeout(this.run, this.getCycleTime());
	}

	step() {
		this.trigger.processSheet();
	}

	getCycleTime() {
		return 100;
	}
}

class ManualCycle extends TriggerCycle {
	get isManual() {
		return true;
	}

	run() {
		this.step();
	}
}

class RepeatUntilCycle extends TimerCycle {
	getCycleTime() {
		return 1;
	}

	step() {
		this.trigger.streamsheet.stats.repeatsteps += 1;
		this.trigger.processSheet();
	}
}

class ManualRepeatUntilCycle extends ManualCycle {
	step() {
		// in manual we count steps even in endless mode?
		// this.trigger.streamsheet.stats.steps += 1;
		this.trigger.streamsheet.stats.repeatsteps += 1;
		this.trigger.processSheet();
	}
}

class NoOpCycle extends TriggerCycle {
	constructor(trigger, manual) {
		super(trigger);
		this._isManual = !!manual;
	}
	get isManual() {
		return this._isManual;
	}
}

module.exports = {
	ManualCycle,
	NoOpCycle,
	RepeatUntilCycle,
	ManualRepeatUntilCycle,
	TimerCycle,
	TriggerCycle
};
