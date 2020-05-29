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
const fork = require('child_process').fork;
const {
	Channel,
	ChannelRequestHandler,
	MachineTaskFile,
	State
} = require('@cedalo/machine-core');
const StreamManager = require('../managers/StreamManager');
const MachineTaskStreams = require('./MachineTaskStreams');
const MachineTaskObserver = require('./MachineTaskObserver');
const FunctionModulesResolver = require('../utils/FunctionModulesResolver');
const logger = require('../utils/logger').create({ name: 'MachineTaskRunner' });

// REVIEW: check if port is unused...
let PORT = 9228;
const port = () => {
	PORT += 1;
	return PORT;
};

const userId = (session) => (session.user ? session.user.userId : null);

const forkArgs = (options) => {
	const args = [];
	const ownerId = userId(options.session || {}) || 'anon';
	if (ownerId) args.push(`--owner ${ownerId}`);
	if (options.log) args.push(`--log ${options.log}`);
	return args;
};
const forkOptions = (options) => ({
	execArgv: options.debug ? [`--inspect=${port()}`] : undefined
});

class MachineTaskRunner {
	constructor(options = {}) {
		const task = fork(
			MachineTaskFile,
			forkArgs(options.machineArgs),
			forkOptions(options.execArgs)
		);
		this._id = undefined;
		this.name = undefined;
		this.isOPCUA = false;
		this.state = State.STOPPED;
		this.channel = Channel.create(task);
		this.options = Object.assign({}, options);
		this.streams = new MachineTaskStreams(this.channel);
		this.taskObserver = new MachineTaskObserver(this);
		this.requestHandler = new ChannelRequestHandler(this.channel);
		// dispose handler...
		this.onDispose = undefined;
	}

	get id() {
		return this._id;
	}

	// MACHINE SERVER API:
	async dispose() {
		this.streams.dispose();
		this.taskObserver.dispose();
		this.requestHandler.dispose();
		this.channel.send({ cmd: 'shutdown' });
		if (this.onDispose) this.onDispose();
	}

	async request(type, usrId, props = {}) {
		switch (type) {
			case 'subscribe':
				return this.subscribe(props.clientId);
			case 'unsubscribe':
				return this.unsubscribe(props.clientId);
			default:
				return this.requestHandler.request({ request: type, userId: usrId, ...props });
		}
	}

	async getDefinition() {
		return this.requestHandler.request({ request: 'definition' });
	}

	async start() {
		return this.requestHandler.request({ request: 'start' });
	}

	async stop() {
		return this.requestHandler.request({ request: 'stop' });
	}

	async subscribe(/* clientId */) {
		return this.requestHandler.request({ request: 'subscribe' });
	}

	async unsubscribe(/* clientId */) {
		return this.requestHandler.request({ request: 'unsubscribe' });
	}

	async load(machineDefinition, functionDefinitions) {
		const result = await this.requestHandler.request({
			request: 'load',
			machineDefinition,
			functionDefinitions
		});
		const machine = result.machine;
		this._id = machine.id || this._id;
		this.isOPCUA = machine.isOPCUA;
		this.name = machine.name;
		this.state = machine.state;
		return result;
	}

	async loadFunctions(functionDefinitions) {
		this.requestHandler.request({
			request: 'loadFunctions',
			functionDefinitions
		});
	}
}

// returns creates a new machine runner for specified machine definition
const create = async (runneropts) => {
	logger.info('create new MachineTaskRunner...');
	const runner = new MachineTaskRunner(runneropts);
	await runner.request('registerFunctionModules', undefined, {modules: FunctionModulesResolver.getModules() });
	await runner.request('registerStreams', undefined, { descriptors: StreamManager.getDescriptors() });
	return runner;
};

module.exports = {
	create
};
