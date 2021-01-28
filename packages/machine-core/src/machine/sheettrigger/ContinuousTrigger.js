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
const { TriggerCycle } = require('./cycles');

class MachineTriggeredMessageLoopCycle extends MessageLoopCycle.withBaseClass(TriggerCycle) {
	getRepeatUntilCycle() {
		return new TimerRepeatUntilCycle(this.trigger, this);
	}
}

class ContinuousTrigger extends BaseTrigger {
	constructor(config = {}) {
		super(Object.assign({}, config, { type: ContinuousTrigger.TYPE }));
		this.activeCycle = new ManualMessageLoopCycle(this);
	}

	getManualCycle() {
		return new ManualMessageLoopCycle(this);
	}

	getTimerCycle() {
		return new MachineTriggeredMessageLoopCycle(this);
	}
}
ContinuousTrigger.TYPE = 'continuously';

module.exports = ContinuousTrigger;
