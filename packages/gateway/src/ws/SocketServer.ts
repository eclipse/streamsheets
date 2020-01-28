import { GatewayMessagingProtocol } from '@cedalo/protocols';
import * as http from 'http';
import WebSocket from 'ws';
import Auth from '../Auth';
import { getUserFromWebsocketRequest } from '../utils';
import LoggerFactory from '../utils/logger';
import AuthorizationInterceptor from './interceptors/AuthorizationInterceptor';
import GraphServerInterceptor from './interceptors/GraphServerInterceptor';
import InterceptorChain from './interceptors/InterceptorChain';
import MachineServerInterceptor from './interceptors/MachineServerInterceptor';
import ProxyConnection from './ProxyConnection';
const logger = LoggerFactory.create({ name: 'SocketServer' });

const DEFAULTS = {
	host: '0.0.0.0',
	port: 8088,
	path: '/machineserver-proxy',
	tokenKey: 'authToken'
};

export default class SocketServer {
	private wss: WebSocket.Server | null = null;
	private wssConfig: WebSocket.ServerOptions;
	private interceptorchain: InterceptorChain;
	private _gatewayService: any;
	_config: any;

	constructor(config = DEFAULTS, gatewayService: any) {
		this._config = Object.assign({}, DEFAULTS, config);
		this._gatewayService = gatewayService;
		this.wssConfig = {};
		this.wssConfig.port = this._config.port;
		this.wssConfig.host = this._config.host;
		this.wssConfig.path = this._config.path;
		this.wssConfig.clientTracking = true;
		this.wssConfig.verifyClient = (info, cb) => {
			getUserFromWebsocketRequest(info.req, this._config.tokenKey, Auth.parseToken.bind(Auth))
				.then(() => cb(true))
				.catch((error: any) => {
					logger.warn('unable to verify client:', error && error.message ? error.message : error);
					cb(false, 401, 'Unauthorized');
				});
		};
		this.interceptorchain = new InterceptorChain();
		this.interceptorchain.add(new AuthorizationInterceptor());
		this.interceptorchain.add(new GraphServerInterceptor());
		this.interceptorchain.add(new MachineServerInterceptor());
	}

	get gatewayService() {
		return this._gatewayService;
	}

	start() {
		return this.wss
			? Promise.resolve(this)
			: new Promise((resolve, reject) => {
					this.wss = new WebSocket.Server(this.wssConfig);
					this.wss.on('error', (error) => {
						logger.error(error);
						this.close();
						reject();
					});
					this.wss.on('listening', () => {
						logger.info('Websocket proxy started. Listening on port:', this.wssConfig.port);
						resolve(this);
					});
					// new connection:
					this.wss.on('connection', (ws, request) => {
						this.handleConnection(ws, request);
					});
			  });
	}

	async handleConnection(ws: WebSocket, request: http.IncomingMessage) {
		try {
			const user = await getUserFromWebsocketRequest(request, this._config.tokenKey, Auth.parseToken.bind(Auth));
			// create & connect new client-connection...
			this.connectClient(ProxyConnection.create(ws, request, user, this));
			this.handleUserJoined(ws, user);
		} catch (err) {
			ws.terminate();
			logger.error('unable to connect to server', err);
		}
	}

	handleUserJoined(ws: WebSocket, user: User) {
		logger.info('user joined', { user });
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
		logger.info('user left', { user: session.user });
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

	shouldBroadcast(user?: User) {
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
		logger.info('Sending a broadcast message to all clients! Review!!');
		logger.info(message);
		ProxyConnection.openConnections.forEach((connection) => {
			connection.sendToClient(message);
		});
	}

	broadcastExceptForUser(message: any, userId: string) {
		logger.info('Sending a broadcast message to all clients except user! Review!!');
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
