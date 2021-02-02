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

const UNITS = {};
UNITS.ms = 1;
UNITS.s = 1000 * UNITS.ms;
UNITS.m = 60 * UNITS.s;
UNITS.h = 60 * UNITS.m;
UNITS.d = 24 * UNITS.h;

class IntervalCycle extends TimerMessageLoopCycle {
	getCycleTime() {
		return this.trigger.interval * UNITS[this.trigger.intervalUnit];
	}
	postProcessSheet() {
		super.postProcessSheet();
		// might stopped, so schedule again:
		if (this.id == null) this.schedule();
	}
}

class RandomIntervalCycle extends IntervalCycle {
	random(nr) {
		Math.floor(Math.random() * Math.floor(nr));
	}
	getCycleTime() {
		const interval = this.random(2 * this.trigger.interval);
		return interval * UNITS[this.trigger.intervalUnit];
	}
}

const TYPE = {
	RANDOM: 'random',
	TIME: 'time'
};

const parseTime = (time) => {
	const ms = Date.parse(time);
	return ms == null || isNaN(ms) ? null : ms;
};
const getStartInterval = (time) => {
	const now = Date.now();
	const ms = parseTime(time) || now;
	return ms > now ? ms - now : 1;
};

const TIMER_DEF = {
	interval: 500,
	intervalUnit: 'ms'
};
class TimerTrigger extends BaseTrigger {
	constructor(config = {}) {
		super(Object.assign({}, TIMER_DEF, config));
		this.delayId = undefined;
		this.activeCycle = new ManualMessageLoopCycle(this);
	}

	get interval() {
		return this.config.interval;
	}
	get intervalUnit() {
		return this.config.intervalUnit;
	}

	clearDelay() {
		if (this.delayId) {
			clearTimeout(this.delayId);
			this.delayId = undefined;
		}
	}

	update(config = {}) {
		const oldInterval = this.interval;
		const oldIntervalUnit = this.intervalUnit;
		super.update(config);
		if (oldInterval !== this.interval || oldIntervalUnit !== this.intervalUnit) {
			this.activeCycle.clear();
			if (!this.isMachineStopped && !this.sheet.isPaused) this.activeCycle.schedule();
		}
	}

	getManualCycle() {
		return new ManualMessageLoopCycle(this);
	}

	getTimerCycle() {
		return this.type === TYPE.TIME ? new IntervalCycle(this) : new RandomIntervalCycle(this);
	}

	pause() {
		this.clearDelay();
		super.pause();
	}

	start() {
		super.start();
		const delay = this.config.start ? getStartInterval(this.config.start) : undefined;
		// we run directly or after a specified delay...
		if (delay) this.delayId = setTimeout(this.activeCycle.run, delay);
		else this.activeCycle.run();
	}

	step(manual) {
		// only handle manual steps
		if (manual) super.step(manual);
	}

	stop() {
		this.clearDelay();
		return super.stop();
	}
}

TimerTrigger.TYPE_RANDOM = TYPE.RANDOM;
TimerTrigger.TYPE_TIME = TYPE.TIME;

module.exports = TimerTrigger;
