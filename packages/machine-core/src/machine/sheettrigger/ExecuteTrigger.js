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
// const maxPace = () => 
// const getCycleTime = (machine, pace) =>
// 	// eslint-disable-next-line no-nested-ternary
// 	(pace == null || pace === true) ? 1 : machine ? machine.cycletime : Machine.DEF_CYCLETIME;
const oncePerMachineStep = (fn, title) => {
	let done = false;
	let result;
	return ({
		reset() {
			done = false;
		},
		trigger() {
			// setImmediate(() => {
			// process.nextTick(() => {
			TaskQueue.schedule(() => {
				if (!done) {
					// console.log(`*** ONCE: ${title} ***`);
					done = true;
					result = fn();
				} 
				// else console.log(`*** ONCE CACHE: ${title} ***`);
				return result;
			});
			// return new Promise((resolve) => {
			// 	if (!done) {
			// 		console.log(`*** ONCE: ${title} ***`);
			// 		done = true;
			// 		result = fn();
			// 	} else console.log(`*** ONCE CACHE: ${title} ***`);
			// 	resolve(result);
			// });
		}
	});
};

const consoleLogTask = (fn, msg) => () => {
	// console.log(msg);
	fn();
};


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

	// finishOnResume() {
	// 	return (
	// 		this.trigger.sheet.isProcessed &&
	// 		(this.trigger.streamsheet.isMessageProcessed() ||
	// 		this.trigger.streamsheet.getLoopIndex() === this.trigger.streamsheet.getLoopCount() - 1)
	// 	);
	// }
	// resume() {
	// 	super.resume();
	// 	if (this.finishOnResume() || true) {
	// 		this.stop();
	// 	}
	// }
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
		super.resume();
		if (this.finishOnResume()) {
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
				this.trigger.callResumeFn();
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
		super.resume();
		if (this.finishOnResume()) {
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
			this.trigger.callResumeFn();
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
		// flag to prevent executing twice on manual stepping if this comes before triggering sheet
		// this._hasExecuted = false;
		this.message = undefined;
		this.repetitions = 0;
		this._doExecute = this._doExecute.bind(this);
		this.activeCycle = new ManualExecuteRepeatCycle(this);
	}

	getManualCycle() {
		return new ManualExecuteRepeatCycle(this);
		// return new PacedExecuteRepeatCycle(this);
	}

	getTimerCycle() {
		return new PacedExecuteRepeatCycle(this);
	}

	step(manual) {
		// only handle manual steps
		const doExecute = manual && this.callResumeFn; // && !this._hasExecuted;
		if (doExecute) super.step(manual);
	}
	execute(resumeFn, pace, repetitions, message) {
		this.pace = pace;
		this.message = message;
		this.repetitions = repetitions;
		this.callResumeFn = resumeFn
			? () => TaskQueue.schedule(consoleLogTask(resumeFn, `RESUME ${this.streamsheet.name}`))
			: noop;
		if (this.activeCycle.isManual) {
			TaskQueue.schedule(() => {
				// this._doExecute(oncePerMachineStep(resumeFn).trigger, pace, isRepeating);
				this._doExecute();
			});
			// process.nextTick(this._doExecute, oncePerMachineStep(resumeFn).trigger, pace, isRepeating);
		}
		else {
			this.callResumeFn = resumeFn ? () => process.nextTick(resumeFn) : noop;
			process.nextTick(this._doExecute);
		} 
	}
	_doExecute() {
		// console.log('EXECUTE');
		// this.pace = pace;
		// have to use immediate to not trigger in same cycle!!
		// this.callResumeFn = resumeFn ? () => process.nextTick(resumeFn) : noop;
		// this.callResumeFn = resumeFn || noop;
		// this.callResumeFn = resumeFn ? () => setImmediate(resumeFn) : noop;
		if (this.sheet.isProcessed) this.sheet.processor.reset();

		// OLD:
		// if (isRepeating) {
		// 	this.activeCycle.schedule();
		// 	this.activeCycle.useNextMessage = true;
		// } else {
		// 	this.streamsheet.stats.executesteps = 0;
		// 	// console.log('EXECUTE RUN');
		// 	this.activeCycle.run();
		// }

		this.streamsheet.stats.executesteps = 0;
		this.activeCycle.run();
	}
	cancelExecute() {
		if (!this.sheet.isProcessed) this.stopProcessing();
		this.callResumeFn = undefined;
		this.activeCyle = this.getManualCycle();
	}

	processSheet(useNextMessage) {
		if (useNextMessage) this._streamsheet.process(useNextMessage);
		else super.processSheet();
		// this._hasTriggered = this._hasExecuted;
	}

	preStep(manual) {
		// required if stepped (manual) on machine pause (cyclic)
		if (manual) {
			if(!this.activeCycle.isManual) this.activeCycle = this.getManualCycle();
			this.activeCycle.hasStepped = false;
		} 
		// this._hasExecuted = false;
	}
}

module.exports = ExecuteTrigger;
