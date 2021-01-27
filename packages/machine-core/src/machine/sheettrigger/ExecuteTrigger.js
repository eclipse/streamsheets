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
const { ManualMessageLoopCycle } = require('./MessageLoopCycle');
const RepeatedMessageLoopCycle = require('./RepeatedMessageLoopCycle');
const Machine = require('../Machine');
const TaskQueue = require('../TaskQueue');
const { ManualCycle, RepeatUntilCycle, TimerCycle } = require('./cycles');

const noop = () => {};
const getPace = (trigger, useMax) => () => {
	const pace = trigger.pace;
	const machine = trigger.streamsheet.machine;
	// eslint-disable-next-line no-nested-ternary
	return useMax(pace) ? 1 : machine ? machine.cycletime : Machine.DEF_CYCLETIME;
};

const attachExecuteMessage = (message, streamsheet) => {
	const currmsg = streamsheet.messageHandler.message;
	if (message === currmsg) streamsheet.messageHandler.reset();
	else {
		if (currmsg) streamsheet.inbox.pop(currmsg.id);
		streamsheet.inbox.put(message);
	}
	streamsheet.attachMessage(message);
};
const RepeatedExecuteCycle = (BaseClass) =>
	class extends RepeatedMessageLoopCycle.withBaseClass(BaseClass) {
		schedule() {
			if (this.trigger.repetitions < 1) this.trigger.resumeExecute();
			else super.schedule();
		}
		step() {
			this.trigger.repetitions -= 1;
			this.trigger.streamsheet.stats.executesteps += 1;
			if (this.trigger.message) {
				attachExecuteMessage(this.trigger.message, this.trigger.streamsheet);
			}
			super.step();
		}
	};

class PacedRepeatUntilCycle extends RepeatUntilCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.getCycleTime = getPace(trigger, (pace) => pace == null || pace === true);
	}
}
class PacedMessageLoopCycle extends MessageLoopCycle.withBaseClass(TimerCycle) {
	getRepeatUntilCycle() {
		return new PacedRepeatUntilCycle(this.trigger, this);
	}
}

class PacedRepeatedExecuteCycle extends RepeatedExecuteCycle(TimerCycle) {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.getCycleTime = getPace(trigger, (pace) => pace != null && pace !== false);
	}
	getMessageLoopCycle() {
		return new PacedMessageLoopCycle(this.trigger, this);
	}
}

class ManualRepeatedExecuteCycle extends RepeatedExecuteCycle(ManualCycle) {
	constructor(trigger, parent) {
		super(trigger, parent);
		// flags to ensure step is only executed after call to execute() and only once per step
		this.hasStepped = false;
		this.hasExecuted = false;
	}
	getMessageLoopCycle() {
		return new ManualMessageLoopCycle(this.trigger, this);
	}

	activate() {
		super.activate();
		this.hasStepped = false;
	}
	run() {
		this.hasExecuted = true;
		super.run();
	}
	schedule() {
		if (this.trigger.repetitions < 1) this.hasExecuted = false;
		super.schedule();
	}

	step() {
		if (this.hasExecuted && !this.hasStepped) {
			this.hasStepped = true;
			this.hasExecuted = true;
			super.step();
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
		this.activeCycle = new ManualRepeatedExecuteCycle(this);
	}

	getManualCycle() {
		return new ManualRepeatedExecuteCycle(this);
	}

	getTimerCycle() {
		return new PacedRepeatedExecuteCycle(this);
	}

	start() {
		super.start();
		// if execute was called by manual step it won't be called again, so start here!
		if (this.resumeFn) {
			this.activeCycle = new PacedRepeatedExecuteCycle(this, this.activeCycle);
			this.activeCycle.run();
		}
	}
	stop() {
		this.resumeFn = undefined;
		return super.stop();
	}
	step(manual) {
		// only handle manual steps
		if (manual && this.resumeFn) super.step(manual);
	}
	execute(resumeFn, pace, repetitions, message) {
		this.pace = pace;
		this.message = message;
		this.repetitions = repetitions;
		this.resumeFn = resumeFn || noop;
		this.streamsheet.stats.executesteps = 0;
		// called by different sheet, so schedule it
		TaskQueue.schedule(() => this.activeCycle.run());
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
}

module.exports = ExecuteTrigger;
