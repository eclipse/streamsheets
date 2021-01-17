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
const BaseTrigger2 = require('./BaseTrigger2');
const { ManualCycle, TimerCycle } = require('./cycles');


const TYPE = {
	START: 'start',
	STOP: 'stop'
};

const preventStop = (doIt, streamsheet) => {
	const machine = streamsheet && streamsheet.machine;
	if (machine) machine.preventStop = doIt;
};

class RepeatUntilCycle extends TimerCycle {

	getCycleTime() {
		return 1;
	}

	onTrigger() {
		this.trigger.streamsheet.stats.repeatsteps += 1;
		this.trigger.streamsheet.triggerStep();	
	}
}
class RepeatUntilOnStopCycle extends RepeatUntilCycle {
	get isRepeatOnStop() {
		return true;
	}

	onTrigger() {
		super.onTrigger();
		preventStop(true, this.trigger.streamsheet);
	}
	// clear() {
	// 	super.clear();
	// 	// preventStop(false, this.trigger.streamsheet);
	// }
}
class MachineCycle extends TimerCycle {
	constructor(trigger) {
		super(trigger);
		this.hasStepped = false;
	}

	start() {
		this.step();
	}

	step() {
		if (this.trigger.isEndless) {
			preventStop(true, this.trigger.streamsheet);
			this.trigger.streamsheet.stats.steps += 1;
			this.trigger.activeCycle =
			this.trigger.type === TYPE.STOP
			? new RepeatUntilOnStopCycle(this.trigger, this)
			: new RepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else if (!this.hasStepped) {
			this.hasStepped = true;
			this.trigger.streamsheet.stats.steps += 1;
			this.trigger.streamsheet.triggerStep();
		}
	}
}
class RepeatUntilManualCycle extends ManualCycle {
	step() {
		if (!this.trigger.sheet.isPaused) {
			this.trigger.streamsheet.stats.repeatsteps += 1;
			this.trigger.streamsheet.triggerStep();
		}
	}
}
class StepManualCycle extends ManualCycle {
	step() {
		// no manual step on STOP trigger:
		if(this.trigger.type === TYPE.START) {
			this.trigger.streamsheet.stats.steps += 1;
			if (this.trigger.isEndless) {
				this.trigger.activeCycle = new RepeatUntilManualCycle(this.trigger, this);
				this.trigger.activeCycle.step();
			} else {
				this.trigger.streamsheet.triggerStep();
			}
		}
	}
}

class MachineTrigger2 extends BaseTrigger2 {
	constructor(config = {}) {
		super(config);
		this.hasStopped = false;
		this._activeCycle = new StepManualCycle(this);
	}

	get activeCycle() {
		return this._activeCycle;
	}
	set activeCycle(cycle) {
		this._activeCycle.clear();
		// TODO: dispose activeCycle?
		// this._activeCycle.dispose();
		this._activeCycle = cycle;
	}

	get streamsheet() {
		return super.streamsheet;
	}

	set streamsheet(streamsheet) {
		super.streamsheet = streamsheet;
		// switch to MachineCycle if machine runs already:
		if (streamsheet.machine && streamsheet.machine.isRunning && this.type === TYPE.START) {
			this.activeCycle = new MachineCycle(this);
		}
	}

	get isMachineStopped() {
		const machine = this.streamsheet.machine;
		return machine == null || !machine.isRunning;
	}

	dispose() {
		this.activeCycle.dispose();
		super.dispose();
	}

	update(config = {}) {
		this.config = Object.assign(this.config, config);
		this.activeCycle.clear();
		if (!this.sheet.isPaused) {
			if (!this.sheet.isProcessed) this.streamsheet.triggerStep();
			if (!this.isMachineStopped && this.isEndless) {
				// TODO: REVIEW -> have to pass parent cycle!!
				this.activeCycle = new RepeatUntilCycle(this);
				this.activeCycle.start();
			}
		}
	}

	// MACHINE CONTROL METHODS
	updateCycle() {
		// TODO: not required anymore!! or is it?
	}

	pause() {
		this.hasStopped = false;
		// do not pause sheet! its done by functions only...
		this.activeCycle.pause();
	}

	resume() {
		this.hasStopped = false;
		// if we are not still paused by a function...
		if (!this.sheet.isPaused) {
			if (this.activeCycle.isManual) {
				// this.activeCycle = new ContinuousCycle(this);
				this.activeCycle = new StepManualCycle(this);
				this.activeCycle.pause();
			}
			this.activeCycle.resume();
			// maybe we have to finish step, if it was resumed during machine pause
			if (!this.sheet.isProcessed) this.streamsheet.triggerStep();
		}
	}

	start() {
		this.hasStopped = false;
		if (this.type === TYPE.START) {
			this.activeCycle = new MachineCycle(this);
		}
	}

	stop() {
		if (this.type === TYPE.STOP && this.activeCycle.isManual) {
			this.hasStopped = true;
			this.activeCycle = new MachineCycle(this);
			if (this.isEndless) {
				return false;
			}
			this.activeCycle.start();
		}
		this.stopProcessing();
		return true;
	}

	step(manual) {
		if (manual) {
			if (!this.activeCycle.isManual) this.activeCycle = new StepManualCycle(this);
			this.activeCycle.step();
		} else if (!this.activeCycle.isManual) {
			this.activeCycle.step();
			preventStop(this.activeCycle.isRepeatOnStop, this.streamsheet);
		}
		// if (manual && !this.activeCycle.isManual) this.activeCycle = new StepManualCycle(this);
		// else if (!manual && this.activeCycle.isManual) this.activeCycle = new MachineCycle(this);
	}
	// ~

	// SHEET CONTROL METHODS
	pauseProcessing() {
		this.activeCycle.pause();
		this.sheet._pauseProcessing();
	}
	resumeProcessing(retval) {
		// mark sheet as resumed
		this.sheet._resumeProcessing(retval);
		// finish current step
		if (!this.sheet.isProcessed && (this.activeCycle.isManual || !this.isMachineStopped))
			this.streamsheet.triggerStep();
		// resume cycle if machine runs
		if (!this.isMachineStopped) this.activeCycle.resume();
	}
	stopProcessing(retval) {
		this.activeCycle.stop();
		// TODO: review
		// if (!this.activeCycle.isActive) {
		// 	this.activeCycle.dispose();
		// 	this.activeCycle = new ManualCycle(this);
		// }
		this.sheet._stopProcessing(retval);
	}
	// ~
}

MachineTrigger2.TYPE_START = TYPE.START;
MachineTrigger2.TYPE_STOP = TYPE.STOP;
// MachineTrigger2.TYPE_STARTSTOP = 'startstop';

module.exports = MachineTrigger2;
