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
const { ManualStepCycle, RepeatUntilCycle, TriggerCycle } = require('./cycles');


class MachineCycleWrapper extends TriggerCycle {
	step() {
		this.trigger.streamsheet.stats.steps += 1;
		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new RepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else {
			this.trigger.processSheet();
		}
	}
}

const TYPE_CONF = Object.freeze({ type: 'continuously' });

class ContinuousTrigger extends BaseTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(config);
		this.activeCycle = new ManualStepCycle(this);
	}

	getManualCycle() {
		return new ManualStepCycle(this);
	}

	getTimerCycle() {
		return new MachineCycleWrapper(this);
	}

}

module.exports = ContinuousTrigger;
