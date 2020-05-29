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
const Channel = require('./Channel');
const Machine = require('../machine/Machine');
const MachineTaskMonitor = require('./MachineTaskMonitor');
const MachineTaskRequestHandler = require('./MachineTaskRequestHandler');
const MachineTaskMessagingClient = require('./MachineTaskMessagingClient');
const Streams = require('../streams/Streams');
const logger = require('../logger').create({ name: 'MachineTask' });

const argvalue = (key, argv) => {
	let value = argv.find(el => `${el}`.startsWith(key));
	if (value) {
		value = value.split(' ')[1];
	}
	return value;
};
const createMachine = () => {
	const machine = new Machine();
	machine.owner = argvalue('--owner', process.argv);
	machine.metadata.lastModifiedBy = machine.owner;
	return machine;
};
const channel = Channel.create(process);
const machine = createMachine();
const monitor = new MachineTaskMonitor(machine, channel);
const requestHandler = new MachineTaskRequestHandler(monitor, channel);
MachineTaskMessagingClient.register(machine);

const shutdown = () => {
	monitor.dispose();
	requestHandler.dispose();
	Streams.dispose(machine);
	MachineTaskMessagingClient.dispose();
	channel.exit();
};

const handleCommand = (message) => {
	switch (message.cmd) {
	case 'shutdown':
		logger.info(`shutdown machine: ${machine.id}...`);
		shutdown();
		break;
	default:
		logger.error(`Unknown command: ${message.cmd}`);
	}
};

// IPC EVENT HANDLING
process.on('message', (msg) => {
	if (msg.cmd) {
		handleCommand(msg);
	}
});
