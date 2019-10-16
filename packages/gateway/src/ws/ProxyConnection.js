const uuidv4 = require('uuid/v4');
// const utils = require('../utils');
const ServerConnection = require('./ServerConnection');
const WebSocket = require('ws');
const _ = require('lodash');
const { MessagingClient } = require('@cedalo/messaging-client');
const { Topics, GatewayMessagingProtocol } = require('@cedalo/protocols');
const Auth = require('../Auth');
const utils = require('../utils');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'gateway - ProxyConnection',
	process.env.STREAMSHEETS_LOG_LEVEL
);

const OPEN_CONNECTIONS = new Set();

// MachineServer client connection => analog for GraphServer?!
module.exports = class ProxyConnection {
	static get openConnections() {
		return OPEN_CONNECTIONS;
	}

	static create(ws, request, user, socketserver) {
		// think: check if we already have a connection for this user...
		const connection = new ProxyConnection(ws, request, user, socketserver);
		ProxyConnection.openConnections.add(connection);
		return connection;
	}

	constructor(ws, request, user, socketserver) {
		this.id = uuidv4();
		this.request = request;
		this.user = user;
		this.clientId = null;
		this.clientsocket = ws;
		this.socketserver = socketserver;
		this.messagingClient = new MessagingClient();
		this.messagingClient.connect(
			process.env.MESSAGE_BROKER_URL || 'mqtt://localhost:1883'
		);
		this.graphserver = new ServerConnection('graphserver', 'graphs');
		this.machineserver = new ServerConnection('machineserver', 'machines');
		this.clientsocket.on('message', (message) => {
			const parsedMessage = JSON.parse(message);
			if (parsedMessage.type === GatewayMessagingProtocol.MESSAGE_TYPES.CONFIRM_PROCESSED_MACHINE_STEP) {
				this.machineserver.confirmMachineStep(parsedMessage.machineId);
			}
		});
		this.graphserver.eventHandler = (ev) => this.onServerEvent(ev);
		this.machineserver.eventHandler = (ev) => this.onServerEvent(ev);
		this.messagingClient.subscribe(`${Topics.SERVICES_STREAMS_EVENTS}/#`);
		this.messagingClient.subscribe(`${Topics.SERVICES_AUTH_EVENTS}/#`);
		this.messagingClient.subscribe(`${Topics.SERVICES_PERSISTENCE_EVENTS}/#`);
		// TODO: register to a topic that will receive all events from web client - adapt topic structure
		this.messagingClient.on('message', (topic, message) => {
			if (
				topic.startsWith(Topics.SERVICES_STREAMS_EVENTS) &&
				(topic.endsWith('response') || topic.endsWith('functions'))
			) {
				return;
			}
			let msg = message.toString();
			try {
				msg = JSON.parse(msg);
			} catch (err) {
				logger.error(msg);
			}
			this.onServerEvent(msg);
		});
		this.interceptor = null;

		// listen to clients error/close:
		ws.on('close', () => {
			logger.info('Closing WebSocket');
			this.close();
		});
		ws.on('error', (error) => {
			logger.error('WebSocket error');
			logger.error(error);
			this.close();
		});
		ws.on('message', async (message) => {
			try {
				const msg = JSON.parse(message);
				if (msg.type !== 'ping') {
					await this.updateConnectionState(ws);
					msg.session = this.session;
					if(msg.type === GatewayMessagingProtocol.MESSAGE_TYPES.USER_LOGOUT_MESSAGE_TYPE) {
						this.socketserver.logoutUser({
							user: this.user,
							clientId: this.clientId,
							msg
						});
					} else if (
						msg.topic &&
						msg.topic.indexOf('stream') >= 0
					) {
						this.messagingClient.publish(msg.topic, msg);
					} else if (
						msg.topic &&
						msg.topic.indexOf('persistence') >= 0
					) {
						this.messagingClient.publish(msg.topic, msg);
					} else if (
						msg.topic &&
						msg.topic.indexOf('auth') >= 0
					) {
						this.messagingClient.publish(msg.topic, msg);
					} else {
						const response = await this.sendToServer(msg);
						this.sendToClient(response);
					}

				}
			} catch (err) {
				logger.warn(err);
			}
		});
		this.sendServicesStatusToClient();
	}

	setUser(user) {
		this.user = user;
	}

	setClientId(clientId) {
		this.clientId = clientId;
	}

	get session() {
		return {
			id: this.id,
			user: {
				userId: this.user ? this.user.userId : 'anon',
				roles: this.user ? this.user.roles : [],
				displayName: this.user
					? this.user.displayName || `${this.user.firstName} ${this.user.secondName}`
					: ''
			},
			clientId: this.clientId
		};
	}

	async updateConnectionState(ws) {
		if(ws) {
			try {
				const user = await utils.getUserFromWebsocketRequest(this.request, this.socketserver._config.tokenKey, Auth.parseToken.bind(Auth));
				const clientId = utils.getClientIdFromWebsocketRequest(this.request);
				if(!this.user) {
					this.setUser(user);
					this.setClientId(this.generateClientId(clientId));
				} else {
					this.setUser(user);
					if(!this.clientId) {
						this.setClientId(clientId);
					}
				}
			} catch (err) {
				logger.warn(err.name);
				this.socketserver.logoutUser({
					user: this.user,
					clientId: this.clientId,
				});
			}

		}
	}

	generateClientId(clientUUID) {
		return `${this.user.userId}-${clientUUID}`;
	}

	sendServicesStatusToClient() {
		// TODO: handle this more flexible
		this.sendToClient(
			this.socketserver.gatewayService.getServiceStatus('graphs')
		);
		this.sendToClient(
			this.socketserver.gatewayService.getServiceStatus('machines')
		);
		this.sendToClient(
			this.socketserver.gatewayService.getServiceStatus('persistence')
		);
	}

	onServerEvent(event) {
		switch (event.type) {
			case 'connect':
			case 'disconnect':
				logger.info(`${event.server}_${event.type}ed`);
				this.sendToClient({
					type: 'event',
					event: {
						type: `${event.server}_${event.type}ed`
					}
				});
				break;
			case 'event':
				this.sendToClient(event);
				break;
			case 'response':
				this.sendToClient(event);
				break;
			case 'message':
				this.sendToClient(event.data);
				break;
			case 'step':
				this.sendStepToClient(event.data);
				break;
			default:
			// logger.error(`unknown event type: ${event.type} send by ${event.server}`);
		}
	}

	connectGraphServer() {
		logger.info('Connecting to graph service');
		return this.graphserver.connect();
	}

	connectMachineServer() {
		logger.info('Connecting to machine service');
		return this.machineserver.connect();
	}

	createMessageContext(message) {
		// if message is a string it should be an already stringified message!
		message = _.isString(message) ? JSON.parse(message) : message;
		return {
			user: this.user,
			message,
			connection: this,
			result: message.result || undefined
		};
	}

	async sendToServer(message) {
		const context = await this._beforeSendToServer(
			this.createMessageContext(message)
		);
		const response = {
			type: 'response',
			requestId: context.message.requestId,
			requestType: context.message.type,
			result: context.result || undefined
		};
		try {
			const machineServerResponse = await this._sendToMachineServer(
				context
			);
			response.machineserver =
				machineServerResponse && machineServerResponse.response;
		} catch (error) {
			logger.error(error);
			response.machineserver = {
				error: error.error || error
			};
		}
		try {
			const graphServerResponse = await this._sendToGraphServer(context);
			response.graphserver =
				graphServerResponse && graphServerResponse.response;
		} catch (error) {
			logger.error(error);
			response.graphserver = {
				error: error.error
			};
		}

		// if (this._newMachineCreated(response)) {
		// 	const message = {
		// 		type: 'event',
		// 		event: {
		// 			type: 'machine_created'
		// 		}
		// 	};
		// 	// this.socketserver.broadcastExceptForUser({
		// 	// 	type: 'machine_created'
		// 	// }, this.session);
		// 	this.socketserver.broadcast(message);
		// }
		return response;
	}

	_newMachineCreated(response) {
		return (
			response.requestType ===
				GatewayMessagingProtocol.MESSAGE_TYPES
					.LOAD_MACHINE_MESSAGE_TYPE &&
			response.machineserver.templateId === 'base_machine'
		);
	}

	_beforeSendToServer(context) {
		return this.interceptor
			? this.interceptor.beforeSendToServer(context)
			: Promise.resolve(context);
	}

	async _sendToGraphServer(context) {
		if (context.graphserver) {
			const graphServerResponse = await this.graphserver.send(
				context.message,
				context.message.requestId
			);
			if (
				graphServerResponse &&
				graphServerResponse.requestType === 'command'
			) {
				delete graphServerResponse.response.graph.graphdef;
			}
			return graphServerResponse;
		}
		return null;
	}

	_sendToMachineServer(context) {
		return !context.machineserver
			? Promise.resolve()
			: this.machineserver.send(
					context.message,
					context.message.requestId
			  );
	}

	async sendStepToClient(stepMessage) {
		if (
			!this.clientsocket ||
			this.clientsocket.readyState !== WebSocket.OPEN
		) {
			return;
		}
		this.socketserver.gatewayService.notifySendMessageToClient();
		this.clientsocket.send(stepMessage);
	}

	// called by proxy to send a message to client...
	async sendToClient(message) {
		try {
			const ctxt = await this._beforeSendToClient(
				this.createMessageContext(message)
			);
			ctxt.message.session = this.session;
			this.clientsocket.send(JSON.stringify(ctxt.message));
		} catch (error) {
			logger.error('Failed to send message to client!', error);
		}
	}
	_beforeSendToClient(context) {
		return new Promise((resolve /* , reject */) => {
			if (
				!this.clientsocket ||
				this.clientsocket.readyState !== WebSocket.OPEN
			) {
				// reject(new Error('Client connection not established!'));
			} else {
				resolve(
					this.interceptor
						? this.interceptor.beforeSendToClient(context)
						: context
				);
			}
		});
	}

	close() {
		this.socketserver.handleUserLeft(this.session);
		this.graphserver.disconnect();
		this.machineserver.disconnect();
		this.messagingClient.end();
		// remove connection:
		ProxyConnection.openConnections.delete(this);
		logger.info('closed & removed client connection...');
	}
};
