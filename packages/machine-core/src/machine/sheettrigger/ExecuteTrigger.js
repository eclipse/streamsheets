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
const { TimerRepeatUntilCycle } = require('./RepeatUntilCycle');
const RepeatedMessageLoopCycle = require('./RepeatedMessageLoopCycle');
const { ManualCycle, TimerCycle, MIN_CYCLETIME } = require('./cycles');

const noop = () => {};

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
			if (this.trigger.repetitions < 1 && this.sheet.isProcessed) this.trigger.resumeExecute();
			else super.schedule();
		}
		step() {
			this.trigger.repetitions -= 1;
			this.streamsheet.stats.executesteps += 1;
			if (this.trigger.message) attachExecuteMessage(this.trigger.message, this.streamsheet);
			super.step();
		}
	};

class PacedRepeatUntilCycle extends TimerRepeatUntilCycle {
	getCycleTime() {
		return this.trigger.speed;
	}
}
class PacedMessageLoopCycle extends MessageLoopCycle.withBaseClass(TimerCycle) {
	getCycleTime() {
		return this.trigger.speed;
	}
	getRepeatUntilCycle() {
		return new PacedRepeatUntilCycle(this.trigger, this);
	}
}

class PacedRepeatedExecuteCycle extends RepeatedExecuteCycle(TimerCycle) {
	getCycleTime() {
		return this.trigger.speed;
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
		if (this.trigger.repetitions < 1 && this.sheet.isProcessed) this.hasExecuted = false;
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

class ExecuteTrigger extends BaseTrigger {
	constructor(config = {}) {
		super(Object.assign({}, config, { type: ExecuteTrigger.TYPE }));
		this.speed = undefined;
		this.message = undefined;
		this.retval = undefined;
		this.resumeFn = undefined;
		this.repetitions = 0;
		this.activeCycle = new ManualRepeatedExecuteCycle(this);
	}

	getManualCycle() {
		const manualCycle = new ManualRepeatedExecuteCycle(this);
		// if already executed e.g. if switched from pause to manual step
		manualCycle.hasExecuted = !!this.resumeFn;
		return manualCycle;
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

	dispose() {
		// ensure execute is cancelled on dispose
		this.cancelExecute();
		super.dispose();
	}

	execute(repetitions, message, speed, resumeFn) {
		// DL-4592: default to machine cycle or use 20 in ms
		this.speed = Math.max(MIN_CYCLETIME, speed || this.machine.cycletime);
		this.message = message;
		this.repetitions = repetitions;
		this.resumeFn = resumeFn || noop;
		this.streamsheet.stats.executesteps = 0;
		// might be called on manual step, but still on machine one
		if (this.machine.isManualStep && !this.activeCycle.isManual) this.activeCycle = this.getManualCycle();
		this.activeCycle.run();
	}
	cancelExecute() {
		// might be called after dispose by a different sheet!
		if (this.streamsheet) {
			this.retval = undefined;
			this.resumeFn = undefined;
			this.stopProcessing();
			this.activeCycle = this.isMachineStopped ? this.getManualCycle() : this.getTimerCycle();
		}
	}
	resumeExecute() {
		if (this.resumeFn) {
			this.resumeFn(this.retval);
			this.resumeFn = undefined;
		}
		this.retval = undefined;
	}

	stopProcessing(retval) {
		this.retval = retval;
		super.stopProcessing(retval);
	}
}
ExecuteTrigger.TYPE = 'execute';

module.exports = ExecuteTrigger;
