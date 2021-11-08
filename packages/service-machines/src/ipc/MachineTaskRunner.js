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
const zlib = require('zlib');
const { Channel, ChannelRequestHandler, MachineTaskFile, State } = require('@cedalo/machine-core');
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
	static with(options = {}) {
		const task = fork(MachineTaskFile, forkArgs(options.machineArgs), forkOptions(options.execArgs));
		try {
			return new MachineTaskRunner(task, options);
		} catch (err) {
			task.kill(9);
			logger.error('Failed to create new MachineTaskRunner!', err);
		}
		return undefined;
	}
	constructor(task, options) {
		this._id = undefined;
		this.name = undefined;
		this.isOPCUA = false;
		this.state = State.STOPPED;
		this.channel = Channel.create(task, { logger });
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
	async dispose(deleted) {
		this.streams.dispose();
		this.taskObserver.dispose();
		this.requestHandler.dispose();
		// deleted signals to remove outbox storage too
		this.channel.send({ cmd: 'shutdown', deleted });
		if (this.onDispose) {
			this.onDispose();
			this.onDispose = undefined;
		}
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
		// return this.requestHandler.request({ request: 'definition' });
		const zipped = await this.requestHandler.request({ request: 'definition' });
		const zippedBuffer = Buffer.from(zipped.data);
		return new Promise((resolve, reject) => {
			zlib.unzip(zippedBuffer, (err, buf) => (err ? reject(err) : resolve(JSON.parse(buf.toString('utf8')))));
		});
	}

	async start() {
		return this.requestHandler.request({ request: 'start' });
	}

	async stop() {
		return this.requestHandler.request({ request: 'stop' });
	}

	async subscribe(clientId) {
		return this.requestHandler.request({ request: 'subscribe', clientId });
	}

	async unsubscribe(clientId) {
		return this.requestHandler.request({ request: 'unsubscribe', clientId });
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
		return this.requestHandler.request({
			request: 'loadFunctions',
			functionDefinitions
		});
	}

	async shutdown(deleted = false) {
		await this.stop();
		await this.dispose(deleted);
	}
}

const createRunner = (options) => {
	try {
		return MachineTaskRunner.with(options);
	} catch (err) {
		logger.error('Failed to create new MachineTaskRunner!', err);
	}
	return undefined;
};
const loadFunctions = async (runner) => {
	try {
		const modules = FunctionModulesResolver.getModules();
		await runner.request('registerFunctionModules', undefined, { modules });
		await runner.request('registerStreams', undefined, { descriptors: StreamManager.getDescriptors() });
		return runner;
	} catch (err) {
		logger.error('Failed to load functions for new machine! Shutdown machine...', err);
		await runner.shutdown();
	}
	return undefined;
};
// returns creates a new machine runner for specified machine definition
const create = async (runneropts) => {
	logger.info('create new MachineTaskRunner...');
	const runner = createRunner(runneropts);
	return runner ? loadFunctions(runner) : runner;
};

module.exports = {
	create
};
