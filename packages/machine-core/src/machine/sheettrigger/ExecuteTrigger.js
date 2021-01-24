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
const MessageLoopCycle = require('./MessageLoopCycle');
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


const activateInExecuteRepeat = (cycle) => () => {
	Object.getPrototypeOf(cycle).activate.call(cycle);
	cycle.schedule();
	cycle.trigger.streamsheet.setMessageProcessed();	
};
const scheduleInExecuteRepeat = (cycle) => () => {
	if (cycle.isActive) {
		if (cycle.trigger.sheet.isProcessed && cycle.trigger.repetitions < 1) {
			cycle.isActive = false;
			cycle.hasExecuted = false;
			cycle.trigger.resumeExecute();
		} else {
			Object.getPrototypeOf(cycle).schedule.call(cycle);
		}
	}
};
const attachExecuteMessage = (message, streamsheet) => {
	const currmsg = streamsheet._msgHandler.message;
	if (message === currmsg) {
		streamsheet._msgHandler.reset();
	} 
	else {
		if (currmsg) streamsheet.inbox.pop(currmsg.id);
		streamsheet.inbox.put(message);
		streamsheet._attachMessage(message);
	}
	// streamsheet._attachMessage(message);
};
const stepExecuteRepeat = (cycle, SubCycleClass) => () => {
		cycle.isActive = true;
		cycle.hasStepped = true;
		cycle.hasExecuted = true;
		cycle.trigger.repetitions -= 1;
		cycle.trigger.streamsheet.stats.repeatsteps = 0;
		cycle.trigger.streamsheet.stats.executesteps += 1;
		// remove this and add it to streamsheet.execute() if message should only be consumed on first repeat
		if (cycle.trigger.message /* && cycle.trigger.streamsheet.isMessageProcessed() */) {
			attachExecuteMessage(cycle.trigger.message, cycle.trigger.streamsheet);
		}
		// if (cycle.trigger.message) cycle.trigger.streamsheet._attachMessage(cycle.trigger.message);
		cycle.trigger.activeCycle = new SubCycleClass(cycle.trigger, cycle);
		cycle.trigger.activeCycle.run(cycle.useNextMessage);
};
class PacedRepeatUntilCycle extends RepeatUntilCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.getCycleTime = getPace(trigger, (pace) => pace == null || pace === true);
	}
}
class PacedMessageLoopCycle extends MessageLoopCycle.createWithBaseClass(TimerCycle) {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.useNextMessage = false;
	}
	createRepeatUntilCycle() {
		return new PacedRepeatUntilCycle(this.trigger, this);
	}
	run(useNextMessage) {
		this.useNextMessage = useNextMessage;
		super.run();
	}
}

class PacedExecuteRepeatCycle extends TimerCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.isActive = false;
		this.useNextMessage = false;
		this.getCycleTime = getPace(trigger, (pace) => pace != null && pace !== false);
		this.step = stepExecuteRepeat(this, PacedMessageLoopCycle);
		this.activate = activateInExecuteRepeat(this);
		this.schedule = scheduleInExecuteRepeat(this);
	}
}

class ManualMessageLoopCycle extends MessageLoopCycle.createWithBaseClass(ManualStepCycle) {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.useNextMessage = false;
	}
	createRepeatUntilCycle() {
		return new ManualRepeatUntilCycle(this.trigger, this);
	}
	run(useNextMessage) {
		this.useNextMessage = useNextMessage;
		super.run();
	}	
}

class ManualExecuteRepeatCycle extends ManualStepCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.isActive = true;
		this.hasStepped = false;
		this.hasExecuted = false;
		this.useNextMessage = false;
		this.run = stepExecuteRepeat(this, ManualMessageLoopCycle);
		this.activate = activateInExecuteRepeat(this);
		this.schedule = scheduleInExecuteRepeat(this);
	}
	// schedule() {
	// 	if (this.trigger.sheet.isProcessed && this.trigger.repetitions < 1) {
	// 		this.hasExecuted = false;
	// 		this.trigger.resumeExecute();
	// 	} else {
	// 		super.schedule();
	// 	}
	// }
	step() {
		if (this.hasExecuted && !this.hasStepped) {
			this.run();
		}
	}
}

const TYPE_CONF = { type: 'execute' };

class ExecuteTrigger extends BaseTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(Object.assign({}, config, TYPE_CONF));
		this.pace = undefined;
		this.message = undefined;
		this.retval = undefined;
		this.resumeFn = undefined;
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
		TaskQueue.schedule(() => {
			this.activeCycle.run();
		});
	}
	cancelExecute() {
		if (!this.sheet.isProcessed) this.stopProcessing();
		this.resumeFn = undefined;
		this.activeCyle = this.getManualCycle();
	}
	resumeExecute() {
		// called by different sheet, so schedule it
		TaskQueue.schedule(this.resumeFn, this.retval);
		this.retval = undefined;
		this.resumeFn = undefined;
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
			if (!this.activeCycle.isManual) this.activeCycle = this.getManualCycle();
			this.activeCycle.hasStepped = false;
		}
	}
}

module.exports = ExecuteTrigger;
