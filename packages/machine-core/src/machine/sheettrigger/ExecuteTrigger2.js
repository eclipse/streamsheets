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
const Machine = require('../Machine');
const { ManualStepCycle, ManualRepeatUntilCycle, RepeatUntilCycle, TimerCycle } = require('./cycles');

const noop = () => {};
// const maxPace = () => 
// const getCycleTime = (machine, pace) =>
// 	// eslint-disable-next-line no-nested-ternary
// 	(pace == null || pace === true) ? 1 : machine ? machine.cycletime : Machine.DEF_CYCLETIME;

const getPace = (trigger, useMax) => () => {
	const pace = trigger.pace;
	const machine = trigger.streamsheet.machine;
	// eslint-disable-next-line no-nested-ternary
	return useMax(pace) ? 1 : machine ? machine.cycletime : Machine.DEF_CYCLETIME;
};

class PacedRepeatUntilCycle extends RepeatUntilCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.getCycleTime = getPace(trigger, (pace) => pace == null || pace === true);
	}
}
class PacedMessageLoopCycle extends TimerCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.useNextMessage = false;
		this.getCycleTime = getPace(trigger, (pace) => pace != null && pace !== false);
	}
	isLastLoopIndex() {
		return this.trigger.streamsheet._msgHandler._index >= this.trigger.streamsheet._msgHandler._stack.length - 1;
	}
	activate() {
		// console.log('ACTIVATE LOOP CYCLE');
		// console.log(`loop index ${this.trigger.streamsheet._msgHandler._index}`);
		super.activate();
		this.schedule();
		// if (this.isFinished() || this.isLastLoopIndex()) {
		if (this.isLastLoopIndex()) {
			// console.log('FINISHED ACTIVATE LOOP CYCLE');
			if (this.parentcycle) this.parentcycle.activate();
		}
	}
	// schedule(useNextMessage) {
	// 	this.useNextMessage = useNextMessage;
	// 	super.schedule();
	// }
	run(useNextMessage) {
		this.useNextMessage = useNextMessage;
		super.run();
	}
	isFinished() {
		return (
			!this.trigger.sheet.isPaused &&
			this.trigger.streamsheet.isMessageProcessed() &&
			this.trigger.sheet.isProcessed 
			// &&	this.trigger.streamsheet.inbox.size < 2
		);
	}
	step() {
		if (this.trigger.isEndless) {
			this.trigger.streamsheet.stats.steps += 1;
			this.trigger.activeCycle = new PacedRepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else if (this.isFinished()) {
			// console.log('STOP');
			this.stop();
		} else {
			this.trigger.streamsheet.stats.steps += 1;
			// console.log(`process ${this.trigger.streamsheet.name} ( is processed ${this.trigger.sheet.isProcessed})`);
			this.trigger.processSheet(this.useNextMessage);

			// if (this.isFinished() && this.trigger.sheet.isProcessed) {
			// 	console.log('STOP');
			// 	this.stop();
			// }
		}
	}
}
class PacedExecuteRepeatCycle extends TimerCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.useNextMessage = false;
		this.getCycleTime = getPace(trigger, (pace) => pace != null && pace !== false);
	}

	get isExecuteRepeat() {
		return true;
	}

	activate() {
		super.activate();
		this.schedule();
		this.trigger.streamsheet.setMessageProcessed();	
		// if (this.trigger.sheet.isProcessed) {
		// 	this.trigger.callResumeFn();
		// }
	}
	schedule() {
		if (this.trigger.sheet.isProcessed) {
			// console.log(`RESUME FROM ${this.trigger.streamsheet.name}`);
			this.trigger.callResumeFn();
		} else {
			// console.log(`SCHEDULE ${this.trigger.streamsheet.name}`);
			super.schedule();
		}
	}
	// resume() {
	// 	this.trigger.callResumeFn();
	// }
	step() {
		// console.log('STEP EXECUTE');
		this.trigger.streamsheet.stats.repeatsteps = 0;
		this.trigger.streamsheet.stats.executesteps += 1;
		this.trigger.activeCycle = new PacedMessageLoopCycle(this.trigger, this);
		this.trigger.activeCycle.run(this.useNextMessage);
	}
}

class ManualMessageLoopCycle extends ManualStepCycle {
	activate() {
		this.trigger.activeCycle = this;
		super.activate();
		if (this.trigger.streamsheet.isMessageProcessed()) {
			if (this.parentcycle) this.parentcycle.activate();
		}
	}
	onTrigger() {
		this.trigger.streamsheet.stats.steps += 1;
		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new ManualRepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else {
			this.trigger.processSheet();
			if (this.trigger.streamsheet.isMessageProcessed()) {
				if (this.parentcycle) this.parentcycle.activate();
			}
		}
	}
}
class ManualExecuteRepeatCycle extends ManualStepCycle {
	activate() {
		this.trigger.activeCycle = this;
		if (this.trigger.sheet.isProcessed) {
			this.trigger.callResumeFn();
		}
	}
	schedule() {
		if (this.trigger.sheet.isProcessed) {
			this.trigger.callResumeFn();
		}
	}
	step() {
		this.trigger.activeCycle = new ManualMessageLoopCycle(this.trigger, this);
		this.trigger.activeCycle.run();
	}
}

const TYPE_CONF = { type: 'execute' };

class ExecuteTrigger2 extends BaseTrigger2 {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(config);
		this.activeCycle = new ManualExecuteRepeatCycle(this);
	}

	getManualCycle() {
		return new ManualExecuteRepeatCycle(this);
	}

	getTimerCycle() {
		return new PacedExecuteRepeatCycle(this);
	}

	step(manual) {
		// only handle manual steps
		if (manual) super.step();
	}

	execute(resumeFn, pace, isRepeating) {
		// console.log('EXECUTE');
		this.pace = pace;
		// have to use immediate to not trigger in same cycle!!
		this.callResumeFn = resumeFn ? () => setImmediate(resumeFn) : noop;
		if (this.sheet.isProcessed) this.sheet.processor.reset();
		if (isRepeating) {
			this.activeCycle.schedule();
			this.activeCycle.useNextMessage = true;
		} else {
			this.streamsheet.stats.executesteps = 0;
			this.activeCycle.run();
		}
	}
	cancelExecute() {
		if (!this.sheet.isProcessed) this.stopProcessing();
		this.callResumeFn = noop;
	}

	processSheet(useNextMessage) {
		if (useNextMessage) this._streamsheet.process(useNextMessage);
		else super.processSheet();
	}
}

module.exports = ExecuteTrigger2;
