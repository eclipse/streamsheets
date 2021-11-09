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
const { EventMessage } = require('@cedalo/messages');

const MachineServer = require('./MachineServer');
const FunctionModulesResolver = require('../utils/FunctionModulesResolver');
const MachineRequestHandlers = require('../handlers/MachineRequestHandlers');
const MachineServerRequestHandlers = require('../handlers/MachineServerRequestHandlers');
const { scheduleHealthCheck, buildHealthCheckFailureMessage } = require('./HealthCheck');

const config = require('../../config/config');

// const machineRepository = new MongoDBMachineRepository(config.mongodb);

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

const toMapObject = (arr, key = 'name') =>
	arr ? arr.reduce((map, val) => {
		map[val[key]] = val;
		delete val[key];
		return map;
	}, {}) : {};
const byRef = (obj, cell) => {
	const ref = cell.ref;
	obj[`${ref.col}${ref.row}`] = cell;
	delete cell.ref;
	delete cell.reference;
	return obj;
};
const sheetDescriptor = ({ id, cells, names, namedCells }) => ({
	id,
	cells: toMapObject(cells, 'reference'),
	namedCells: names ? toMapObject(names) : namedCells,
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
			scheduleHealthCheck(this._machineServer, (machineId, lastSuccessfulHealthCheck) => {
				const message = buildHealthCheckFailureMessage(machineId, lastSuccessfulHealthCheck);
				const topic = `${Topics.SERVICES_MACHINES_EVENTS}/${machineId}`;
				this.client.publish(`${topic}/${message.type}`, new EventMessage(message));
			});
		} catch (error) {
			logger.error('error while starting machine-server', error);
		}
	}

	async _preStart() {
		// include serverside-formats:
		RepositoryManager.init({
			// graphRepository: new MongoDBGraphRepository(config.mongodb),
			machineRepository: new MongoDBMachineRepository(config.mongodb)
		});
		// ~

		// delete serverside-formats:
		// RepositoryManager.init({
		// 	machineRepository
		// });
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
					} else {
						this.publishMessage(Topics.SERVICES_MACHINES_OUTPUT, error);
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
			const fnDefinitions = message.event.data || [];
			logger.debug(`Received Stream function definitions: ${fnDefinitions.map((def) => def.name).join(', ')}`);
			this._machineServer.functionDefinitions = fnDefinitions;
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

	async _updateMachineImage(message) {
		try {
			const handler = new MachineRequestHandlers.UpdateMachineImageRequestHandler();
			await handler.handle(message, this._machineServer);
		} catch(err) {
			// e.g. if machine is not open
			// ignore error to store image in DB anyway
		}
	}
	async _storeMachineImage(message) {
		const { machineId, previewImage, titleImage } = message;
		return titleImage
			? RepositoryManager.machineRepository.updateMachineTitleImage(machineId, titleImage)
			: RepositoryManager.machineRepository.updateMachinePreviewImage(machineId, previewImage);
	}
	async _handlePersistenceInput(message) {
		switch (message.type) {
			case MachineServerMessagingProtocol.MESSAGE_TYPES.UPDATE_MACHINE_IMAGE_MESSAGE_TYPE:
			case MachineServerMessagingProtocol.MESSAGE_TYPES.UPDATE_MACHINE_TITLE_IMAGE_MESSAGE_TYPE: {
				const { machineId, previewImage, titleImage, requestId } = message;
				if (titleImage || previewImage) {
					try {
						await this._updateMachineImage(message);
						await this._storeMachineImage(message);
						this.publishMessage(Topics.SERVICES_PERSISTENCE_EVENTS, {
							requestId,
							machineId,
							type: 'response'
						});
					} catch (err) {
						logger.error('Failed to set machine image!', err);
					}
				}
				break;
			}
			default:
				break;
		}
	}
	async _handleRequestMessage(topic, message) {
		switch (topic) {
			case Topics.SERVICES_PERSISTENCE_INPUT:
				await this._handlePersistenceInput(message);
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
				// DL-4530 if streamsheets property provided we save it
				if (event.streamsheets) {
					// map input to match updateStreamSheets:
					const streamsheets = Object.values(event.streamsheets).map((streamsheet) =>
						sheetDescriptor(streamsheet)
					);
					await RepositoryManager.machineRepository.updateStreamSheets(event.srcId, streamsheets);
				}
				break;
			case MachineServerMessagingProtocol.EVENTS.MACHINE_RENAME_EVENT:
				logger.info(`PersistenceService: persist new machine name: ${event.name}`);
				await RepositoryManager.machineRepository.updateMachineName(event.srcId, event.name);
				break;
			case MachineServerMessagingProtocol.EVENTS.MACHINE_VIEW_SETTINGS_EVENT:
				logger.info(`PersistenceService: persist new machine view`);
				await RepositoryManager.machineRepository.updateMachineView(event.srcId, event.view);
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
			case MachineServerMessagingProtocol.EVENTS.MACHINE_EXTENSION_SETTINGS_EVENT:
				logger.info(`PersistenceService: persist new machine extension settings for extension "${event.extensionId}": ${event.settings}`);
				await RepositoryManager.machineRepository.updateMachineExtensionSettings(event.srcId, event.extensionId, event.settings);
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
			default:
				break;
		}
	}

	async _handleMachineServiceResponseMessage(message) {
		const { response } = message;
		switch (message.requestType) {
			case MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_MACHINE_MESSAGE_TYPE:
			case MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE:
				if (response.initialLoad) {
					logger.debug('PersistenceService: save machine after load');
					await RepositoryManager.machineRepository.updateMachine(response.machine.id, response.machine);
				}
				break;
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
			case MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_SHEET_CELLS: {
				logger.debug('PersistenceService: handle load sheet cells');
				const { machineId, machineDescriptor } = response;
				await RepositoryManager.machineRepository.updateMachineNamedCells(
					machineId,
					toMapObject(machineDescriptor.names)
				);
				// map input to match updateStreamSheets:
				const streamsheets = Object.values(machineDescriptor.sheets).map((sheet) => sheetDescriptor(sheet));
				await RepositoryManager.machineRepository.updateStreamSheets(machineId, streamsheets);
				break;
			}
			case MachineServerMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE:
				logger.info(`PersistenceService: persist new machine cycle time: ${response.machine.cycletime}`);
				await RepositoryManager.machineRepository.updateMachineCycleTime(
					response.machine.id,
					response.machine.cycletime
				);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.COMMAND_MESSAGE_TYPE:
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
			// currently not handled by machine-server!
			// case 'command.DeleteCellsCommand':
			case 'command.DeleteCellContentCommand':
			case 'command.SetCellDataCommand':
			case 'command.SetCellLevelsCommand':
			case 'command.SetCellsCommand':
				logger.debug('PersistenceService: update cells');
				await RepositoryManager.machineRepository.updateCells(
					response.machineId,
					response.streamsheetId,
					response.cells
				);
				break;
			case 'command.SetGraphItemsCommand':
				logger.debug('PersistenceService: update shapes');
				await RepositoryManager.machineRepository.updateShapes(
					response.machineId,
					response.streamsheetIds,
					response.shapes
				);
				break;
			case 'command.UpdateSheetNamesCommand':
				logger.debug('PersistenceService: update named cells');
				await updateNamedCells(RepositoryManager.machineRepository, response);
				break;
			// SERVER_COMMANDS:
			case 'command.server.DeleteCellsCommand':
			case 'command.server.PasteCellsCommand':
			case 'command.server.SetCellsCommand':
			case 'command.server.SetCellLevelsCommand':
			case 'command.server.SetCellsPropertiesCommand': {
				logger.info(`PersistenceService: persist on server command ${response.command}`);
				// const { machineId, srcId, sheet } = event;
				// const { cells, graphCells, namedCells, properties } = sheet;
				// const _cells = cells.length && cells[0].ref ? cells.reduce(byRef, {}) : toMapObject(cells, 'reference');
				// await RepositoryManager.machineRepository.updateSheet(
				// 	machineId,
				// 	srcId,
				// 	// { cells: toMapObject(cells, 'reference'), properties, graphCells, namedCells }
				// 	{ cells: _cells, properties, graphCells, namedCells }
				// );
				break;
			}
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
