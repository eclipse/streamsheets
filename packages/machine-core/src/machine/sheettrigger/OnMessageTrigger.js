/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const State = require('../../State');
const BaseTrigger = require('./BaseTrigger');


const clearTrigger = (trigger) => {
	if (trigger._triggerId != null) {
		clearImmediate(trigger._triggerId);
		trigger._triggerId = undefined;
	}
};
const unsubscribe = (streamsheet, trigger) => {
	clearTrigger(trigger);
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

	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
		this._triggerId = undefined;
		this._inboxTrigger = this._inboxTrigger.bind(this);
		this._onMessagePut = this._onMessagePut.bind(this);
	}

	set streamsheet(streamsheet) {
		unsubscribe(this._streamsheet, this);
		super.streamsheet = subscribe(streamsheet, this);
		// start trigger if inbox already has messages...
		if (streamsheet && !streamsheet.inbox.isEmpty()) this._inboxTrigger();
	}


	dispose() {
		unsubscribe(this._streamsheet, this);
		super.dispose();
	}

	resume() {
		if (!this._streamsheet.inbox.isEmpty()) this._inboxTrigger();
	}
	start() {
		if (!this._streamsheet.inbox.isEmpty()) this._inboxTrigger();
	}
	step(manual) {
		if (manual) this.trigger();
	}

	_onMessagePut() {
		// ignore if we are in our own step cycle or in endless mode (since it uses always current message)...
		if (!this._triggerId && (!this.isEndless || this._stepId == null)) {
			this._triggerId = setImmediate(this._inboxTrigger);
		}
	}
	_inboxTrigger() {
		const machine = this._streamsheet.machine;
		this._triggerId = undefined;
		if (machine.state === State.RUNNING) {
			this.isResumed = false;
			this.trigger();
			// trigger a (fake ;-] ) machine step event because client can handle those...
			machine.notifyUpdate('step'); // <-- NOTE: this is important for EXECUTE-trigger too!!
			// (DL-508) endless mode reuse current message => prevent trigger ourselves twice (done by machine-cycle)
			if (!this.isEndless && this._streamsheet.hasNewMessage()) {
				this._triggerId = setImmediate(this._inboxTrigger);
			}
		}
	}
}

module.exports = OnMessageTrigger;
