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
import IdGenerator from '@cedalo/id-generator';
import { LoggerFactory } from '@cedalo/logger';
import { MessagingClient } from '@cedalo/messaging-client';
import { GatewayMessagingProtocol, Topics } from '@cedalo/protocols';
import * as http from 'http';
import WebSocket from 'ws';
import Auth from '../Auth';
import { EventData, RequestContext, Session, WSRequest, WSResponse } from '../streamsheets';
import { User } from '../user';
import { getUserFromWebsocketRequest } from '../utils';
import ServerConnection from './ServerConnection';
import { SocketServer, TOKENKEY } from './SocketServer';
import { StreamWSProxy } from './StreamWSProxy';

const logger = LoggerFactory.createLogger('ProxyConnection', process.env.STREAMSHEETS_LOG_LEVEL || 'info');

const OPEN_CONNECTIONS: Set<ProxyConnection> = new Set();

export interface MessageContext extends RequestContext {
	message: WSRequest;
	connection: ProxyConnection;
	graphserver?: any;
	machineserver?: any;
}

export interface Interceptor {
	beforeSendToClient(context: MessageContext): Promise<MessageContext>;
	beforeSendToServer(context: MessageContext): Promise<MessageContext>;
}

// MachineServer client connection => analog for GraphServer?!
export default class ProxyConnection {
	id: string;
	user: User;
	private request: http.IncomingMessage;
	private clientsocket: WebSocket;
	private socketserver: SocketServer;
	private messagingClient: MessagingClient;
	private graphserver: ServerConnection;
	private machineserver: ServerConnection;
	private interceptor: Interceptor | null;
	private machineId: string | undefined;

	static get openConnections() {
		return OPEN_CONNECTIONS;
	}

	static create(ws: WebSocket, request: http.IncomingMessage, user: User, socketserver: SocketServer) {
		// think: check if we already have a connection for this user...
		const connection = new ProxyConnection(ws, request, user, socketserver);
		ProxyConnection.openConnections.add(connection);
		return connection;
	}

	constructor(ws: WebSocket, request: http.IncomingMessage, user: User, socketserver: SocketServer) {
		this.id = IdGenerator.generateUUID();
		this.request = request;
		this.user = user;
		this.clientsocket = ws;
		this.socketserver = socketserver;
		this.messagingClient = new MessagingClient();
		this.messagingClient.connect(process.env.MESSAGE_BROKER_URL || 'mqtt://localhost:1883');
		this.graphserver = new ServerConnection('graphserver', 'graphs');
		this.machineserver = new ServerConnection('machineserver', 'machines');

		this.graphserver.eventHandler = (ev) => this.onServerEvent(ev);
		this.machineserver.eventHandler = (ev) => this.onServerEvent(ev);
		this.messagingClient.subscribe(`${Topics.SERVICES_STREAMS_EVENTS}/#`);
		this.messagingClient.subscribe(`${Topics.SERVICES_AUTH_EVENTS}/#`);
		this.messagingClient.subscribe(`${Topics.SERVICES_PERSISTENCE_EVENTS}/#`);
		// TODO: register to a topic that will receive all events from web client - adapt topic structure
		this.messagingClient.on('message', (topic, message) => {
			if (topic.startsWith(Topics.SERVICES_STREAMS_EVENTS)) {
				if (topic.endsWith('response') || topic.endsWith('functions')) {
					return;
				}
				const streamEvent = JSON.parse(message.toString());
				if (streamEvent.type === 'response') {
					return;
				}
				this.socketserver.globalContext
					.getRequestContext(this.socketserver.globalContext, this.session)
					.then((requestContext) => {
						StreamWSProxy.handleEvent(requestContext, this, streamEvent);
					});
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
				const msg = JSON.parse(message.toString());
				if (msg.type === GatewayMessagingProtocol.MESSAGE_TYPES.CONFIRM_PROCESSED_MACHINE_STEP) {
					this.machineserver.confirmMachineStep(msg.machineId);
					this.clientsocket.send(JSON.stringify({
						type: 'response',
						requestId: msg.requestId || 0,
						requestType: msg.type
					}));
				} else if (msg.type !== 'ping') {
					await this.updateConnectionState(ws);
					msg.session = this.session;
					if (msg.type === GatewayMessagingProtocol.MESSAGE_TYPES.USER_LOGOUT_MESSAGE_TYPE) {
						this.socketserver.logoutUser({
							user: this.user,
							msg
						});
					} else if (msg.topic && msg.topic.indexOf('stream') >= 0) {
						StreamWSProxy.handleRequest(
							await this.socketserver.globalContext.getRequestContext(
								this.socketserver.globalContext,
								this.session
							),
							this,
							msg
						);
					} else if (msg.topic && msg.topic.indexOf('persistence') >= 0) {
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
		this.sendSessionToClient();
		this.sendServicesStatusToClient();
	}

	setUser(user: User) {
		this.user = user;
	}

	get session(): Session {
		const { id, user } = this;
		return {
			id,
			user: {
				id: user ? user.id : 'anon',
				username: user ? user.username : 'anon',
				displayName: user ? [user.firstName, user.lastName].filter((e) => !!e).join(' ') || user.username : '',
				machineId: this.machineId
			}
		};
	}

	async updateConnectionState(ws: WebSocket) {
		if (ws) {
			try {
				const tokenUser = await getUserFromWebsocketRequest(this.request, TOKENKEY, Auth.parseToken.bind(Auth));
				const user = await this.socketserver.globalContext.getActor(this.socketserver.globalContext, {
					user: tokenUser
				} as Session);
				this.setUser(user);
				this.machineId = tokenUser.machineId;
			} catch (err) {
				logger.warn(err.name);
				this.user && this.socketserver.logoutUser({ user: this.user });
				this.clientsocket.close();
			}
		}
	}

	sendSessionToClient() {
		this.sendToClient({
			type: 'event',
			event: {
				type: GatewayMessagingProtocol.EVENTS.SESSION_INIT_EVENT,
				session: this.session
			}
		});
	}

	sendServicesStatusToClient() {
		// TODO: handle this more flexible
		this.sendToClient(this.socketserver.gatewayService.getServiceStatus('graphs'));
		this.sendToClient(this.socketserver.gatewayService.getServiceStatus('machines'));
	}

	onServerEvent(event: any) {
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

	async createMessageContext(message: any): Promise<MessageContext> {
		// if message is a string it should be an already stringified message!
		message = typeof message === 'string' ? JSON.parse(message) : message;
		return {
			...(await this.socketserver.globalContext.getRequestContext(this.socketserver.globalContext, this.session)),
			message,
			connection: this
		};
	}

	async sendToServer(message: WSRequest) {
		let context;
		const response: WSResponse = {
			type: 'response',
			requestId: message.requestId || 0,
			requestType: message.type
			// TODO: Is this in use?
			// result: context.result || undefined
		};
		try {
			context = await this._beforeSendToServer(await this.createMessageContext(message));
		} catch (error) {
			return { ...response, machineserver: { error }, graphserver: { error } };
		}
		try {
			const machineServerResponse = await this._sendToMachineServer(context);
			response.machineserver = machineServerResponse && machineServerResponse.response;
		} catch (error) {
			logger.error(error);
			response.machineserver = {
				error: error.error || error
			};
		}
		try {
			const graphServerResponse = await this._sendToGraphServer(context);
			response.graphserver = graphServerResponse && graphServerResponse.response;
		} catch (error) {
			logger.error(error);
			response.graphserver = {
				error: error.error
			};
		}
		return response;
	}

	_beforeSendToServer(context: MessageContext) {
		return this.interceptor ? this.interceptor.beforeSendToServer(context) : Promise.resolve(context);
	}

	async _sendToGraphServer(context: MessageContext) {
		if (context.graphserver) {
			const graphServerResponse = await this.graphserver.send(context.message, context.message.requestId);
			if (graphServerResponse && graphServerResponse.requestType === 'command') {
				delete graphServerResponse.response.graph.graphdef;
			}
			return graphServerResponse;
		}
		return null;
	}

	_sendToMachineServer(context: MessageContext) {
		return !context.machineserver
			? Promise.resolve()
			: this.machineserver.send(context.message, context.message.requestId);
	}

	async sendStepToClient(stepMessage: EventData) {
		if (!this.clientsocket || this.clientsocket.readyState !== WebSocket.OPEN) {
			return;
		}
		this.socketserver.gatewayService.notifySendMessageToClient();
		this.clientsocket.send(stepMessage);
	}

	// called by proxy to send a message to client...
	async sendToClient(message: any) {
		try {
			const ctxt: MessageContext = await this._beforeSendToClient(await this.createMessageContext(message));
			ctxt.message.session = this.session;
			this.clientsocket.send(JSON.stringify(ctxt.message));
		} catch (error) {
			logger.error('Failed to send message to client!', error);
		}
	}
	async _beforeSendToClient(context: MessageContext): Promise<MessageContext> {
		return new Promise((resolve /* , reject */) => {
			if (!this.clientsocket || this.clientsocket.readyState !== WebSocket.OPEN) {
				// reject(new Error('Client connection not established!'));
			} else {
				resolve(this.interceptor ? this.interceptor.beforeSendToClient(context) : context);
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
}
