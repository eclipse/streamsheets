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
// include editable-web-component:
// const GraphImporter = require('./GraphImporter');
// const { RepositoryManager } = require('@cedalo/repository');
// const logger = require('../utils/logger').create({ name: 'MachineServer' });
// ~

const MachineTaskRunner = require('../ipc/MachineTaskRunner');
const LOG_LEVEL = require('../utils/logger').level;

const isDebug = process.execArgv.join().includes('inspect');

// include editable-web-component:
// const loadGraphDefinition = async (machineId) => {
// 	const { graphRepository } = RepositoryManager;
// 	try {
// 		const { graphdef } = await graphRepository.findGraphByMachineId(machineId);
// 		return graphdef;
// 	} catch (err) {
// 		logger.error(
// 			`Error while loading graph-definition or none available for machine with id: ${machineId}`,
// 			err
// 		);
// 	}
// 	return undefined;
// };
// const isEmptyObj = (obj) => obj == null || Object.keys(obj).length === 0;
// const adjustProperties = (toProperties = {}, fromProperties = {}) => {
// 	if (isEmptyObj(toProperties.sheet)) toProperties.sheet = fromProperties.sheet;
// 	if (isEmptyObj(toProperties.cells)) toProperties.cells = fromProperties.cells;
// 	if (isEmptyObj(toProperties.cols)) toProperties.cols = fromProperties.cols;
// 	if (isEmptyObj(toProperties.rows)) toProperties.rows = fromProperties.rows;
// 	return toProperties;
// };
// const loadMachineDefinition = async (machineId) => {
// 	// tmp. load properties from old graph definition:
// 	const { machineRepository } = RepositoryManager;
// 	const graphdef = await loadGraphDefinition(machineId);
// 	const machinedef = await machineRepository.findMachine(machineId);
// 	if (graphdef) {
// 		const properties = GraphImporter.propertiesFrom(graphdef);
// 		machinedef.streamsheets.forEach(({ id, sheet }) => {
// 			sheet.properties = adjustProperties(sheet.properties, properties.get(id));
// 		});
// 	}
// 	return machinedef;
// };
// ~

/**
 * A class representing a machine server that manages different machines.
 *
 * @class MachineServer
 * @public
 */
module.exports = class MachineServer {
	constructor() {
		this.machinerunners = new Map();
		this.machineservice = undefined;
		// prevent creating same machine twice on simultaneously requests
		this._pendingLoads = new Map();
		this._functionDefinitions = [];
	}

	start(service) {
		this.machineservice = service;
		// currently nothing to do, may change...
		return Promise.resolve();
	}

	shutdown() {
		const promises = [];
		this.machinerunners.forEach((runner) => promises.push(runner.dispose()));
		return Promise.all(promises);
	}

	startMachines() {
		const promises = [];
		this.machinerunners.forEach((runner) => promises.push(runner.start()));
		return Promise.all(promises);
	}

	stopMachines() {
		const promises = [];
		this.machinerunners.forEach((runner) => promises.push(this._doRemoveMachine(runner)));
		return Promise.all(promises);
	}

	getMachineRunner(id) {
		return this.machinerunners.get(id);
	}

	isMachineLoaded(id) {
		return this.machinerunners.has(id);
	}

	async openMachine(machineId, session, loadMachineDefinition) {
		if (!this.isMachineLoaded(machineId)) await this.loadMachine(machineId, session, loadMachineDefinition);
		return true;
	}

	// delete editable-web-component
	async loadMachine(machineId, session, loadMachineDefinition) {
		let result;
		if (this.isMachineLoaded(machineId)) {
			// we simply return definition from running machine...
			const runner = this.getMachineRunner(machineId);
			result = await runner.getDefinition();
		} else {
			const definition = await loadMachineDefinition();
			result = await this._doLoadMachine(definition, session);
			result.initialLoad = true;
		}
		result.machine.metadata.machineservice = {
			id: this.machineservice.id
		};
		return result;
	}
	// ~
	async applyMigrations(machineId, session, migrations) {
		const runner = this.getMachineRunner(machineId);
		if (runner) {
			const user = session && session.user;
			const userId = user && user.userId;
			return runner.request('applyMigrations', userId, migrations);
		}
		return new Error(`Unknown machine with id: ${machineId}`);
	}

	_doLoadMachine(definition, session) {
		if (!this._pendingLoads.has(definition.id)) {
			const promise = new Promise(async (resolve, reject) => {
				// create a new runner and load definition
				const options = {
					service: this.machineservice,
					execArgs: { debug: isDebug },
					machineArgs: { session, log: LOG_LEVEL }
				};
				const runner = await MachineTaskRunner.create(options);
				if (runner) {
					try {
						const result = await runner.load(definition, this._functionDefinitions);
						runner.onDispose = () => {
							this.machinerunners.delete(runner.id);
							runner.onDispose = undefined;
						};
						this.machinerunners.set(runner.id, runner);
						// additionally pass template ID if machine was newly created...
						result.templateId = runner.id !== definition.id ? definition.id : undefined;
						resolve(result);
					} catch (err) {
						await runner.shutdown();
						reject(err);
					} finally {
						this._pendingLoads.delete(definition.id);
					}
				} else {
					reject(
						new Error(
							`Failed to create new MachineTaskRunner for machine ${definition.name}(${definition.id})`
						)
					);
				}
			});
			this._pendingLoads.set(definition.id, promise);
		}
		return this._pendingLoads.get(definition.id);
	}

	// stops machine and removes it. returns a promise...
	async unloadMachine({ machine }) {
		const { id, deleted } = machine;
		const runner = this.getMachineRunner(id);
		return runner && this._doRemoveMachine(runner, deleted);
	}
	async _doRemoveMachine(runner, deleted) {
		await runner.shutdown(deleted);
		this.machinerunners.delete(runner.id);
		return true; // always return true => runner might be removed from map during dispose...
	}

	set functionDefinitions(functionDefinitions) {
		this._functionDefinitions = functionDefinitions || [];
		this.machinerunners.forEach((runner) => {
			runner.loadFunctions(functionDefinitions);
		});
	}

	snapshot() {}
};
