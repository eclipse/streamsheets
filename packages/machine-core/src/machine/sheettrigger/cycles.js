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

	get machine() {
		return this.trigger.machine;
	}

	get sheet() {
		return this.trigger.sheet;
	}

	get streamsheet() {
		return this.trigger.streamsheet;
	}

	activate() {
		this.trigger.activeCycle = this;
	}

	clear() {}

	run() {
		this.schedule();
		this.step();
	}

	resume(retval) {
		if (!this.trigger.isMachineStopped) this.schedule();
		// mark sheet as resumed
		this.sheet._resumeProcessing(retval);
		// finish current step, if we currently don't process...
		// if (!this.trigger.sheet.isProcessing && this.trigger.sheet.isNotFullyProcessed)
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
	TimerCycle,
	TriggerCycle
};
