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
const {
	ContinuousTrigger,
	ExecuteTrigger,
	Machine,
	Message,
	NeverTrigger,
	StreamSheet,
	TriggerFactory
} = require('../../..');
const { createCellAt, expectValue, monitorMachine, monitorStreamSheet, wait } = require('../../utils');

const addOutboxMessage = (machine, message) => {
	message = message || new Message({ outbox: true });
	machine.outbox.put(message);
	return message.id;
};

const setup = ({ switched = false } = {}) => {
	const machine = new Machine();
	const s1 = new StreamSheet({ name: 'S1' });
	const s2 = new StreamSheet({ name: 'S2' });
	s1.trigger = switched ? new ExecuteTrigger() : new ContinuousTrigger();
	s2.trigger = switched ? new ContinuousTrigger() : new ExecuteTrigger();
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.addStreamSheet(s2);
	machine.cycletime = 50;
	return { machine, s1, s2 };
};

describe('ExecuteTrigger', () => {});
