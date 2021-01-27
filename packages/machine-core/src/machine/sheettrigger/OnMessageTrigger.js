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
const RepeatedMessageLoopCycle = require('./RepeatedMessageLoopCycle');
const { ManualMessageLoopCycle, TimerMessageLoopCycle } = require('./MessageLoopCycle');
const { ManualCycle, TimerCycle } = require('./cycles');

const RepeatedOnMessageCycle = (BaseClass) =>
	class extends RepeatedMessageLoopCycle.withBaseClass(BaseClass) {
		schedule() {
			if (this.trigger.streamsheet.hasNewMessage()) super.schedule();
		}
	};
class OnMessageCycle extends RepeatedOnMessageCycle(TimerCycle) {
	getMessageLoopCycle() {
		return new TimerMessageLoopCycle(this.trigger, this);
	}
}
class ManualOnMessageCycle extends RepeatedOnMessageCycle(ManualCycle) {
	getMessageLoopCycle() {
		return new ManualMessageLoopCycle(this.trigger, this);
	}
}

const unsubscribe = (streamsheet, trigger) => {
	streamsheet.inbox.off('message_put', trigger._onMessagePut);
};
const subscribe = (streamsheet, trigger) => {
	streamsheet.inbox.on('message_put', trigger._onMessagePut);
	return streamsheet;
};

class OnMessageTrigger extends BaseTrigger {
	constructor(config = {}) {
		super(Object.assign({}, config, { type: OnMessageTrigger.TYPE }));
		this.activeCycle = new ManualOnMessageCycle(this);
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
		return new ManualOnMessageCycle(this);
	}

	getTimerCycle() {
		return new OnMessageCycle(this);
	}

	start() {
		super.start();
		if (this.streamsheet.hasNewMessage()) this.activeCycle.run();
	}

	step(manual) {
		// only handle manual steps
		if (manual) super.step(manual);
	}
}
OnMessageTrigger.TYPE = 'arrival';

module.exports = OnMessageTrigger;
