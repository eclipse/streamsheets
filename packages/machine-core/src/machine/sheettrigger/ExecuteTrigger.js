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
const Machine = require('../Machine');
const TaskQueue = require('../TaskQueue');
const { ManualStepCycle, ManualRepeatUntilCycle, RepeatUntilCycle, TimerCycle } = require('./cycles');


const noop = () => {};
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
		// } else if (this.isFinished()) {
		// 	// console.log('STOP');
		// 	this.stop();
		} else {
			this.trigger.streamsheet.stats.steps += 1;
			// console.log(`process ${this.trigger.streamsheet.name} ( is processed ${this.trigger.sheet.isProcessed})`);
			this.trigger.processSheet(this.useNextMessage);
			if (this.isFinished()) {
				this.stop();
			}
		}
	}
	finishOnResume() {
		// console.log(`FINISH RESUME ${this.trigger.streamsheet.name}: loop=${this.trigger.streamsheet.getLoopIndex()} loopCount= ${this.trigger.streamsheet.getLoopCount()}}`);
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
class PacedExecuteRepeatCycle extends TimerCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.isActive = false;
		this.useNextMessage = false;
		this.getCycleTime = getPace(trigger, (pace) => pace != null && pace !== false);
	}
	activate() {
		super.activate();
		this.schedule();
		this.trigger.streamsheet.setMessageProcessed();	
	}
	schedule() {
		if (this.isActive) {
			if (this.trigger.sheet.isProcessed && this.trigger.repetitions < 1) {
				// console.log(`RESUME FROM ${this.trigger.streamsheet.name}`);
				this.isActive = false;
				this.hasExecuted = false;
				this.trigger.resumeExecute();
			} else {
				// console.log(`SCHEDULE ${this.trigger.streamsheet.name}`);
				super.schedule();
			}
		}
	}
	step() {
		// console.log('STEP EXECUTE');
		this.isActive = true;
		this.hasStepped = true;
		this.hasExecuted = true;
		this.trigger.repetitions -= 1;
		this.trigger.streamsheet.stats.repeatsteps = 0;
		this.trigger.streamsheet.stats.executesteps += 1;
		// remove this and add it to streamsheet.execute() if message should only be consumed on first repeat
		if (this.trigger.message) this.trigger.streamsheet._attachMessage(this.trigger.message);
		this.trigger.activeCycle = new PacedMessageLoopCycle(this.trigger, this);
		this.trigger.activeCycle.run(this.useNextMessage);		
	}
}

class ManualMessageLoopCycle extends ManualStepCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.useNextMessage = false;
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
	run(useNextMessage) {
		this.useNextMessage = useNextMessage;
		super.run();
	}
	isFinished() {
		return (
			!this.trigger.sheet.isPaused &&
			this.trigger.sheet.isProcessed &&
			this.trigger.streamsheet.isMessageProcessed()
		);
	}
	step() {
		// 	console.log('MESSAGE LOOP STEP');
		if (this.trigger.isEndless) {
			this.trigger.streamsheet.stats.steps += 1;
			this.trigger.activeCycle = new ManualRepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
			// } else if (this.isFinished()) {
			// 	// console.log('STOP');
			// 	this.stop();
		} else {
			this.trigger.streamsheet.stats.steps += 1;
			// console.log(`process ${this.trigger.streamsheet.name} ( is processed ${this.trigger.sheet.isProcessed})`);
			this.trigger.processSheet(this.useNextMessage || this.trigger.streamsheet.isMessageProcessed());
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
class ManualExecuteRepeatCycle extends ManualStepCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.hasStepped = false;
		this.hasExecuted = false;
		this.useNextMessage = false;
	}
	activate() {
		super.activate();
		this.schedule();
		this.trigger.streamsheet.setMessageProcessed();	
	}
	schedule() {
		if (this.trigger.sheet.isProcessed && this.trigger.repetitions < 1) {
			// console.log(`RESUME FROM ${this.trigger.streamsheet.name}`);
			this.hasExecuted = false;
			this.trigger.resumeExecute();
		} else {
			// console.log(`SCHEDULE ${this.trigger.streamsheet.name}`);
			super.schedule();
			// this.run();
		}
	}
	run() {
		// console.log('STEP EXECUTE');
		this.hasStepped = true;
		this.hasExecuted = true;
		this.trigger.repetitions -= 1;
		this.trigger.streamsheet.stats.repeatsteps = 0;
		this.trigger.streamsheet.stats.executesteps += 1;
		// remove this and add it to streamsheet.execute() if message should only be consumed on first repeat
		if (this.trigger.message) this.trigger.streamsheet._attachMessage(this.trigger.message);
		this.trigger.activeCycle = new ManualMessageLoopCycle(this.trigger, this);
		this.trigger.activeCycle.run(this.useNextMessage);
	}
	step() {
		if (this.hasExecuted && !this.hasStepped) this.run();
	}
}

const TYPE_CONF = { type: 'execute' };

class ExecuteTrigger extends BaseTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(config);
		this.pace = undefined;
		this.message = undefined;
		this.retval = undefined;
		this.resumeFn = undefined
		this.repetitions = 0;
		this.activeCycle = new ManualExecuteRepeatCycle(this);
	}

	getManualCycle() {
		return new ManualExecuteRepeatCycle(this);
		// return new PacedExecuteRepeatCycle(this);
	}

	getTimerCycle() {
		return new PacedExecuteRepeatCycle(this);
	}

	start() {
		super.start();
		// if execute was called by manual step it won't be called again, so start here!
		if (this.resumeFn) {
			this.activeCycle.isActive = true;
			this.activeCycle = new PacedMessageLoopCycle(this, this.activeCycle);
			this.activeCycle.run();
			// return this.activeCycle
		}
	}
	stop() {
		this.resumeFn = undefined;
		return super.stop();
	}
	step(manual) {
		// only handle manual steps
		// const doExecute = manual && this.isActive; // callResumeFn; // && !this._hasExecuted;
		// if (doExecute) super.step(manual);
		// if (this.isActive) super.step(manual);
		if (manual && this.resumeFn) super.step(manual);
	}
	execute(resumeFn, pace, repetitions, message) {
		this.pace = pace;
		this.message = message;
		this.repetitions = repetitions;
		this.resumeFn = resumeFn || noop;
		this.streamsheet.stats.executesteps = 0;
		if (this.sheet.isProcessed) this.sheet.processor.reset();
		// called by different sheet, so schedule it
		TaskQueue.schedule(() => { this.activeCycle.run(); });
	}
	cancelExecute() {
		if (!this.sheet.isProcessed) this.stopProcessing();
		this.resumeFn = undefined;
		this.activeCyle = this.getManualCycle();
	}
	resumeExecute() {
		// call different sheet, so schedule it
		TaskQueue.schedule(this.resumeFn, this.retval);
		this.retval = undefined;
	}

	stopProcessing(retval) {
		this.retval = retval;
		super.stopProcessing(retval);
	}
	processSheet(useNextMessage) {
		if (useNextMessage) this._streamsheet.process(useNextMessage);
		else super.processSheet();
	}

	preStep(manual) {
		// required if stepped (manual) on machine pause (cyclic)
		if (manual) {
			if(!this.activeCycle.isManual) this.activeCycle = this.getManualCycle();
			this.activeCycle.hasStepped = false;
		} 
	}
}

module.exports = ExecuteTrigger;
