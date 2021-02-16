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
const ExecuteTrigger = require('./ExecuteTrigger');
const MachineStartTrigger = require('./MachineStartTrigger');
const MachineStopTrigger = require('./MachineStopTrigger');
const NeverTrigger = require('./NeverTrigger');
const OneTimeTrigger = require('./OneTimeTrigger');
const OnMessageTrigger = require('./OnMessageTrigger');
const TimerTrigger = require('./TimerTrigger');

const TYPE = {
	ARRIVAL: OnMessageTrigger.TYPE,
	CONTINUOUSLY: ContinuousTrigger.TYPE,
	EXECUTE: ExecuteTrigger.TYPE,
	MACHINE_START: MachineStartTrigger.TYPE,
	MACHINE_STOP: MachineStopTrigger.TYPE,
	NONE: NeverTrigger.TYPE,
	ONCE: OneTimeTrigger.TYPE,
	RANDOM: TimerTrigger.TYPE_RANDOM,
	TIMER: TimerTrigger.TYPE_TIME
};
const TriggerFactory = {
	TYPE,
	create(config = {}) {
		let trigger;
		config.type = config.type || TYPE.ARRIVAL;
		switch (config.type) {
			case TYPE.ARRIVAL:
				trigger = new OnMessageTrigger(config);
				break;
			case TYPE.CONTINUOUSLY:
				trigger = new ContinuousTrigger(config);
				break;
			case TYPE.EXECUTE:
				trigger = new ExecuteTrigger(config);
				break;
			case TYPE.MACHINE_START:
				trigger = new MachineStartTrigger(config);
				break;
			case TYPE.MACHINE_STOP:
				trigger = new MachineStopTrigger(config);
				break;
			case TYPE.NONE:
				trigger = new NeverTrigger(config);
				break;
			case TYPE.ONCE:
				trigger = new OneTimeTrigger(config);
				break;
			case TYPE.RANDOM:
			case TYPE.TIMER:
				trigger = new TimerTrigger(config);
				break;
			default:
				trigger = new NeverTrigger(config);
				break;
		}
		return trigger;
	}
};

module.exports = Object.freeze(TriggerFactory);
