const logger = require('../utils/logger').create({ name: 'SocketServer' });
const { GatewayMessagingProtocol } = require('@cedalo/protocols');

const utils = require('../utils');
const Auth = require('../Auth');
const ProxyConnection = require('./ProxyConnection');
const InterceptorChain = require('./interceptors/InterceptorChain');
const AuthorizationInterceptor = require('./interceptors/AuthorizationInterceptor');
const GraphServerInterceptor = require('./interceptors/GraphServerInterceptor');
const MachineServerInterceptor = require('./interceptors/MachineServerInterceptor');
const WebSocket = require('ws');

const DEFAULTS = {
	host: '0.0.0.0',
	port: 8088,
	path: '/machineserver-proxy',
	tokenKey: 'authToken',
};

module.exports = class SocketServer {
	constructor(config = DEFAULTS, gatewayService) {
		this._config = Object.assign({}, DEFAULTS, config);
		this._gatewayService = gatewayService;
		this.wssConfig = {};
		this.wssConfig.port = this._config.port;
		this.wssConfig.host = this._config.host;
		this.wssConfig.path = this._config.path;
		this.wssConfig.clientTracking = true;
		this.wssConfig.verifyClient = this._verifyClient.bind(this);
		this.wss = null;
		this.interceptorchain = new InterceptorChain();
		this.interceptorchain.add(new AuthorizationInterceptor());
		this.interceptorchain.add(new GraphServerInterceptor());
		this.interceptorchain.add(new MachineServerInterceptor());
	}

	_verifyClient(info, cb) {
		utils
			.getUserFromWebsocketRequest(info.req, this._config.tokenKey, Auth.parseToken.bind(Auth))
			.then(() => cb(true))
			.catch((error) => {
				logger.warn('unable to verify client:', error && error.message ? error.message : error);
				cb(false, 401, 'Unauthorized')
			});
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

	async handleConnection(ws, request) {
		try {
			const user = await utils.getUserFromWebsocketRequest(
				request,
				this._config.tokenKey,
				Auth.parseToken.bind(Auth)
			);
			// create & connect new client-connection...
			this.connectClient(ProxyConnection.create(ws, request, user, this));
			this.handleUserJoined(ws, user);
		} catch (err) {
			ws.terminate();
			logger.error('unable to connect to server', err);
		}
	}

	handleUserJoined(ws, user) {
		logger.info('user joined', { user });
		if (this.shouldBroadcast(user)) {
			const message = {
				type: 'event',
				event: {
					type: GatewayMessagingProtocol.EVENTS.USER_JOINED_EVENT,
					user
				}
			};
			this.broadcastExceptForUser(message, user);
		}
	}

	logoutUser({ clientId }) {
		return this.findConnectionsByClientId(clientId).forEach((c) => this.logoutConnection(c));
	}

	logoutConnection(connection) {
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

	handleUserLeft(session) {
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
			this.broadcastExceptForUser(message, session);
		}
	}

	shouldBroadcast(user) {
		return user && user.userId;
	}

	connectClient(client) {
		client.interceptor = this.interceptorchain;
		client.connectGraphServer().catch((error) => {
			logger.error('Graph service not available!');
			logger.error(error);
		});
		client.connectMachineServer().catch((error) => {
			logger.error('Machine service not available!');
			logger.error(error);
		});
	}

	handleRestRequest(message, user) {
		const connection = this.findConnectionByUser(user);
		return connection
			? connection.sendToServer(message)
			: Promise.reject(new Error(`No connection found for given user: ${user}`));
	}

	findConnectionByUser(session) {
		let connection = null;
		ProxyConnection.openConnections.forEach((client) => {
			connection = client.id === session.id ? client : connection;
		});
		return connection;
	}

	findConnectionsByUser(user) {
		const connections = [...ProxyConnection.openConnections];
		return connections.filter((connection) => connection.user && connection.user.userId === user.userId);
	}

	findConnectionsByClientId(clientId) {
		const connections = [...ProxyConnection.openConnections];
		return connections.filter((connection) => connection.user && connection.clientId === clientId);
	}

	broadcast(message) {
		logger.info('Sending a broadcast message to all clients! Review!!');
		logger.info(message);
		ProxyConnection.openConnections.forEach((connection) => {
			connection.sendToClient(message);
		});
	}

	broadcastExceptForUser(message, session) {
		const userConnection = this.findConnectionByUser(session);
		const userConnectionId = userConnection && userConnection.user && userConnection.user.userId;
		logger.info('Sending a broadcast message to all clients except user! Review!!');
		ProxyConnection.openConnections.forEach((connection) => {
			if (connection.user && connection.user.userId !== userConnectionId) {
				connection.sendToClient(message);
			}
		});
	}

	registerMachineServer(socketurl) {
		// eslint-disable-next-line
		logger.info(
			`register machineserver at: ${socketurl} to ${ProxyConnection.openConnections.size} open connection(s)...`
		);
		ProxyConnection.openConnections.forEach((client) => client.connectMachineServer(socketurl));
	}

	registerGraphServer(socketurl) {
		// eslint-disable-next-line
		logger.info(
			`register graphserver at: ${socketurl} to ${ProxyConnection.openConnections.size} open connection(s)...`
		);
		ProxyConnection.openConnections.forEach((client) => client.connectGraphServer(socketurl));
	}

	close() {
		if (this.wss) {
			this.wss.close(); // terminates all connections => ProxyConnection#close() should be called automatically...
			this.wss = null;
		}
	}
};
