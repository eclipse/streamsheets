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
import { GatewayMessagingProtocol } from '@cedalo/protocols';
import http from 'http';
import WebSocket from 'ws';
import Auth from '../Auth';
import { GlobalContext, Session } from '../streamsheets';
import { User } from '../user';
import { getUserFromWebsocketRequest } from '../utils';
import LoggerFactory from '../utils/logger';
import GraphServerInterceptor from './interceptors/GraphServerInterceptor';
import InterceptorChain from './interceptors/InterceptorChain';
import MachineServerInterceptor from './interceptors/MachineServerInterceptor';
import ProxyConnection from './ProxyConnection';

const logger = LoggerFactory.create({ name: 'SocketServer' });

const PATH = '/machineserver-proxy';
export const TOKENKEY = 'authToken';

export class SocketServer {
	private wss: WebSocket.Server | null = null;
	private wssConfig: WebSocket.ServerOptions = {
		clientTracking: true,
		path: PATH
	};
	private interceptorchain: InterceptorChain;
	private _gatewayService: any;
	// private httpServer: http.Server;
	globalContext: GlobalContext;

	constructor(gatewayService: any, httpServer: http.Server) {
		this._gatewayService = gatewayService;
		this.globalContext = gatewayService.globalContext;
		this.wssConfig.server = httpServer;
		// this.httpServer = httpServer;
		this.interceptorchain = new InterceptorChain();
		Object.values(this.globalContext.interceptors).forEach((i) => this.interceptorchain.add(i));
		this.interceptorchain.add(new GraphServerInterceptor());
		this.interceptorchain.add(new MachineServerInterceptor());
	}

	get gatewayService() {
		return this._gatewayService;
	}

	start() {
		if (!this.wss) {
			this.wss = new WebSocket.Server(this.wssConfig);
			// this.httpServer.on('upgrade', (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
			// 	const pathname = request.url ? url.parse(request.url).pathname : '';
			// 	if (pathname === '/machineserver-proxy') {
			// 		this.wss?.handleUpgrade(request, socket, head, (ws) =>
			// 			this.wss?.emit('connection', ws, request)
			// 		);
			// 	}
			// });

			this.wss.on('error', (error) => {
				logger.error(error);
				this.close();
			});
			// new connection:
			this.wss.on('connection', (ws, request) => {
				this.handleConnection(ws, request);
			});
		}
	}

	async handleConnection(ws: WebSocket, request: http.IncomingMessage) {
		try {
			let tokenUser = await getUserFromWebsocketRequest(request, TOKENKEY, Auth.parseToken.bind(Auth));

			try {
				const user = await this.globalContext.getActor(this.globalContext, { user: tokenUser } as Session);
				// create & connect new client-connection...
				this.connectClient(ProxyConnection.create(ws, request, user, this));
				this.handleUserJoined(ws, user);
			} catch (error) {
				await ws.send(JSON.stringify({ error: 'NOT_AUTHENTICATED' }));
				ws.terminate();
			}
		} catch (err) {
			ws.terminate();
			logger.error('unable to connect to server', err);
		}
	}

	handleUserJoined(ws: WebSocket, user: User) {
		logger.info(`User joined ${user.username}#${user.id}`);
		if (this.shouldBroadcast(user)) {
			const message = {
				type: 'event',
				event: {
					type: GatewayMessagingProtocol.EVENTS.USER_JOINED_EVENT,
					user
				}
			};
			this.broadcastExceptForUser(message, user.id);
		}
	}

	logoutUser({ user }: { user: User; msg?: any }) {
		return this.findConnectionsByUser(user).forEach((c) => this.logoutConnection(c));
	}

	logoutConnection(connection: ProxyConnection) {
		const message = {
			type: 'event',
			event: {
				type: GatewayMessagingProtocol.EVENTS.USER_LEFT_EVENT,
				user: connection.session.user,
				sessionId: connection.session.id,
				logout: true
			}
		};
		connection.sendToClient(message);
		connection.close();
	}

	handleUserLeft(session: Session) {
		logger.info(`User joined ${session.user.username}#${session.user.id}`);
		if (this.shouldBroadcast(session.user)) {
			const message = {
				type: 'event',
				event: {
					type: GatewayMessagingProtocol.EVENTS.USER_LEFT_EVENT,
					user: session.user,
					sessionId: session.id
				}
			};
			this.broadcastExceptForUser(message, session.user.id);
		}
	}

	shouldBroadcast(user?: Partial<User>) {
		return user && user.id;
	}

	connectClient(client: any) {
		client.interceptor = this.interceptorchain;
		client.connectGraphServer().catch((error: any) => {
			logger.error('Graph service not available!');
			logger.error(error);
		});
		client.connectMachineServer().catch((error: any) => {
			logger.error('Machine service not available!');
			logger.error(error);
		});
	}

	findConnectionBySession(session: Session) {
		return [...ProxyConnection.openConnections].find((connection) => connection.id === session.id);
	}

	findConnectionsByUser(user: User) {
		return [...ProxyConnection.openConnections].filter(
			(connection) => connection.user && connection.user.id === user.id
		);
	}

	broadcast(message: any) {
		logger.info(`Broadcasting message '${message.event.type}' to all clients!`);
		ProxyConnection.openConnections.forEach((connection) => {
			connection.sendToClient(message);
		});
	}

	broadcastExceptForUser(message: any, userId: string) {
		logger.info(`Broadcasting message '${message.event.type}' to all clients expect user!`);
		ProxyConnection.openConnections.forEach((connection) => {
			if (connection.user && connection.user.id !== userId) {
				connection.sendToClient(message);
			}
		});
	}

	close() {
		if (this.wss) {
			this.wss.close(); // terminates all connections => ProxyConnection#close() should be called automatically...
			this.wss = null;
		}
	}
}
