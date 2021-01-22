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
const { ManualStepCycle, NoOpCycle, RepeatUntilCycle, TimerCycle } = require('./cycles');

const TYPE = {
	START: 'start',
	STOP: 'stop'
};

const always = (val) => () => val;
const toggle = (init) => {
	let _toggle = init;
	return () => {
		const doIt = _toggle;
		_toggle = !_toggle;
		return doIt;
	};
};
const once = (fn) => {
	let didIt = false;
	return (/* ...args */) => {
		if (!didIt) {
			didIt = true;
			fn();
		}
	};
};
const preventStop = (doIt, streamsheet) => {
	const machine = streamsheet && streamsheet.machine;
	if (machine) machine.preventStop = doIt;
};
class OnStopRepeatUntilCycle extends RepeatUntilCycle {
	get isOnStopRepeat() {
		return true;
	}
	step() {
		preventStop(true, this.trigger.streamsheet);
	}
	process() {
		super.process();
		preventStop(true, this.trigger.streamsheet);
	}
}
class MachineCycle extends TimerCycle {
	constructor(trigger) {
		super(trigger);
		// ensure we call step only once
		this.step = once(this.step.bind(this));
	}
	run() {
		this.step();
	}
	step() {
		if (this.trigger.isEndless) {
			preventStop(true, this.trigger.streamsheet);
			this.trigger.streamsheet.stats.steps += 1;
			this.trigger.activeCycle =
				this.trigger.type === TYPE.STOP
					? new OnStopRepeatUntilCycle(this.trigger, this)
					: new RepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else {
			this.trigger.streamsheet.stats.steps += 1;
			this.trigger.processSheet();
		}
	}
}

class MachineTrigger extends BaseTrigger {
	constructor(config = {}) {
		super(config);
		this.runOnStop = this.type === TYPE.STOP ? toggle(true) : always(false);
		this.activeCycle = this.getManualCycle();
	}

	getManualCycle() {
		// ignore cycle switch if we are in endless run on stop trigger!
		if (this.activeCycle.isOnStopRepeat) return this.activeCycle;
		// allow manual stepping only on start trigger
		return this.type === TYPE.START ? new ManualStepCycle(this) : new NoOpCycle(this, true);
	}

	getTimerCycle() {
		return new MachineCycle(this);
	}

	start() {
		this.activeCycle = this.type === TYPE.START ? this.getTimerCycle() : new NoOpCycle(this, false);
	}
	stop() {
		if (this.runOnStop()) {
			this.activeCycle = this.getTimerCycle();
			return false;
		}
		return super.stop();
	}

	step(manual) {
		super.step(manual);
	}
}

MachineTrigger.TYPE_START = TYPE.START;
MachineTrigger.TYPE_STOP = TYPE.STOP;
// MachineTrigger.TYPE_STARTSTOP = 'startstop';

module.exports = MachineTrigger;
