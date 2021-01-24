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
const { ManualStepCycle, ManualRepeatUntilCycle, RepeatUntilCycle, TriggerCycle } = require('./cycles');

const stepInMessageLoop = (cycle, trigger, SubCycleClass) => {
	const isFinished = () => {
		return (
			!trigger.sheet.isPaused &&
			trigger.sheet.isProcessed &&
			trigger.streamsheet.isMessageProcessed()
		);
	}
	return () => {
		trigger.useNextMessage = trigger.streamsheet.isMessageProcessed();
		if (trigger.isEndless) {
			trigger.streamsheet.stats.steps += 1;
			trigger.activeCycle = new SubCycleClass(trigger, cycle);
			trigger.activeCycle.run();
			trigger.useNextMessage = false;
		} else {
			trigger.streamsheet.stats.steps += 1;
			trigger.processSheet();
			if (isFinished()) {
				cycle.stop();
			}
		}
	}
};
const resumeInMessageLoop = (cycle, trigger) => {
	const finishOnResume = () => {
		return (
			trigger.sheet.isProcessed &&
			(trigger.streamsheet.isMessageProcessed() ||
				trigger.streamsheet.getLoopIndex() === trigger.streamsheet.getLoopCount() - 1)
		);
	}
	return () => {
		const loopIndexBefore = trigger.streamsheet.getLoopIndex();
		Object.getPrototypeOf(cycle).resume.call(cycle);
		const loopIndex = trigger.streamsheet.getLoopIndex();
		if (loopIndex <= loopIndexBefore && finishOnResume()) {
			cycle.stop();
		}
	}
};

class MessageLoopCycle extends TriggerCycle {
	constructor(trigger, parentcycle) {
		super(trigger, parentcycle);
		this.step = stepInMessageLoop(this, trigger, RepeatUntilCycle);
		this.resume = resumeInMessageLoop(this, trigger);
	}
}

class ManualMessageLoopCycle extends ManualStepCycle {
	constructor(trigger, parentcycle) {
		super(trigger, parentcycle);
		this.step = stepInMessageLoop(this, trigger, ManualRepeatUntilCycle);
		this.resume = resumeInMessageLoop(this, trigger);
	}
}


const TYPE_CONF = Object.freeze({ type: 'continuously' });

class ContinuousTrigger extends BaseTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(Object.assign({}, config, TYPE_CONF));
		this.useNextMessage = true;
		this.activeCycle = new ManualMessageLoopCycle(this);
	}

	getManualCycle() {
		return new ManualMessageLoopCycle(this);
	}

	getTimerCycle() {
		return new MessageLoopCycle(this);
	}

	processSheet(useNextMessage) {
		if (useNextMessage == null) useNextMessage = this.useNextMessage;
		this._streamsheet.process(useNextMessage);
	}
}

module.exports = ContinuousTrigger;
