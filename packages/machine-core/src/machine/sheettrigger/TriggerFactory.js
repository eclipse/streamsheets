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
const ContinuousTrigger = require('./ContinuousTrigger');
const ContinuousTrigger2 = require('./ContinuousTrigger2');
const ExecuteTrigger = require('./ExecuteTrigger');
const ExecuteTrigger2 = require('./ExecuteTrigger2');
const MachineTrigger = require('./MachineTrigger');
const MachineTrigger2 = require('./MachineTrigger2');
const NeverTrigger = require('./NeverTrigger');
const OneTimeTrigger = require('./OneTimeTrigger');
const OnMessageTrigger = require('./OnMessageTrigger');
const OnMessageTrigger2 = require('./OnMessageTrigger2');
const TimerTrigger = require('./TimerTrigger');
const TimerTrigger2 = require('./TimerTrigger2');

const TYPE = {
	ARRIVAL: OnMessageTrigger.TYPE,
	CONTINUOUSLY: ContinuousTrigger.TYPE,
	EXECUTE: ExecuteTrigger.TYPE,
	MACHINE_START: MachineTrigger.TYPE_START,
	MACHINE_STOP: MachineTrigger.TYPE_STOP,
	NONE: NeverTrigger.TYPE,
	ONCE: OneTimeTrigger.TYPE,
	RANDOM: TimerTrigger.TYPE_RANDOM,
	TIMER: TimerTrigger.TYPE_TIME
	// MACHINE_STARTSTOP: MachineTrigger.TYPE_STARTSTOP,
};
const TriggerFactory = {
	TYPE,
	create(config = {}) {
		let trigger;
		config.type = config.type || TYPE.ARRIVAL;
		switch (config.type) {
			case TYPE.ARRIVAL:
				// trigger = new OnMessageTrigger(config);
				trigger = new OnMessageTrigger2(config);
				break;
			case TYPE.CONTINUOUSLY:
				// trigger = new ContinuousTrigger(config);
				trigger = new ContinuousTrigger2(config);
				break;
			case TYPE.EXECUTE:
				// trigger = new ExecuteTrigger(config);
				trigger = new ExecuteTrigger2(config);
				break;
			case TYPE.MACHINE_START:
			case TYPE.MACHINE_STOP:
				// trigger = new MachineTrigger(config);
				trigger = new MachineTrigger2(config);
				break;
			case TYPE.NONE:
				trigger = new NeverTrigger(config);
				break;
			case TYPE.ONCE:
				trigger = new OneTimeTrigger(config);
				break;
			case TYPE.RANDOM:
			case TYPE.TIMER:
				// trigger = new TimerTrigger(config);
				trigger = new TimerTrigger2(config);
				break;
			default:
				trigger = new NeverTrigger(config);
				break;
		}
		return trigger;
	}
};

module.exports = Object.freeze(TriggerFactory);
