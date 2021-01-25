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
const { RepeatUntilCycle, TriggerCycle } = require('./cycles');

class MachineTriggeredMessageLoopCycle extends MessageLoopCycle.withBaseClass(TriggerCycle) {
	getRepeatUntilCycle() {
		return new RepeatUntilCycle(this.trigger, this);
	}
};

const TYPE_CONF = Object.freeze({ type: 'continuously' });

class ContinuousTrigger extends BaseTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(Object.assign({}, config, TYPE_CONF));
		this.activeCycle = new ManualMessageLoopCycle(this);
	}

	getManualCycle() {
		return new ManualMessageLoopCycle(this);
	}

	getTimerCycle() {
		return new MachineTriggeredMessageLoopCycle(this);
	}
}

module.exports = ContinuousTrigger;
