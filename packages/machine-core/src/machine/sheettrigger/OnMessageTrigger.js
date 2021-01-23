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
const { ManualStepCycle, RepeatUntilCycle, TimerCycle } = require('./cycles');


class MessageCycle extends TimerCycle {
	activate() {
		super.activate();
		if (this.trigger.streamsheet.hasNewMessage()) this.run();
	}
	getCycleTime() {
		return 1;
	}
	step() {
		this.trigger.streamsheet.stats.steps += 1;
		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new RepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else {
			this.trigger.processSheet();
			if (!this.trigger.streamsheet.hasNewMessage()) {
				this.clear();
			}
		}
	}
	resume() {
		super.resume();
		if (!this.trigger.streamsheet.hasNewMessage()) {
			this.clear();
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

class OnMessageTrigger extends BaseTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(config);
		this.activeCycle = new ManualStepCycle(this);
		this._onMessagePut = this._onMessagePut.bind(this);
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
	}

	_onMessagePut() {
		if (!this.isMachineStopped) this.activeCycle.run();
	}

	dispose() {
		unsubscribe(this.streamsheet, this);
		super.dispose();
	}

	getManualCycle() {
		return new ManualStepCycle(this);
	}

	getTimerCycle() {
		return new MessageCycle(this);
	}

	start() {
		super.start();
		if(this.streamsheet.hasNewMessage()) this.activeCycle.run();
	}

	step(manual) {
		// only handle manual steps
		if (manual) super.step(manual);
	}
}

module.exports = OnMessageTrigger;
