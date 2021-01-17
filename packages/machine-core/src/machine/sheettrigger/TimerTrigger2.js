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

const UNITS = {};
UNITS.ms = 1;
UNITS.s = 1000 * UNITS.ms;
UNITS.m = 60 * UNITS.s;
UNITS.h = 60 * UNITS.m;
UNITS.d = 24 * UNITS.h;

const TYPE = {
	RANDOM: 'random',
	TIME: 'time'
};

const parseTime = (time) => {
	const ms = Date.parse(time);
	return ms == null || isNaN(ms) ? null : ms;
};

const random = (nr) => Math.floor(Math.random() * Math.floor(nr));

const getStartInterval = (time) => {
	const now = Date.now();
	const ms = parseTime(time) || now;
	return ms > now ? ms - now : 1;
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
class TimeIntervalCycle extends TimerCycle {
	constructor(trigger, delay) {
		super(trigger);
		this.delay = delay;
	}
	start() {
		if (this.delay) {
			this.id = setTimeout(this.run, this.delay);
		} else {
			super.start();
		}
	}

	getCycleTime() {
		return this.trigger.interval * UNITS[this.trigger.intervalUnit];
	}

	onTrigger() {
		this.trigger.streamsheet.stats.steps += 1;
		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new RepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else {
			this.trigger.streamsheet.triggerStep();
		}
	}
}
class RandomIntervalCycle extends TimeIntervalCycle {
	getCycleTime() {
		const interval = random(2 * this.trigger.interval);
		return interval * UNITS[this.trigger.intervalUnit];
	}
}
class RepeatUntilManualCycle extends ManualCycle {
	onTrigger() {
		if (!this.trigger.sheet.isPaused) {
			this.trigger.streamsheet.stats.repeatsteps += 1;
			this.trigger.streamsheet.triggerStep();
		}
	}
}
class ManualStepCycle extends ManualCycle {
	step() {
		this.trigger.streamsheet.stats.steps += 1;
		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new RepeatUntilManualCycle(this.trigger, this);
			this.trigger.activeCycle.step();
		} else {
			this.trigger.streamsheet.triggerStep();
		}
	}
}


const TIMER_DEF = {
	interval: 500,
	intervalUnit: 'ms'
};


class TimerTrigger2 extends BaseTrigger2 {
	constructor(config = {}) {
		super(Object.assign({}, TIMER_DEF, config));
		this._activeCycle = new ManualStepCycle(this);
	}

	get interval() {
		return this.config.interval;
	}
	get intervalUnit() {
		return this.config.intervalUnit;
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
	get isMachineStopped() {
		const machine = this.streamsheet.machine;
		return machine == null || !machine.isRunning;
	}

	dispose() {
		this.activeCycle.dispose();
		super.dispose();
	}

	update(config = {}) {
		Object.assign(this.config, config);
		this.activeCycle.clear();
		if (!this.sheet.isPaused) {
			if (!this.sheet.isProcessed) this.streamsheet.triggerStep();
			if (!this.isMachineStopped && !this.activeCycle.isManual) {
				this.activeCycle = this.getIntervalCycle();
				this.activeCycle.start();
			}
		}
	}

	// MACHINE CONTROL METHODS
	updateCycle() {
		// TODO: not required anymore!! or is it?
	}

	pause() {
		// do not pause sheet! its done by functions only...
		this.activeCycle.pause();
	}

	resume() {
		// if we are not still paused by a function...
		if (!this.sheet.isPaused) {
			if (this.activeCycle.isManual) {
				this.activeCycle = this.getIntervalCycle();
				this.activeCycle.pause();
			}
			this.activeCycle.resume();
			// maybe we have to finish step, if it was resumed during machine pause
			if (!this.sheet.isProcessed) this.streamsheet.triggerStep();
		}
	}

	start() {
		const delay = this.config.start ? getStartInterval(this.config.start) : undefined;
		this.activeCycle = this.getIntervalCycle(delay);
		this.activeCycle.start();
	}

	stop() {
		this.stopProcessing();
		return true;
	}

	step(manual) {
		if (manual) {
			if (!this.activeCycle.isManual) this.activeCycle = new ManualStepCycle(this);
			this.activeCycle.step();
		}
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

	getIntervalCycle(delay) {
		return this.type === TYPE.TIME ? new TimeIntervalCycle(this, delay) : new RandomIntervalCycle(this, delay);
	}
}
TimerTrigger2.TYPE_RANDOM = TYPE.RANDOM;
TimerTrigger2.TYPE_TIME = TYPE.TIME;

module.exports = TimerTrigger2;
