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
const AbstractTrigger = require('./AbstractTrigger');

const UNITS = {};
UNITS.ms = 1;
UNITS.s = 1000 * UNITS.ms;
UNITS.m = 60 * UNITS.s;
UNITS.h = 60 * UNITS.m;
UNITS.d = 24 * UNITS.h;

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
const getInterval = (config) => {
	const interval = config.type === 'random' ? random(2 * config.interval) : config.interval;
	return interval * UNITS[config.intervalUnit];
};
const clearTriggerInterval = (trigger) => {
	if (trigger._intervalId != null) {
		clearInterval(trigger._intervalId);
		trigger._intervalId = undefined;
	}
};
const registerTriggerInterval = (trigger, timeout = 1) => {
	clearTriggerInterval(trigger);
	// setInterval doesn't work well with random, so use setTimeout
	trigger._intervalId = setTimeout(trigger._intervalTrigger, timeout);
};


const TIMER_DEF = {
	interval: 500,
	intervalUnit: 'ms'
};


class TimerTrigger extends AbstractTrigger {
	constructor(config) {
		super(Object.assign({}, TIMER_DEF, config));
		this._intervalId = undefined;
		this._intervalTrigger = this._intervalTrigger.bind(this);
	}

	update(config = {}) {
		const oldInterval = getInterval(this.config);
		Object.assign(this.config, config);
		const newInterval = getInterval(this.config);
		if (newInterval !== oldInterval) registerTriggerInterval(this, newInterval);
	}

	get interval() {
		return this.config.interval;
	}
	get intervalUnit() {
		return this.config.intervalUnit;
	}

	step(manual) {
		if (manual) this.trigger();
	}
	start() {
		if (this.config.start) registerTriggerInterval(this, getStartInterval(this.config.start));
		else this._intervalTrigger();
	}
	stop(onUpdate, onProcessing) {
		if (!onProcessing) clearTriggerInterval(this);
		return super.stop(onUpdate, onProcessing);
	}
	pause() {
		clearTriggerInterval(this);
		super.pause();
	}
	resume() {
		registerTriggerInterval(this, getInterval(this.config));
		super.resume();
	}

	_intervalTrigger() {
		registerTriggerInterval(this, getInterval(this.config));
		this.trigger();
	}
}
TimerTrigger.TYPE_RANDOM = 'random';
TimerTrigger.TYPE_TIME = 'time';

module.exports = TimerTrigger;