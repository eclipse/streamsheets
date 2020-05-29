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
'use strict';

const GatewayAPI = require('./GatewayAPI');
const {
	// Graph requests
	CreateGraphWebSocketRequest,
	LoadGraphWebSocketRequest,
	SubscribeGraphWebSocketRequest,
	UnsubscribeGraphWebSocketRequest,
	// Machine requests
	AddInboxMessageWebSocketRequest,
	CreateStreamSheetWebSocketRequest,
	DeleteMachineWebSocketRequest,
	DeleteStreamSheetWebSocketRequest,
	GetMachineWebSocketRequest,
	GetMachinesWebSocketRequest,
	LoadMachineWebSocketRequest,
	LoadSubscribeMachineWebSocketRequest,
	PauseMachineWebSocketRequest,
	RenameMachineWebSocketRequest,
	UpdateMachineImageWebSocketRequest,
	UpdateMachineTitleImageWebSocketRequest,
	UpdateStreamSheetStreamsWebSocketRequest,
	SaveMachineAsWebSocketRequest,
	SetCycleTimeWebSocketRequest,
	SetMachineLocaleWebSocketRequest,
	SetNamedCellsWebSocketRequest,
	SetStreamSheetStepIntervalWebSocketRequest,
	ConfirmProcessedMachineStepRequest,
	StartMachineWebSocketRequest,
	StartMachinesWebSocketRequest,
	StepMachineWebSocketRequest,
	StopMachineWebSocketRequest,
	StopMachinesWebSocketRequest,
	SubscribeMachineWebSocketRequest,
	RedoWebSocketRequest,
	UndoWebSocketRequest,
	UnsubscribeMachineWebSocketRequest,
	UpdateMachineSettingsWebSocketRequest,
	// General requests
	CommandWebSocketRequest,
	UserGetSocketRequest,
	UserSaveSocketRequest,
	UserSettingGetSocketRequest,
	UserSettingsSaveSocketRequest,
	DSConfigurationSaveSocketRequest,
	DSConfigurationLoadAllSocketRequest,
	DSConfigurationDeleteSocketRequest,
	DSReloadSocketRequest,
	UserLoginSocketRequest,
	UserLogoutSocketRequest,
	UnloadMachineWebSocketRequest,
	AuthEntityCreateSocketRequest,
	AuthEntityDeleteSocketRequest,
	AuthEntityUpdateSocketRequest,
	AuthEntityGetSocketRequest,
	StreamCommandSocketRequest
} = require('../../requests/sockets/WebSocketRequests');

const deletePendingRequest = (requestId, requests) => {
	const request = requests.get(requestId);
	if (request) {
		clearTimeout(request.timeoutId);
		requests.delete(requestId);
	}
	return request;
};
const timeoutHandler = (requestId, requests) => {
	const { reject } = deletePendingRequest(requestId, requests);
	reject({
		message: 'Timeout',
		requestId
	});
};

module.exports = class WebSocketGatewayAPI extends GatewayAPI {
	constructor(ws, logger) {
		super(logger);
		this._ws = ws;
		this._requests = new Map();
		// TODO: make timeout configurable
		// request timeout in ms:
		this._timeout = 20000;
	}

	/**
	 * ******************************************************************************************
	 * High Level API: Web Socket API
	 * ******************************************************************************************
	 */

	executeStreamCommand(scope, cmd) {
		return this.sendRequest(new StreamCommandSocketRequest(this._ws, scope, cmd));
	}

	saveDSConfiguration(scope, configuration) {
		return this.sendRequest(
			new DSConfigurationSaveSocketRequest(this._ws, scope, configuration)
		);
	}

	loadAllDSConfigurations(scope) {
		return this.sendRequest(
			new DSConfigurationLoadAllSocketRequest(this._ws, scope)
		);
	}

	deleteDSConfiguration(scope, configId) {
		return this.sendRequest(
			new DSConfigurationDeleteSocketRequest(this._ws, scope, configId)
		);
	}

	reloadStreams(scope, sources = []) {
		return this.sendRequest(new DSReloadSocketRequest(this._ws, scope, sources));
	}

	login(credentials) {
		return this.sendRequest(
			new UserLoginSocketRequest(this._ws, credentials)
		);
	}

	logout(id) {
		return this.sendRequest(new UserLogoutSocketRequest(this._ws, id));
	}

	authEntityGet(entity) {
		return this.sendRequest(
			new AuthEntityGetSocketRequest(this._ws, entity)
		);
	}

	authEntityCreate(entity) {
		return this.sendRequest(
			new AuthEntityCreateSocketRequest(this._ws, entity)
		);
	}

	authEntityDelete(entity) {
		return this.sendRequest(
			new AuthEntityDeleteSocketRequest(this._ws, entity)
		);
	}

	authEntityUpdate(entity) {
		return this.sendRequest(
			new AuthEntityUpdateSocketRequest(this._ws, entity)
		);
	}

	getUserSettings(userId) {
		return this.sendRequest(
			new UserSettingGetSocketRequest(this._ws, userId)
		);
	}

	saveUserSettings(userId, settings) {
		return this.sendRequest(
			new UserSettingsSaveSocketRequest(this._ws, userId, settings)
		);
	}

	getUser(userId) {
		return this.sendRequest(new UserGetSocketRequest(this._ws, userId));
	}

	saveUser(user) {
		return this.sendRequest(new UserSaveSocketRequest(this._ws, user));
	}

	getMachine(machineId) {
		return this.sendRequest(
			new GetMachineWebSocketRequest(this._ws, machineId)
		);
	}

	getMachines() {
		return this.sendRequest(new GetMachinesWebSocketRequest(this._ws));
	}

	deleteMachine(machineId) {
		return this.sendRequest(
			new DeleteMachineWebSocketRequest(this._ws, machineId)
		);
	}

	createGraph() {
		return this.sendRequest(new CreateGraphWebSocketRequest(this._ws));
	}

	loadGraph(graphId) {
		return this.sendRequest(
			new LoadGraphWebSocketRequest(this._ws, graphId)
		);
	}

	subscribeGraph(graphId) {
		return this.sendRequest(
			new SubscribeGraphWebSocketRequest(this._ws, graphId)
		);
	}

	unsubscribeGraph(graphId) {
		return this.sendRequest(
			new UnsubscribeGraphWebSocketRequest(this._ws, graphId)
		);
	}

	sendSelection(/* selection */) {
		// TODO: implement
	}

	loadMachine(machineId, settings) {
		return this.sendRequest(
			new LoadMachineWebSocketRequest(this._ws, machineId, settings),
			180000
		);
	}

	unloadMachine(machineId) {
		return this.sendRequest(
			new UnloadMachineWebSocketRequest(this._ws, machineId)
			);
	}

	loadSubscribeMachine(machineId, settings, scope) {
		return this.sendRequest(
			new LoadSubscribeMachineWebSocketRequest(this._ws, machineId, settings, scope),
			180000
		);
	}

	pauseMachine(machineId) {
		return this.sendRequest(
			new PauseMachineWebSocketRequest(this._ws, machineId)
		);
	}

	updateMachineImage(machineId, previewImage) {
		return this.sendRequest(
			new UpdateMachineImageWebSocketRequest(
				this._ws,
				machineId,
				previewImage
			)
		);
	}

	updateMachineTitleImage(machineId, titleImage) {
		return this.sendRequest(
			new UpdateMachineTitleImageWebSocketRequest(
				this._ws,
				machineId,
				titleImage
			)
		);
	}

	renameMachine(machineId, newName) {
		return this.sendRequest(
			new RenameMachineWebSocketRequest(this._ws, machineId, newName)
		);
	}

	updateNamedCells(machineId, streamsheetId, namedCells) {
		return this.sendRequest(
			new SetNamedCellsWebSocketRequest(
				this._ws,
				machineId,
				streamsheetId,
				namedCells
			)
		);
	}

	addInboxMessage(machineId, streamsheetId, message, metadata) {
		return this.sendRequest(
			new AddInboxMessageWebSocketRequest(
				this._ws,
				machineId,
				streamsheetId,
				message,
				metadata
			)
		);
	}

	createStreamSheet(machineId, activeItemId, position) {
		return this.sendRequest(
			new CreateStreamSheetWebSocketRequest(
				this._ws,
				machineId,
				activeItemId,
				position
			)
		);
	}

	deleteStreamSheet(machineId, streamsheetId) {
		return this.sendRequest(
			new DeleteStreamSheetWebSocketRequest(
				this._ws,
				machineId,
				streamsheetId
			)
		);
	}

	updateStreamSheetStreams(machineId, streamsheetId, streams) {
		return this.sendRequest(
			new UpdateStreamSheetStreamsWebSocketRequest(
				this._ws,
				machineId,
				streamsheetId,
				streams
			)
		);
	}

	setCycleTime(machineId, cycleTime) {
		return this.sendRequest(
			new SetCycleTimeWebSocketRequest(this._ws, machineId, cycleTime)
		);
	}

	setMachineLocale(machineId, locale) {
		return this.sendRequest(
			new SetMachineLocaleWebSocketRequest(this._ws, machineId, locale)
		);
	}

	setStreamSheetStepInterval(machineId, streamsheetStepInterval) {
		return this.sendRequest(
			new SetStreamSheetStepIntervalWebSocketRequest(
				this._ws,
				machineId,
				streamsheetStepInterval
			)
		);
	}

	confirmProcessedMachineStep(machineId) {
		return this.sendRequest(
			new ConfirmProcessedMachineStepRequest(this._ws, machineId)
		);
	}

	startMachine(machineId) {
		return this.sendRequest(
			new StartMachineWebSocketRequest(this._ws, machineId)
		);
	}

	startMachines() {
		return this.sendRequest(new StartMachinesWebSocketRequest(this._ws));
	}

	stepMachine(machineId) {
		return this.sendRequest(
			new StepMachineWebSocketRequest(this._ws, machineId)
		);
	}

	stopMachine(machineId) {
		return this.sendRequest(
			new StopMachineWebSocketRequest(this._ws, machineId)
		);
	}

	stopMachines() {
		return this.sendRequest(new StopMachinesWebSocketRequest(this._ws));
	}

	subscribeMachine(machineId) {
		return this.sendRequest(
			new SubscribeMachineWebSocketRequest(this._ws, machineId),
			180000
		);
	}

	redo(machineId) {
		return this.sendRequest(new RedoWebSocketRequest(this._ws, machineId));
	}

	undo(machineId) {
		return this.sendRequest(new UndoWebSocketRequest(this._ws, machineId));
	}

	unsubscribeMachine(machineId) {
		return this.sendRequest(
			new UnsubscribeMachineWebSocketRequest(this._ws, machineId)
		);
	}

	updateMachineSettings(machineId, settings) {
		return this.sendRequest(
			new UpdateMachineSettingsWebSocketRequest(
				this._ws,
				machineId,
				settings
			)
		);
	}

	saveMachineAs(originalMachineId, newName) {
		return this.sendRequest(
			new SaveMachineAsWebSocketRequest(
				this._ws,
				originalMachineId,
				newName
			)
		);
	}

	sendCommand(machineId, graphId, command, undo = false, redo = false) {
		return this.sendRequest(
			new CommandWebSocketRequest(
				this._ws,
				machineId,
				graphId,
				command,
				undo,
				redo
			)
		);
	}

	/**
	 * ******************************************************************************************
	 * Low Level API
	 * ******************************************************************************************
	 */

	sendRequest(request, timeout = this._timeout) {
		/* eslint-disable */
		this.logger.debug('Sending request to Gateway', request);
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(
				() => timeoutHandler(request.id, this._requests),
				timeout
			);
			this._requests.set(request.id, {
				resolve,
				reject,
				timeoutId,
				request
			});
			return request.send().catch((error) => {
				this.logger.error(
					'Sending request to Gateway',
					request._getConfig()
				);
				this.logger.error(
					`Error while communicating with Gateway while executing request '${
						request.constructor.name
					}'`,
					error
				);
				throw error;
			});
		});
		/* eslint-enable */
	}

	_handleSocketMessage(message) {
		/* eslint-disable */
		const request = deletePendingRequest(message.requestId, this._requests);
		if (request) {
			if (message.type === 'response') {
				this.logger.debug('Got response from Gateway', message);
				return request.resolve(message);
			} else {
				return request.reject(message);
			}
		}
		return null;
		/* eslint-enable */
	}
};
