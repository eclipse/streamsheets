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

const HTTPGatewayAPI = require('../apis/HTTPGatewayAPI');
const WebSocketGatewayAPI = require('../apis/WebSocketGatewayAPI');
const { GatewayMessagingProtocol } = require('@cedalo/protocols');
const ErrorCodes = require('../constants/ErrorCodes');

const createError = (code, message) => ({
	code,
	message
});

module.exports = class BaseGatewayClient {
	constructor({ name, logger, defaultListener } = {}) {
		this.name = name || 'Default base gateway client';
		this._logger = logger || {
			log() {},
			info() {},
			warn() {},
			error() {}
		};
		this._eventHandler = (event) => this.logger.info(event);
		this._closeHandler = () => this.logger.info('Close Gateway Client');
		this._eventListeners = new Map();
		this._initDefaultEventListeners(defaultListener);
		this._timerID = 0;
		this._isConnected = false;
	}

	// eslint-disable-next-line consistent-return
	async connect({ socketEndpointURL, restEndpointURL, token } = {}) {
		if (this._isConnected || this._isConnecting) {
			return Promise.resolve({});
		}
		this._isConnecting = true;
		// TODO: handle default values
		this._socketEndpointURL = socketEndpointURL || this._socketEndpointURL;
		this._restEndpointURL = restEndpointURL || this._restEndpointURL;
		this._token = token || this._token;
		try {
			await this._connectRESTServer(restEndpointURL);
			this.http = new HTTPGatewayAPI(restEndpointURL, this._token, this.logger);
			if(this._token) {
				const ws = await this._connectSocketServer(`${this._socketEndpointURL}?authToken=${this._token}`);
				this._ws = ws;
				this.socket = new WebSocketGatewayAPI(this._ws, this.logger);
				this._keepAlive();
			}
			this._isConnected = true;
			this._isConnecting = false;
		} catch (error) {
			this._isConnected = false;
			this._isConnecting = false;
			this.logger.error(
				`${this._socketEndpointURL}?authToken=${this._token}`
			);
			this.logger.error(error);
		}
	}

	reconnect() {
		const socketEndpointURL = this._socketEndpointURL;
		const restEndpointURL = this._restEndpointURL;
		const token = this._token;
		this.connect({ socketEndpointURL, restEndpointURL, token });
	}

	disconnect() {
		this._cancelKeepAlive();
		if(this._ws) {
			this._ws.close();
		}
		this._isConnected = false;
		return Promise.resolve();
	}

	async resetConnection() {
		await this.disconnect();
		return this.reconnect();
	}

	_keepAlive() {
		const interval = 8000;
		if (this._ws && this._ws.readyState === this._ws.OPEN) {
			this.logger.debug('Sending empty request.');
			this._ws.send(
				JSON.stringify({
					type: 'ping',
					interval
				})
			);
		}
		this._timerId = setTimeout(this._keepAlive.bind(this), interval);
	}

	_cancelKeepAlive() {
		if (this._timerId) {
			clearTimeout(this._timerId);
		}
	}

	get logger() {
		return this._logger;
	}

	on(event, listener) {
		let listeners = this._eventListeners.get(event);
		if (!listeners) {
			listeners = [];
			this._eventListeners.set(event, listeners);
		}
		listeners.push(listener);
	}

	off(event, listener) {
		const listeners = this._eventListeners.get(event);
		if (listeners) {
			const index = listeners.indexOf(listener);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	set eventHandler(eventHandler) {
		this._eventHandler = eventHandler;
	}

	get eventHandler() {
		return this._eventHandler;
	}

	set closeHandler(closeHandler) {
		this._closeHandler = closeHandler;
	}

	get closeHandler() {
		return this._closeHandler;
	}

	waitUntilAllServersAreConnected(timeout = 5000) {
		return new Promise((resolve, reject) => {
			let machineServerConnected = false;
			let graphServerConnected = false;

			const checkIfAllServersAreConnected = (listener) => {
				if (machineServerConnected && graphServerConnected) {
					resolve();
					this.off(
						GatewayMessagingProtocol.EVENTS
							.MACHINE_SERVER_CONNECTED_EVENT,
						listener
					);
					this.off(
						GatewayMessagingProtocol.EVENTS
							.MACHINE_SERVER_DISCONNECTED_EVENT,
						listener
					);
					this.off(
						GatewayMessagingProtocol.EVENTS
							.GRAPH_SERVER_CONNECTED_EVENT,
						listener
					);
					this.off(
						GatewayMessagingProtocol.EVENTS
							.GRAPH_SERVER_DISCONNECTED_EVENT,
						listener
					);
				}
			};

			const listener = (event) => {
				switch (event.type) {
					case GatewayMessagingProtocol.EVENTS
						.MACHINE_SERVER_CONNECTED_EVENT:
						machineServerConnected = true;
						checkIfAllServersAreConnected(listener);
						break;
					case GatewayMessagingProtocol.EVENTS
						.MACHINE_SERVER_DISCONNECTED_EVENT:
						machineServerConnected = false;
						checkIfAllServersAreConnected(listener);
						break;
					case GatewayMessagingProtocol.EVENTS
						.GRAPH_SERVER_CONNECTED_EVENT:
						graphServerConnected = true;
						checkIfAllServersAreConnected(listener);
						break;
					case GatewayMessagingProtocol.EVENTS
						.GRAPH_SERVER_DISCONNECTED_EVENT:
						graphServerConnected = false;
						checkIfAllServersAreConnected(listener);
						break;
					default:
						break;
				}
			};

			setTimeout(() => {
				this.off(
					GatewayMessagingProtocol.EVENTS
						.MACHINE_SERVER_CONNECTED_EVENT,
					listener
				);
				this.off(
					GatewayMessagingProtocol.EVENTS
						.MACHINE_SERVER_DISCONNECTED_EVENT,
					listener
				);
				this.off(
					GatewayMessagingProtocol.EVENTS
						.GRAPH_SERVER_CONNECTED_EVENT,
					listener
				);
				this.off(
					GatewayMessagingProtocol.EVENTS
						.GRAPH_SERVER_DISCONNECTED_EVENT,
					listener
				);
				let error;
				if (!machineServerConnected && !graphServerConnected) {
					error = createError(
						ErrorCodes.MACHINE_SERVER_AND_GRAPH_SERVER_NOT_CONNECTED,
						'Machine server and graph server are not connected.'
					);
				} else if (!machineServerConnected) {
					error = createError(
						ErrorCodes.MACHINE_SERVER_NOT_CONNECTED,
						'Machine server is not connected.'
					);
				} else if (!graphServerConnected) {
					error = createError(
						ErrorCodes.GRAPH_SERVER_NOT_CONNECTED,
						'Graph server is not connected.'
					);
				}
				this.logger.error(error);
				reject(error);
			}, timeout);

			this.on(
				GatewayMessagingProtocol.EVENTS.MACHINE_SERVER_CONNECTED_EVENT,
				listener
			);
			this.on(
				GatewayMessagingProtocol.EVENTS
					.MACHINE_SERVER_DISCONNECTED_EVENT,
				listener
			);
			this.on(
				GatewayMessagingProtocol.EVENTS.GRAPH_SERVER_CONNECTED_EVENT,
				listener
			);
			this.on(
				GatewayMessagingProtocol.EVENTS.GRAPH_SERVER_DISCONNECTED_EVENT,
				listener
			);
		});
	}

	/**
	 * ******************************************************************************************
	 * High Level API
	 * ******************************************************************************************
	 */

	executeStreamCommand(scope, cmd) {
		return this.socket.executeStreamCommand(scope, cmd);
	}

	graphql(query, variables, file) {
		return this.http.graphql(query, variables, file);
	}

	/**
	 * *********************************************
	 * User Definition API
	 * *********************************************
	 */

	login(credentials) {
		return this.socket.login(credentials).then(async (res) => {
			this._token = res.response.token;
			this.http.token = res.response.token;
			await this.resetConnection();
			return res;
		});
	}

	authenticate(authRequest) {
		return this.http.authenticate(authRequest).then(async (res) => {
			this._token = res.token;
			this.http.token = res.token;
			await this.resetConnection();
			return res;
		});
	}

	logout(id) {
		return this.socket.logout(id).then(async (res) => {
			this._token = undefined;
			this.http.token = undefined;
			await this.resetConnection();
			return res;
		});
	}

	authEntityCreate(entity) {
		return this.socket.authEntityCreate(entity);
	}

	authEntityGet(entity) {
		return this.socket.authEntityGet(entity);
	}

	authEntityDelete(entity) {
		return this.socket.authEntityDelete(entity);
	}

	authEntityUpdate(entity) {
		return this.socket.authEntityUpdate(entity);
	}

	getUser(userId) {
		return this.socket.getUser(userId);
	}

	saveUser(user) {
		return this.socket.saveUser(user);
	}

	getUserSettings(userId) {
		return this.socket.getUserSettings(userId);
	}

	saveUserSettings(userId, settings) {
		return this.socket.saveUserSettings(userId, settings);
	}

	/**
	 * *********************************************
	 * Machine Definition API
	 * *********************************************
	 */

	async cloneMachine(machineId) {
		const cloneMutation = `
			mutation CloneMachine($machineId: ID!) {
				scopedByMachine(machineId: $machineId) {
					cloneMachine(machineId: $machineId) {
						success
						clonedMachine {
							name
							id
							metadata {
								lastModified
								owner
							}
							previewImage
							titleImage
							streamsheets {
								name
								inbox {
									stream {
										name
									}
								}
							}
							state
						}
					}
				}
			}
		`;

		const result = await this.graphql(cloneMutation, { machineId });
		return result.scopedByMachine.cloneMachine;
	}

	backup() {
		return this.http.backup();
	}

	restore(file) {
		return this.http.restore(file);
	}

	/**
	 * *********************************************
	 * Machine API
	 * *********************************************
	 */

	getMachine(machineId) {
		return this.socket.getMachine(machineId);
	}

	getMachines() {
		return this.socket.getMachines();
	}

	deleteMachine(machineId) {
		return this.socket.deleteMachine(machineId);
	}

	// async deleteMachines() {
	// 	const machines = this.getMachines();
	// 	for (let machine of machines) {
	// 		await this.subscribeMachine(machine.id);
	// 		await this.deleteMachine(machine.id);
	// 		await this.unsubscribeMachine(machine.id);
	// 	}
	// }

	deleteMachines() {
		return this.getMachines().then((response) => {
			const { machines } = response.machineserver;
			const promises = machines.map((machine) =>
				Promise.resolve()
					.then(() => this.subscribeMachine(machine.id))
					.then(() => this.deleteMachine(machine.id))
					// .then(() => deletedMachineCallback(machine))
					.then(() => this.unsubscribeMachine(machine.id))
			);
			return Promise.all(promises);
		});
	}

	startAllMachines(singleMachineStartedCallback) {
		return this._batch(
			this.startMachine.bind(this),
			singleMachineStartedCallback
		);
	}

	stopAllMachines(singleMachineStoppedCallback) {
		return this._batch(
			this.stopMachine.bind(this),
			singleMachineStoppedCallback
		);
	}

	pauseAllMachines(singleMachinePausedCallback) {
		return this._batch(
			this.pauseMachine.bind(this),
			singleMachinePausedCallback
		);
	}

	deleteAllMachines(singleMachineDeletedCallback) {
		return this._batch(
			this.deleteMachine.bind(this),
			singleMachineDeletedCallback
		);
	}

	_batch(operation, singleOperationCallback) {
		return this.getMachines().then((response) => {
			const { machines } = response.machineserver;
			const promises = machines.map((machine) =>
				Promise.resolve()
					.then(() => this.loadMachine(machine.id))
					.then(() => this.subscribeMachine(machine.id))
					.then(() => (operation ? operation(machine.id) : null))
					.then(() => singleOperationCallback(machine))
					.then(() => this.unsubscribeMachine(machine.id))
			);
			return Promise.all(promises);
		});
	}

	loadMachine(machineId, settings) {
		return this.socket.loadMachine(machineId, settings);
	}

	unloadMachine(machineId) {
		return this.socket.unloadMachine(machineId);
	}

	loadSubscribeMachine(machineId, settings, scope) {
		return this.socket.loadSubscribeMachine(machineId, settings, scope);
	}
	pauseMachine(machineId) {
		return this.socket.pauseMachine(machineId);
	}

	updateMachineImage(machineId, previewImage) {
		return this.socket.updateMachineImage(machineId, previewImage);
	}

	updateMachineTitleImage(machineId, titleImage) {
		return this.socket.updateMachineTitleImage(machineId, titleImage);
	}

	renameMachine(machineId, newName) {
		return this.socket.renameMachine(machineId, newName);
	}

	createStreamSheet(machineId, activeItemId, position) {
		return this.socket.createStreamSheet(machineId, activeItemId, position);
	}

	deleteStreamSheet(machineId, streamsheetId) {
		return this.socket.deleteStreamSheet(machineId, streamsheetId);
	}

	updateStreamSheetStreams(machineId, streamsheetId, streams) {
		return this.socket.updateStreamSheetStreams(
			machineId,
			streamsheetId,
			streams
		);
	}

	confirmProcessedMachineStep(machineId) {
		return this.socket.confirmProcessedMachineStep(machineId);
	}

	startMachine(machineId) {
		return this.socket.startMachine(machineId);
	}

	stepMachine(machineId) {
		return this.socket.stepMachine(machineId);
	}

	stopMachine(machineId) {
		return this.socket.stopMachine(machineId);
	}

	startMachines() {
		return this.socket.startMachines();
	}

	stopMachines() {
		return this.socket.stopMachines();
	}

	subscribeMachine(machineId) {
		return this.socket.subscribeMachine(machineId);
	}

	unsubscribeMachine(machineId) {
		return this.socket.unsubscribeMachine(machineId);
	}

	async saveMachineAs(machineId, newName) {
		const cloneMutation = `
			mutation CloneMachine($machineId: ID!, $newName: String!) {
				scopedByMachine(machineId: $machineId) {
					cloneMachine(machineId: $machineId, newName: $newName) {
						success
						clonedMachine {
							name
							id
							metadata {
								lastModified
								owner
							}
							previewImage
							titleImage
							streamsheets {
								name
								inbox {
									stream {
										name
									}
								}
							}
							state
						}
					}
				}
			}
		`;

		const result = await this.graphql(cloneMutation, { machineId, newName });
		return result.scopedByMachine.cloneMachine;
	}

	redo(machineId) {
		return this.socket.redo(machineId);
	}

	undo(machineId) {
		return this.socket.undo(machineId);
	}

	setCycleTime(machineId, cycleTime) {
		return this.socket.setCycleTime(machineId, cycleTime);
	}

	setMachineLocale(machineId, locale) {
		return this.socket.setMachineLocale(machineId, locale);
	}

	setStreamSheetStepInterval(machineId, streamsheetStepInterval) {
		return this.socket.setStreamSheetStepInterval(
			machineId,
			streamsheetStepInterval
		);
	}

	updateMachineSettings(machineId, settings) {
		return this.socket.updateMachineSettings(machineId, settings);
	}

	/**
	 * *********************************************
	 * General API
	 * *********************************************
	 */

	getMetaInformation() {
		return this.http.getMetaInformation();
	}

	/**
	 * *********************************************
	 * Graph API
	 * *********************************************
	 */

	// TODO: deprecated
	createGraph() {
		return this.socket.createGraph();
	}

	// TODO: deprecated
	loadGraph(graphId) {
		return this.socket.loadGraph(graphId);
	}

	// TODO: deprecated
	subscribeGraph(graphId) {
		return this.socket.subscribeGraph(graphId);
	}

	// TODO: deprecated
	unsubscribeGraph(graphId) {
		return this.socket.unsubscribeGraph(graphId);
	}

	sendSelection() {
		// TODO: implement
	}

	sendCommand(machineId, graphId, command, undo = false, redo = false) {
		return this.socket.sendCommand(machineId, graphId, command, undo, redo);
	}

	updateNamedCells(machineId, streamsheetId, namedCells) {
		return this.socket.updateNamedCells(
			machineId,
			streamsheetId,
			namedCells
		);
	}

	addInboxMessage(machineId, streamsheetId, message, metadata) {
		return this.socket.addInboxMessage(machineId, streamsheetId, message, metadata);
	}

	/**
	 * *********************************************
	 * Administration API
	 * *********************************************
	 */

	saveDSConfiguration(scope, configuration) {
		return this.socket.saveDSConfiguration(scope, configuration);
	}

	loadAllDSConfigurations(scope) {
		return this.socket.loadAllDSConfigurations(scope);
	}

	deleteDSConfiguration(scope, configId) {
		if (typeof configId === 'undefined') {
			return Promise.resolve(null);
		}
		return this.socket.deleteDSConfiguration(scope, configId);
	}

	reloadStreams(scope, sources = []) {
		return this.socket.reloadStreams(scope, sources);
	}

	/**
	 * ******************************************************************************************
	 * Low Level API
	 * ******************************************************************************************
	 */

	sendRequest(request) {
		this.logger.info(`Sending message: ${JSON.stringify(request)}.`);
		return this.http.sendRequest(request);
	}

	sendWebSocketRequest(request) {
		this.logger.info(`Sending message: ${JSON.stringify(request)}.`);
		return this.socket.sendRequest(request);
	}

	/**
	 * ******************************************************************************************
	 * Private methods
	 * ******************************************************************************************
	 */

	_initDefaultEventListeners(defaultListener) {
		Object.values(GatewayMessagingProtocol.EVENTS).forEach((eventType) => {
			this.on(eventType, (event) => this.logger.info('Got event', event));
			if (defaultListener) {
				this.on(eventType, (event) => defaultListener(event));
			}
		});
	}

	_connectSocketServer() {
		// There are different subclasses for usage in Node.js and in the browser
		// and they handle connecting to a web socket server differently.
		return Promise.reject(
			new Error(
				'No implementation of abstract method _connectSocketServer() in subclass.'
			)
		);
	}

	_connectRESTServer() {
		return Promise.resolve();
	}

	_handleSocketMessage(message) {
		const parsedMessage = JSON.parse(message);
		if(parsedMessage.error === 'NOT_AUTHENTICATED'){
			// console.log('redirect event');
			this._handleEvent({ type: 'redirect', to: '/login' });
			return;
		}
		if (parsedMessage.type === 'response') {
			if (this.socket) {
				this.socket._handleSocketMessage(parsedMessage);
			}
		} else if (parsedMessage.type === 'event') {
			this._handleEvent(parsedMessage.event);
		}
	}

	_handleEvent(event) {
		const listeners = this._eventListeners.get(event.type);
		if (listeners) {
			listeners.forEach((listener) => listener(event));
		}
	}

	_handleOpenedSocketConnection() {
		this.logger.info(`Client '${this.name}' connected`);
		return Promise.resolve(this);
	}

	_handleSocketClose(event) {
		this.logger.info('Websocket closed');
		this.closeHandler(event);
		this._handleEvent({
			type: GatewayMessagingProtocol.EVENTS.GATEWAY_DISCONNECTED_EVENT
		});
	}

	_handleSocketError(event) {
		this.logger.info('Websocket error', event);
	}
};
