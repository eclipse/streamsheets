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


class MachineCycleWrapper extends TriggerCycle {
	step() {
		this.trigger.streamsheet.stats.steps += 1;
		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new RepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else {
			this.trigger.processSheet();
		}
	}
}

class MessageLoopCycle extends MachineCycleWrapper {
	isFinished() {
		return (
			!this.trigger.sheet.isPaused &&
			this.trigger.sheet.isProcessed &&
			this.trigger.streamsheet.isMessageProcessed()
		);
	}
	step() {
		this.trigger.useNextMessage = this.trigger.streamsheet.isMessageProcessed();
		if (this.trigger.isEndless) {
			this.trigger.streamsheet.stats.steps += 1;
			this.trigger.activeCycle = new RepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
			this.trigger.useNextMessage = false;
		} else {
			this.trigger.streamsheet.stats.steps += 1;
			this.trigger.processSheet();
			if (this.isFinished()) {
				this.stop();
			}
		}
	}
	finishOnResume() {
		return (
			this.trigger.sheet.isProcessed &&
			(this.trigger.streamsheet.isMessageProcessed() ||
				this.trigger.streamsheet.getLoopIndex() === this.trigger.streamsheet.getLoopCount() - 1)
		);
	}
	resume() {
		const loopIndexBefore = this.trigger.streamsheet.getLoopIndex();
		super.resume();
		const loopIndex = this.trigger.streamsheet.getLoopIndex();
		if (loopIndex <= loopIndexBefore && this.finishOnResume()) {
			this.stop();
		}
	}
}

class ManualMessageLoopCycle extends ManualStepCycle {
	isFinished() {
		return (
			!this.trigger.sheet.isPaused &&
			this.trigger.sheet.isProcessed &&
			this.trigger.streamsheet.isMessageProcessed()
		);
	}
	step() {
		this.trigger.useNextMessage = this.trigger.streamsheet.isMessageProcessed();
		if (this.trigger.isEndless) {
			this.trigger.streamsheet.stats.steps += 1;
			this.trigger.activeCycle = new ManualRepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
			this.trigger.useNextMessage = false;
		} else {
			this.trigger.streamsheet.stats.steps += 1;
			this.trigger.processSheet();
			if (this.isFinished()) {
				this.stop();
			}
		}
	}
	finishOnResume() {
		return (
			this.trigger.sheet.isProcessed &&
			(this.trigger.streamsheet.isMessageProcessed() ||
				this.trigger.streamsheet.getLoopIndex() === this.trigger.streamsheet.getLoopCount() - 1)
		);
	}
	resume() {
		// resuming on loop might go to next element, finish only if not
		const loopIndexBefore = this.trigger.streamsheet.getLoopIndex();
		super.resume();
		const loopIndex = this.trigger.streamsheet.getLoopIndex();
		if (loopIndex <= loopIndexBefore && this.finishOnResume()) {
			this.stop();
		}
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
		// this.activeCycle = new ManualStepCycle(this);
		this.activeCycle = new ManualMessageLoopCycle(this);
	}

	getManualCycle() {
		// return new ManualStepCycle(this);
		return new ManualMessageLoopCycle(this);
	}

	getTimerCycle() {
		return new MessageLoopCycle(this);
	}

	processSheet(useNextMessage) {
		if (useNextMessage == null) useNextMessage = this.useNextMessage;
		// useNextMessage =
		// 	useNextMessage && this._streamsheet.isMessageProcessed();
		// 	!this.isEndless &&
		// 	this._streamsheet.isMessageProcessed() &&
		// 	(this.sheet.isReady || this.sheet.isProcessed);
		// // this._hasTriggered = true;
		this._streamsheet.process(useNextMessage);
	}
}

module.exports = ContinuousTrigger;
