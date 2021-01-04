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
const MachineTrigger = require('./MachineTrigger');
const NeverTrigger = require('./NeverTrigger');
const OnMessageTrigger = require('./OnMessageTrigger');
const TimerTrigger = require('./TimerTrigger');
const TriggerFactory = require('./TriggerFactory');

module.exports = {
	ContinuousTrigger,
	ExecuteTrigger,
	MachineTrigger,
	NeverTrigger,
	OnMessageTrigger,
	TimerTrigger,
	TriggerFactory
};
