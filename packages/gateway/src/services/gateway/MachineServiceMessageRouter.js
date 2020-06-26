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
const { MessagingClient } = require('@cedalo/messaging-client');
const { Topics } = require('@cedalo/protocols');
const RoundRobinMap = require('./RoundRobinMap');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
		'Machine Service - MessageRouter',
);

module.exports = class MachineServiceMessageRouter {
	constructor(gatewayService) {
		this._gatewayService = gatewayService;
		this._messagingClient = new MessagingClient();
		this._machineServices = new RoundRobinMap();
		this._machineServiceIterator = this._machineServices.iterator();
		this._machinesToMachineServices = new Map();

		this.messagingClient.connect(process.env.MESSAGE_BROKER_URL || 'mqtt://localhost:1883');
		this.messagingClient.subscribe(Topics.SERVICES_MACHINES_INPUT);
		this.messagingClient.subscribe(`${Topics.SERVICES_STATUS}/#`);
		this.messagingClient.on('message', (topic, message) => {
			this.handleMessage(topic, JSON.parse(message.toString()));
		});
	}

	handleMessage(topic, message) {
		if (topic.startsWith(`${Topics.SERVICES_STATUS}/`)) {
			if (topic.startsWith(`${Topics.SERVICES_STATUS}/machines`)) {
				this.handleMachineServiceUpdate(message);
			}
		} else {
			this.handleMachineServiceInputMessage(message);
		}
	}

	getMachineServiceIdForMachineId(machineId) {
		let machineServiceId = null;
		if (this._machinesToMachineServices.has(machineId)) {
			// machine is already handled by a specific machine service
			machineServiceId = this._machinesToMachineServices.get(machineId);
		} else {
			// machine is not already handled by a specific machine service
			machineServiceId = this.getNextMachineService(machineId);
			if (machineServiceId) {
				this._machinesToMachineServices.set(machineId, machineServiceId);
			}
		}
		return machineServiceId;
	}

	getNextMachineService(/* machineId */) {
		// if (machineId === 'base_machine') {
		// 	// for base machine always return first machine service
		// 	return this._machineServices.keys().next().value;
		// }
		return this._machineServiceIterator.next().value;
	}

	handleMachineServiceUpdate(serviceInformation) {
		if (serviceInformation.status !== 'running') {
			this._machineServices.delete(serviceInformation.id);
			this._machineServiceIterator = this._machineServices.iterator();
			this._removeMachinesForMachineService(serviceInformation.id);
		} else {
			this._machineServices.set(serviceInformation.id, serviceInformation);
			this._machineServiceIterator = this._machineServices.iterator();
		}
	}

	_removeMachinesForMachineService(machineServiceIdToDelete) {
		// eslint-disable-next-line
		for (const [machineId, machineServiceId] of this._machinesToMachineServices) {
			if (machineServiceId === machineServiceIdToDelete) {
				this._machinesToMachineServices.delete(machineId);
			}
		}
	}

	handleMachineServiceInputMessage(message) {
		// TODO: check if machine id is needed for routing
		if (message.machineId || message.machine) {
			// request contains machine id so we need to route to right machine server
			const machineId = message.machineId || message.machine.id;
			if (machineId) {
				const machineServiceId = this.getMachineServiceIdForMachineId(machineId);
				this.messagingClient.publish(`${Topics.SERVICES_MACHINES_INPUT}/${machineServiceId}`, message);
			}
		} else {
			// request does not contain machine id
			// TODO: check whether this request should be send to every machine server
			const machineServiceId = this.getNextMachineService();
			this.messagingClient.publish(`${Topics.SERVICES_MACHINES_INPUT}/${machineServiceId}`, message);
		}
		logger.debug(message);
	}

	get messagingClient() {
		return this._messagingClient;
	}

	get gatewayService() {
		return this._gatewayService;
	}

};
