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
const { MessagingService } = require('@cedalo/service-core');
const {
	GatewayMessagingProtocol,
	GraphServerMessagingProtocol,
	Topics,
	MachineServerMessagingProtocol
} = require('@cedalo/protocols');
const { MonitorManager, RequestHandlers } = require('@cedalo/service-core');
const { logger } = require('@cedalo/logger');

const SheetParserContext = require('../../graph/SheetParserContext');
const GraphManager = require('../../graph/GraphManager');
const GraphMonitor = require('../../graph/GraphMonitor');
const GraphRequestHandlers = require('../handlers/GraphRequestHandlers');

const {
	RepositoryManager,
	MongoDBGraphRepository,
} = require('@cedalo/repository');

const config = require('../../../config/config');

const TOPIC_SERVICE_STREAMS_FUNCTIONS = `${Topics.SERVICES_STREAMS_EVENTS}/functions`;
const graphRepository = new MongoDBGraphRepository(config.mongodb);

RepositoryManager.init({
	graphRepository,
});

module.exports = class GraphService extends MessagingService {
	constructor(metadata) {
		super(metadata);
		this._graphManager = new GraphManager();
		this._monitorManager = new MonitorManager(this.messagingClient, GraphMonitor);
	}

	async handleMessage(topic, message) {
		if (topic.startsWith(Topics.SERVICES_MACHINES_EVENTS)) {
			this._handleMachineServiceEvent(topic, message);
		} else if (topic === Topics.SERVICES_GRAPHS_INPUT) {
			await this._handleGraphServiceInputMessage(message);
		} else if (topic === Topics.SERVICES_GRAPHS_OUTPUT) {
			await this._handleGraphServiceResponseMessage(message);
		} else if (topic === Topics.SERVICES_MACHINES_OUTPUT) {
			await this._handleMachineServiceResponseMessage(message);
		} else if (topic === TOPIC_SERVICE_STREAMS_FUNCTIONS) {
			this._handleStreamsFunctionsMessage(message);
		}
	}

	async _handleGraphServiceResponseMessage(message) {
		// TODO: get graph response from graph service
		// TODO: add verification of request messages
		const { response } = message;
		switch (message.requestType) {
			case GraphServerMessagingProtocol.MESSAGE_TYPES
				.LOAD_SUBSCRIBE_GRAPH_MESSAGE_TYPE:
			case GraphServerMessagingProtocol.MESSAGE_TYPES
				.LOAD_GRAPH_MESSAGE_TYPE:
				logger.debug(
					'PersistenceService: saving graph after loading machine'
				);
				if (response.templateId) {
					try {
						// only save graphs that has been edited already
						// and therefore are already saved in the database
						// await RepositoryManager.graphRepository.findGraph(
						// 	response.graph.id
						// );
						await RepositoryManager.graphRepository.saveGraph(
							response.graph
						);
					} catch (error) {
						return Promise.resolve({});
					}
				}
				break;
			case GraphServerMessagingProtocol.MESSAGE_TYPES
				.CREATE_STREAMSHEET_MESSAGE_TYPE:
				logger.debug(
					'PersistenceService: update graph after creating streamsheet'
				);
				await RepositoryManager.graphRepository.updateGraph(
					response.graph.id,
					response.graph
				);
				break;
			case GraphServerMessagingProtocol.MESSAGE_TYPES
				.DELETE_STREAMSHEET_MESSAGE_TYPE:
				logger.debug(
					'PersistenceService: update graph after deleting streamsheet'
				);
				await RepositoryManager.graphRepository.updateGraph(
					response.graph.id,
					response.graph
				);
				break;
			case GraphServerMessagingProtocol.MESSAGE_TYPES
				.COMMAND_MESSAGE_TYPE:
				logger.debug(
					'PersistenceService: update graph after executed command'
				);
				if (response.command.name !== 'command.SetSelectionCommand') {
					await RepositoryManager.graphRepository.updateGraph(
						response.graph.id,
						response.graph
					);
				}
				break;
			// case GraphServerMessagingProtocol.MESSAGE_TYPES.DELETE_MACHINE_MESSAGE_TYPE:
			// 	logger.debug('PersistenceService: deleting graph after deleting machine');
			// 	await RepositoryManager.graphRepository.deleteGraphByMachineId(
			// 		response.machine.id
			// 	);
			// 	break;
			default:
				break;
		}
		return Promise.resolve({});
	}

	async _handleMachineServiceResponseMessage(message) {
		const { response } = message;
		switch (message.requestType) {
			case MachineServerMessagingProtocol.MESSAGE_TYPES
				.DELETE_MACHINE_MESSAGE_TYPE:
				logger.debug(
					'PersistenceService: deleting graph after deleting machine'
				);
				await RepositoryManager.graphRepository.deleteGraphByMachineId(
					response.machine.id
				);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.UNLOAD_MACHINE_MESSAGE_TYPE: {
				const { machine } = response;
				if (machine) this._graphManager.unloadGraphForMachineId(machine.id);
				break;
			}
			case MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_MACHINE_MESSAGE_TYPE:
			case MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE: {
				const { machine } = response;
				if (machine) SheetParserContext.updateFunctions(machine.functionDefinitions);
				break;
			}
			default:
				break;
		}
		return Promise.resolve({});
	}

	async _handleGraphServiceInputMessage(message) {
		const requestHandler = RequestHandlers.createFor(message, GraphRequestHandlers);
		try {
			const response = await requestHandler.handle(message, this._graphManager, this._monitorManager, RepositoryManager.graphRepository);
			this.publishMessage(Topics.SERVICES_GRAPHS_OUTPUT, response);
		} catch (error) {
			logger.error(`GraphService#handleMessage:Failed to handle request ${message.type}!\\nReason: `, error);
		}
	}

	_handleMachineServiceEvent(topic, message) {
		const event = message.event;
		if (event.type === MachineServerMessagingProtocol.EVENTS.MACHINE_DESCRIPTOR_UPDATE_EVENT) {
			this._graphManager.handleMachineDescriptorUpdate(event);
		} else if (event.type === GatewayMessagingProtocol.EVENTS.MACHINE_STEP_EVENT) {
			event.streamsheets.forEach((streamsheet) => {
				const { cells, graphCells, id, namedCells, drawings, graphItems } = streamsheet;
				this._graphManager.handleStreamSheetStep(
					event.srcId,
					id,
					cells,
					namedCells,
					graphCells,
					drawings,
					graphItems
				);
			});
		} else if (event.type === MachineServerMessagingProtocol.EVENTS.NAMED_CELLS_EVENT) {
			this._graphManager.handleStreamCellsUpdate(event.srcId, event.namedCells);
		}
	}

	_handleStreamsFunctionsMessage({ event = {} }) {
		const { data = {} } = event;
		SheetParserContext.updateFunctions(data.functionDefinitions);
	}

	async _preStart() {
		await super._preStart();
		await RepositoryManager.connectAll();
		await RepositoryManager.setupAllIndicies();
	}

	_getKeepAliveTopic() {
		return Topics.SERVICES_GRAPHS_EVENTS;
	}

	_getKeepAliveMessage() {
		return { type: 'connect', server: 'graphserver' };
	}

	getTopicsToSubscribe() {
		return [
			Topics.SERVICES_GRAPHS_INPUT,
			Topics.SERVICES_GRAPHS_OUTPUT,
			`${Topics.SERVICES_MACHINES_EVENTS}/#`,
			Topics.SERVICES_MACHINES_OUTPUT,
			TOPIC_SERVICE_STREAMS_FUNCTIONS
		];
	}
};
