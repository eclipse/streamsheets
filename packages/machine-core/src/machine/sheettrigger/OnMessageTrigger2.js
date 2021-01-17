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
const { ManualCycle, TimerCycle } = require('./cycles');


class RepeatUntilCycle extends TimerCycle {

	getCycleTime() {
		return 1;
	}

	onTrigger() {
		this.trigger.streamsheet.stats.repeatsteps += 1;
		this.trigger.streamsheet.triggerStep();	
	}
}
class MessageCycle extends TimerCycle {

	getCycleTime() {
		return 1;
	}

	resume() {
		super.resume();
		if (!this.trigger.hasNewMessages()) {
			this.clear();
		}
	}

	onTrigger() {
		this.trigger.streamsheet.stats.steps += 1;
		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new RepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else {
			this.trigger.streamsheet.triggerStep();
			if (!this.trigger.hasNewMessages()) {
				this.clear();
			}
		}
	}
};
class RepeatUntilManualCycle extends ManualCycle {
	onTrigger() {
		if (!this.trigger.sheet.isPaused) {
			this.trigger.streamsheet.stats.repeatsteps += 1;
			this.trigger.streamsheet.triggerStep();
		}
	}
}
class ManualStepCycle extends ManualCycle {
	run() {
		this.trigger.streamsheet.stats.steps += 1;
		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new RepeatUntilManualCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else {
			this.trigger.streamsheet.triggerStep();
		}
	}
}

const unsubscribe = (streamsheet, trigger) => {
	// clearTrigger(trigger);
	if (streamsheet) streamsheet.inbox.off('message_put', trigger._onMessagePut);
};
const subscribe = (streamsheet, trigger) => {
	if (streamsheet) streamsheet.inbox.on('message_put', trigger._onMessagePut);
	return streamsheet;
};


const TYPE_CONF = Object.freeze({ type: 'arrival' });

class OnMessageTrigger2 extends BaseTrigger2 {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(config);
		this._onMessagePut = this._onMessagePut.bind(this);
		this._activeCycle = new ManualStepCycle(this);
	}

	get streamsheet() {
		return super.streamsheet;
	}
	set streamsheet(streamsheet) {
		super.streamsheet = streamsheet;
		unsubscribe(this.streamsheet, this);
		super.streamsheet = subscribe(streamsheet, this);
		// start trigger if inbox already has messages...
		if (streamsheet && !streamsheet.inbox.isEmpty() && !this.isMachineStopped) this.start();
		//  this._inboxTrigger();	
	}

	get activeCycle() {
		return this._activeCycle;
	}
	set activeCycle(cycle) {
		this._activeCycle.clear();
		// TODO: dispose activeCycle?
		// this._activeCycle.dispose();
		this._activeCycle = cycle;
	}

	get isMachineStopped() {
		const machine = this.streamsheet.machine;
		return machine == null || !machine.isRunning;
	}

	dispose() {
		unsubscribe(this.streamsheet, this);
		this.activeCycle.dispose();
		super.dispose();
	}

	update(config = {}) {
		this.config = Object.assign(this.config, config);
		this.activeCycle.clear();
		if (!this.sheet.isPaused) {
			if (!this.sheet.isProcessed) this.streamsheet.triggerStep();
			if (!this.isMachineStopped) this.start();
		}
	}

	// MACHINE CONTROL METHODS
	updateCycle() {
		// TODO: not required anymore!! or is it?
	}

	pause() {
		// do not pause sheet! its done by functions only...
		this.activeCycle.pause();
	}

	resume() {
		// if we are not still paused by a function...
		if (!this.sheet.isPaused) {
			if (this.activeCycle.isManual) {
				// this.activeCycle = new ContinuousCycle(this);
				this.activeCycle = new MessageCycle(this);
				this.activeCycle.pause();
			}
			this.activeCycle.resume();
			// maybe we have to finish step, if it was resumed during machine pause
			if (!this.sheet.isProcessed) this.streamsheet.triggerStep();
		}
	}

	start() {
		this.activeCycle = new MessageCycle(this);
		if(this.hasNewMessages()) this.activeCycle.start();
	}

	stop() {
		this.stopProcessing();
		return true;
	}

	step(manual) {
		if (manual) {
			if (!this.activeCycle.isManual) this.activeCycle = new ManualStepCycle(this);
			this.activeCycle.run();
		}
	}
	// ~

	// SHEET CONTROL METHODS
	pauseProcessing() {
		this.activeCycle.pause();
		this.sheet._pauseProcessing();
	}
	resumeProcessing(retval) {
		// mark sheet as resumed
		this.sheet._resumeProcessing(retval);
		// finish current step
		if (!this.sheet.isProcessed && (this.activeCycle.isManual || !this.isMachineStopped))
			this.streamsheet.triggerStep();
		// resume cycle if machine runs
		if (!this.isMachineStopped) this.activeCycle.resume();
	}
	stopProcessing(retval) {
		this.activeCycle.stop();
		// TODO: review
		// if (!this.activeCycle.isActive) {
		// 	this.activeCycle.dispose();
		// 	this.activeCycle = new ManualCycle(this);
		// }
		this.sheet._stopProcessing(retval);
	}
	// ~

	_onMessagePut() {
		if (!this.isMachineStopped) this.activeCycle.run();
	}
	hasNewMessages() {
		return this.streamsheet.hasNewMessage();
	}
}

module.exports = OnMessageTrigger2;
