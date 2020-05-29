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
const { RequestHandler } = require('@cedalo/service-core');
const { MachineServerMessagingProtocol } = require('@cedalo/protocols');
const logger = require('../utils/logger').create({
	name: 'MachineServerRequestHandlers'
});

class MachinesRequestHandler extends RequestHandler {
	constructor() {
		super(
			MachineServerMessagingProtocol.MESSAGE_TYPES
				.GET_MACHINES_MESSAGE_TYPE
		);
	}

	handle(request, machineserver) {
		logger.info('request machines...');
		return new Promise((resolve, reject) => {
			if (machineserver) {
				Promise.all(
					Array.from(machineserver.machinerunners.values()).map(
						(runner) => runner.getDefinition()
					)
				)
					.then((definitions) => {
						logger.info(
							`request machines => resolve! machines: ${
								definitions.length
							}`
						);
						resolve(
							this.confirm(request, {
								machines: definitions.map((def) => def.machine)
							})
						);
					})
					.catch((err) => {
						logger.info(
							'Error during request all machine definitions!!',
							err
						);
						reject(
							this.reject(
								request,
								`Error while requesting machine definitions: '${err.toString()}'`
							)
						);
					});
			} else {
				logger.info('request machines => rejected! not connected!');
				reject(
					this.reject(request, 'Not connected to machine-server.')
				);
			}
		});
	}
}

class LoadRequestHandler extends RequestHandler {
	constructor() {
		super('machineserver_load');
	}

	handle(request, machineserver) {
		if (!machineserver) {
			Promise.reject(
				this.reject(request, 'Not connected to machine-server.')
			);
		}
		let machineDefinitions = request.definitions;
		if (!Array.isArray(machineDefinitions)) {
			machineDefinitions = [machineDefinitions];
		}
		return new Promise((resolve, reject) => {
			try {
				machineDefinitions.forEach((def) =>
					machineserver.loadMachine(def)
				);
				logger.info(
					`loadRequestHandler: loaded machines definitions ${
						machineDefinitions.length
					}`
				);
				resolve(this.confirm(request, {}));
			} catch (err) {
				logger.info('loadRequestHandler: Load failed!\\nReason: ', err);
				reject(err);
			}
		});
	}
}


module.exports = {
	MachinesRequestHandler,
	LoadRequestHandler
};
