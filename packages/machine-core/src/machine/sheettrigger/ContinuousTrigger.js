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
const { ManualStepCycle, ManualRepeatUntilCycle, RepeatUntilCycle, TriggerCycle } = require('./cycles');

class TriggeredMessageLoopCycle extends MessageLoopCycle.createWithBaseClass(TriggerCycle) {
	createRepeatUntilCycle() {
		return new RepeatUntilCycle(this.trigger, this);
	}
};
class ManualMessageLoopCycle extends MessageLoopCycle.createWithBaseClass(ManualStepCycle) {
	createRepeatUntilCycle() {
		return new ManualRepeatUntilCycle(this.trigger, this);
	}
};


const TYPE_CONF = Object.freeze({ type: 'continuously' });

class ContinuousTrigger extends BaseTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(Object.assign({}, config, TYPE_CONF));
		this.useNextMessage = true;
		this.activeCycle = new ManualMessageLoopCycle(this);
	}

	getManualCycle() {
		return new ManualMessageLoopCycle(this);
	}

	getTimerCycle() {
		return new TriggeredMessageLoopCycle(this);
	}

	processSheet(useNextMessage) {
		if (useNextMessage == null) useNextMessage = this.useNextMessage;
		this._streamsheet.process(useNextMessage);
	}
}

module.exports = ContinuousTrigger;
