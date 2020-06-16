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
const logger = require('../utils/logger').create({ name: 'MachineService' });
const { MessagingService, RequestHandlers } = require('@cedalo/service-core');
const { RepositoryManager, MongoDBMachineRepository } = require('@cedalo/repository');
const { MachineServerMessagingProtocol, Topics, GatewayMessagingProtocol } = require('@cedalo/protocols');
const { State } = require('@cedalo/machine-core');

const MachineServer = require('./MachineServer');
const FunctionModulesResolver = require('../utils/FunctionModulesResolver');
const MachineRequestHandlers = require('../handlers/MachineRequestHandlers');
const MachineServerRequestHandlers = require('../handlers/MachineServerRequestHandlers');

const config = require('../../config/config');

const machineRepository = new MongoDBMachineRepository(config.mongodb);

const STREAM_FUNCTIONS_TOPIC = `${Topics.SERVICES_STREAMS_EVENTS}/functions`;

// TODO: remove those helper functions because they are
// already implemented in the MessagingService superclass
const isRequestMessage = (message) => message.type !== 'response' && message.type !== 'event';
const isResponseMessage = (message) => message.type === 'response';
const isEventMessage = (message) => message.type === 'event';

const updateNamedCells = async (repository, response) => {
	const { machineId, namedCells, streamsheetId } = response;
	return streamsheetId != null
		? repository.updateSheetNamedCells(machineId, streamsheetId, namedCells)
		: repository.updateMachineNamedCells(machineId, namedCells);
};

const updateGraphCells = async (repository, response) => {
	const { machineId, graphCells, streamsheetId } = response;
	return repository.updateGraphNamedCells(machineId, streamsheetId, graphCells);
};

const toMapObject = (arr, key = 'name') =>
	arr.reduce((map, val) => {
		map[val[key]] = val;
		delete val[key];
		return map;
	}, {});

const sheetDescriptor = ({ cells, names, graphs }) => ({
	cells: toMapObject(cells, 'reference'),
	namedCells: toMapObject(names),
	graphCells: toMapObject(graphs)
});

module.exports = class MachineService extends MessagingService {
	constructor(metadata) {
		super(metadata);
		this._machineServer = new MachineServer();
		this._init();
		this._loadedRunning = false;
	}

	async _init() {
		try {
			await this._machineServer.start(this);
		} catch (error) {
			logger.error('error while starting machine-server', error);
		}
	}

	async _preStart() {
		// include editable-web-component:
		// RepositoryManager.init({
		// 	graphRepository: new MongoDBGraphRepository(config.mongodb),
		// 	machineRepository: new MongoDBMachineRepository(config.mongodb)
		// });
		// ~

		// delete editable-web-component:
		RepositoryManager.init({
			machineRepository
		});
		// ~

		await RepositoryManager.connectAll();
		await RepositoryManager.setupAllIndicies();
		await FunctionModulesResolver.resolve();
		await super._preStart();
	}

	async _ensureScope() {
		await RepositoryManager.machineRepository.ensureScope({ id: 'root' });
	}

	async _loadRunningMachines() {
		if (!this._loadedRunning) {
			logger.debug('Loading machines with state running');
			// DL-1686: load and start all running machines...
			this._loadedRunning = true;
			const machines = await RepositoryManager.machineRepository.findMachines(
				{
					state: {
						$in: [State.RUNNING, State.PAUSED]
					}
				},
				{},
				{ id: 1, owner: 1 }
			);
			machines.forEach(({ id, metadata }) => {
				const session = { user: { userId: metadata.owner } };
				// include editable-web-component:
				// this._machineServer.loadMachine(id, session);
				// ~

				// remove editable-web-component:
				this._machineServer.loadMachine(id, session, () => RepositoryManager.machineRepository.findMachine(id));
				// ~
			});
		}
	}

	async handleMessage(topic, message) {
		logger.debug(`handle request message: ${message.type}`);
		// this topic is already covered by handleMessage:
		if (topic !== STREAM_FUNCTIONS_TOPIC) {
			if (topic.startsWith(Topics.SERVICES_MACHINES_INPUT)) {
				const requestHandler = RequestHandlers.createFor(
					message,
					MachineRequestHandlers,
					MachineServerRequestHandlers
				);
				try {
					const response = await requestHandler.handle(
						message,
						this._machineServer,
						RepositoryManager
					);
					if (typeof response === 'string') {
						throw new Error(response);
					}
					this.publishMessage(Topics.SERVICES_MACHINES_OUTPUT, response);
				} catch (error) {
					logger.error(
						`MachineService#handleMessage:Failed to handle request ${message.type}!\\nReason: `,
						error
					);
					logger.debug(Array.from(RequestHandlers.singleton.requests.keys()));
					if (error.type !== 'error') {
						const errorMessage = `Machine service failed to handle request ${message.type}!`;
						const errorObject = requestHandler.reject(message, errorMessage);
						errorObject.error.reqType = message.type;
						this.publishMessage(Topics.ERRORS_GLOBAL, errorObject);
					}
				}
			} else if (isRequestMessage(message)) {
				this._handleRequestMessage(topic, message);
			} else if (isResponseMessage(message)) {
				this._handleResponseMessage(topic, message);
			} else if (isEventMessage(message)) {
				this._handleEventMessage(topic, message);
			}
		} else if (topic === STREAM_FUNCTIONS_TOPIC) {
			logger.debug('Received Stream function definitions');
			const functionDefinitions = message.event.data || [];
			this._machineServer.functionDefinitions = functionDefinitions;
			await this._ensureScope();
			this._loadRunningMachines();
		}
	}

	async _handleResponseMessage(topic, message) {
		switch (topic) {
			case Topics.SERVICES_MACHINES_OUTPUT:
				await this._handleMachineServiceResponseMessage(message);
				break;
			default:
				break;
		}
	}

	async _handleRequestMessage(topic, message) {
		switch (topic) {
			case Topics.SERVICES_PERSISTENCE_INPUT:
				switch (message.type) {
					case MachineServerMessagingProtocol.MESSAGE_TYPES.UPDATE_MACHINE_IMAGE_MESSAGE_TYPE:
						// eslint-disable-next-line no-case-declarations
						const { machineId, previewImage } = message;
						if (previewImage !== null && typeof previewImage !== 'undefined') {
							await RepositoryManager.machineRepository.updateMachinePreviewImage(
								machineId,
								previewImage
							);
						}
						this.publishMessage(Topics.SERVICES_PERSISTENCE_EVENTS, {
							requestId: message.requestId,
							machineId,
							type: 'response'
						});
						break;
					case MachineServerMessagingProtocol.MESSAGE_TYPES.UPDATE_MACHINE_TITLE_IMAGE_MESSAGE_TYPE:
						// eslint-disable-next-line no-case-declarations
						const { titleImage } = message;
						if (titleImage !== null && typeof titleImage !== 'undefined') {
							await RepositoryManager.machineRepository.updateMachineTitleImage(
								message.machineId,
								titleImage
							);
						}
						this.publishMessage(Topics.SERVICES_PERSISTENCE_EVENTS, {
							requestId: message.requestId,
							machineId: message.machineId,
							type: 'response'
						});
						break;
					default:
						break;
				}
				break;
			default:
				break;
		}
	}

	async _handleEventMessage(topic, message) {
		const { event } = message;
		switch (event.type) {
			case GatewayMessagingProtocol.EVENTS.STREAM_CONTROL_EVENT: {
				const { streamEventType } = event;
				if (streamEventType && streamEventType === 'UPDATE') {
					if (event.data && event.data.stream) {
						const stream = event.data.stream;
						logger.info(
							`PersistenceService: update all machines with this stream: ${JSON.stringify(stream)}`
						);
						await RepositoryManager.machineRepository.updateStreams(stream);
					}
				}
				break;
			}
			case MachineServerMessagingProtocol.EVENTS.MACHINE_STATE_EVENT:
				logger.info(`PersistenceService: persist new machine state: ${event.state}`);
				await RepositoryManager.machineRepository.updateMachineState(event.srcId, event.state);
				break;
			case MachineServerMessagingProtocol.EVENTS.MACHINE_RENAME_EVENT:
				logger.info(`PersistenceService: persist new machine name: ${event.name}`);
				await RepositoryManager.machineRepository.updateMachineName(event.srcId, event.name);
				break;
			case MachineServerMessagingProtocol.EVENTS.MACHINE_LAST_MODIFIED_EVENT:
				logger.info(`PersistenceService: persist machine last modified: ${event.lastModified}`);
				await RepositoryManager.machineRepository.updateMachineLastModified(
					event.srcId,
					event.lastModified,
					event.lastModifiedBy
				);
				break;
			case MachineServerMessagingProtocol.EVENTS.MACHINE_LOCALE_EVENT:
				logger.info(`PersistenceService: persist new machine locale: ${event.locale}`);
				await RepositoryManager.machineRepository.updateMachineLocale(event.srcId, event.locale);
				break;
			case MachineServerMessagingProtocol.EVENTS.MACHINE_OPCUA_EVENT:
				logger.info(`PersistenceService: persist new machine opcua state: ${event.isOPCUA}`);
				await RepositoryManager.machineRepository.updateMachineOPCUA(event.srcId, event.isOPCUA);
				break;
			case MachineServerMessagingProtocol.EVENTS.NAMED_CELLS_EVENT:
				logger.info(`PersistenceService: persist new machine named cells: ${event.namedCells}`);
				await RepositoryManager.machineRepository.updateMachineNamedCells(event.srcId, event.namedCells);
				break;
			case MachineServerMessagingProtocol.EVENTS.SHEET_CELLS_UPDATE_EVENT:
				logger.info(`PersistenceService: persist new machine cells update: ${event.cells}`);
				await RepositoryManager.machineRepository.partiallyUpdateCells(
					event.machineId,
					event.srcId,
					event.cells
				);
				break;
			case MachineServerMessagingProtocol.EVENTS.SHEET_CELLRANGE_CHANGE_EVENT:
				logger.info('PersistenceService: persist changed sheet cells...');
				await RepositoryManager.machineRepository.updateCells(event.machineId, event.srcId, event.cells);
				break;

			// include editable-web-component:
			// case MachineServerMessagingProtocol.EVENTS.SHEET_UPDATE_EVENT: {
			// 	logger.info('PersistenceService: persist updated sheet...');
			// 	const { machineId, srcId, sheet } = event;
			// 	const { graphCells, namedCells, properties } = sheet;
			// 	await RepositoryManager.machineRepository.updateSheet(
			// 		machineId,
			// 		srcId,
			// 		{ cells: toMapObject(sheet.cells, 'reference'), properties, graphCells, namedCells }
			// 	);
			// 	break;
			// }
			// ~

			default:
				break;
		}
	}

	async _handleMachineServiceResponseMessage(message) {
		const { response } = message;
		switch (message.requestType) {
			case MachineServerMessagingProtocol.MESSAGE_TYPES.START_MACHINE_MESSAGE_TYPE:
			case MachineServerMessagingProtocol.MESSAGE_TYPES.PAUSE_MACHINE_MESSAGE_TYPE:
			case MachineServerMessagingProtocol.MESSAGE_TYPES.STOP_MACHINE_MESSAGE_TYPE:
				logger.info(`PersistenceService: persist new machine state: ${response.machine.state}`);
				await RepositoryManager.machineRepository.updateMachineState(
					response.machine.id,
					response.machine.state
				);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.CREATE_STREAMSHEET_MESSAGE_TYPE:
				logger.debug('PersistenceService: persisting streamsheet');
				await RepositoryManager.machineRepository.addStreamSheet(response.machine.id, response.streamsheet);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.DELETE_STREAMSHEET_MESSAGE_TYPE:
				logger.debug('PersistenceService: deleting streamsheet');
				await RepositoryManager.machineRepository.updateMachine(response.machine.id, response.machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.STREAMSHEET_STREAM_UPDATE_TYPE:
				logger.debug('PersistenceService: updating streamsheet settings');
				await RepositoryManager.machineRepository.updateStreamSheetSettings(
					response.streamsheetId,
					response.machine
				);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.DELETE_MACHINE_MESSAGE_TYPE:
				logger.debug('PersistenceService: deleting machine');
				await RepositoryManager.machineRepository.deleteMachine(response.machine.id);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_SHEET_CELLS:
				logger.debug('PersistenceService: handle load sheet cells');
				await RepositoryManager.machineRepository.updateMachineNamedCells(
					response.machineId,
					toMapObject(response.machineDescriptor.names)
				);
				Object.values(response.machineDescriptor.sheets).forEach(async (sheet) => {
					await RepositoryManager.machineRepository.updateStreamSheet(
						response.machineId,
						sheet.id,
						sheetDescriptor(sheet)
					);
				});
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.SET_GRAPH_CELLS:
				logger.debug('PersistenceService: handle setting graph-cells');
				await updateGraphCells(RepositoryManager.machineRepository, response);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE:
				logger.info(`PersistenceService: persist new machine cycle time: ${response.machine.cycletime}`);
				await RepositoryManager.machineRepository.updateMachineCycleTime(
					response.machine.id,
					response.machine.cycletime
				);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.COMMAND_MESSAGE_TYPE:
				logger.debug('PersistenceService: handle command for machine');
				await this._handleCommandMessage(message);
				break;
			default:
				break;
		}
		return Promise.resolve({});
	}

	// TODO discuss: isn't it enough to handle corresponding events instead of each single command?!
	async _handleCommandMessage(message) {
		const { response } = message;
		switch (response.command) {
			case 'command.DeleteCellsCommand':
			case 'command.DeleteCellContentCommand':
			case 'command.SetCellDataCommand':
			case 'command.SetCellLevelsCommand':
			case 'command.SetCellsCommand':
				await RepositoryManager.machineRepository.updateCells(
					response.machineId,
					response.streamsheetId,
					response.cells
				);
				break;
			case 'command.UpdateSheetNamesCommand':
				await updateNamedCells(RepositoryManager.machineRepository, response);
				break;
			case 'command.SetGraphCellsCommand': {
				const { machineId, streamsheetIds, graphCells } = response;
				streamsheetIds.forEach(async (id, index) => {
					await updateGraphCells(RepositoryManager.machineRepository, {
						machineId,
						streamsheetId: id,
						graphCells: graphCells[index]
					});
				});
				break;
			}
			case 'command.UpdateGraphCellsCommand':
				await updateGraphCells(RepositoryManager.machineRepository, response);
				break;
			default:
				break;
		}
	}

	_applyCreationMetadata(machine) {
		const metadata = machine.metadata || {};
		metadata.createdAt = metadata.createdAt || Date.now();
		metadata.createdBy = metadata.createdBy || this._userId('unknown');
		machine.metadata = metadata;
	}

	_userId(defaultValue) {
		return defaultValue;
	}

	_getKeepAliveTopic() {
		return Topics.SERVICES_MACHINES_EVENTS;
	}

	_getKeepAliveMessage() {
		return { type: 'connect', server: 'machineserver' };
	}

	getTopicsToSubscribe() {
		return [
			`${Topics.SERVICES_MACHINES_INPUT}/${this.id}`,
			STREAM_FUNCTIONS_TOPIC,
			Topics.SERVICES_MACHINES_OUTPUT,
			Topics.SERVICES_PERSISTENCE_INPUT,
			`${Topics.SERVICES_MACHINES_EVENTS}/#`,
			`${Topics.SERVICES_STREAMS_EVENTS}/#`
		];
	}
};
