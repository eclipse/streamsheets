const { GatewayMessagingProtocol, Topics } = require('@cedalo/protocols');
const { MessagingClient } = require('@cedalo/messaging-client');
const IdGenerator = require('@cedalo/id-generator');
const RedisConnection = require('./RedisConnection');

const logger = require('../utils/logger').create({ name: 'ServerConnection' });

const LOG_EV_HANDLER = (event) =>
	logger.info(
		`${event.type}-event from server ${event.server}: ${event.data}`
	);

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
		message: 'ServerConnection: Timeout'
	});
};


module.exports = class ServerConnection {
	constructor(type, serviceType) {
		this.id = IdGenerator.generate();
		this.type = type;
		this.serviceType = serviceType;
		// request timeout in ms:
		this.timeout = 500000;
		this._evHandler = null;
		this._pendingRequests = new Map();
		this.messagingClient = new MessagingClient();
		if (type === 'machineserver') {
			this._redisConnection = RedisConnection.connect();
			this.stepEventHandler = this.stepEventHandler.bind(this);
		}
		this.messagingClient.connect(
			process.env.MESSAGE_BROKER_URL || 'mqtt://localhost:1883'
		);
	}

	set eventHandler(handler) {
		this._evHandler = handler;
	}

	get eventHandler() {
		return this._evHandler || LOG_EV_HANDLER;
	}

	confirmMachineStep(machineId) {
		if (this._redisConnection) this._redisConnection.confirmMachineStep(machineId);
	}

	stepEventHandler(stepEvent) {
		this.eventHandler({ type: 'step', server: this.type, data: stepEvent });
	}

	async connect() {
		if (this.type === 'machineserver') {
			this.messagingClient.subscribe(Topics.SERVICES_MACHINES_OUTPUT);
		} else if (this.type === 'graphserver') {
			this.messagingClient.subscribe(Topics.SERVICES_GRAPHS_OUTPUT);
		}
		this.messagingClient.on('message', (topic, message) => {
			this.handleMessage(message.toString(), topic);
		});
	}

	disconnect() {
		if (this._redisConnection) {
			const request = (machineId, type) => ({ machineId, type, requestId: Math.random() });
			this._redisConnection.subscriptions.forEach((subscription) => {
				const { machineId } = subscription;
				this.send(request(machineId, GatewayMessagingProtocol.MESSAGE_TYPES.UNSUBSCRIBE_MACHINE_MESSAGE_TYPE));
				this.send(request(machineId, GatewayMessagingProtocol.MESSAGE_TYPES.UNSUBSCRIBE_GRAPH_MESSAGE_TYPE));
			});
			// finally
			this._redisConnection.close();
		}
		this.messagingClient.end();
	}

	// TODO: improve this, because this way one instance of this class
	// handles both messages from the machine service and the graph service
	_handleTopicUnsubscribe(message) {
		switch (message.type) {
			case GatewayMessagingProtocol.MESSAGE_TYPES
				.UNSUBSCRIBE_MACHINE_MESSAGE_TYPE:
				if (this._redisConnection) {
					this._redisConnection.unsubscribe(message.machineId);
				}
				this.messagingClient.unsubscribe(
					`${Topics.SERVICES_MACHINES_EVENTS}/${message.machineId}`
				);
				break;
			case GatewayMessagingProtocol.MESSAGE_TYPES
				.UNSUBSCRIBE_GRAPH_MESSAGE_TYPE:
				this.messagingClient.unsubscribe(
					`${Topics.SERVICES_GRAPHS_EVENTS}/${message.machineId}`
				);
				break;
			default:
				break;
		}
	}

	// TODO: improve this, because this way one instance of this class
	// handles both messages from the machine service and the graph service
	_handleTopicSubscribe(messageType, message) {
		switch (messageType) {
			case GatewayMessagingProtocol.MESSAGE_TYPES.LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE:
			case GatewayMessagingProtocol.MESSAGE_TYPES.SUBSCRIBE_MACHINE_MESSAGE_TYPE:
				this._redisConnection.subscribe(message.machine.id, this.stepEventHandler);
				this.messagingClient.subscribe(`${Topics.SERVICES_MACHINES_EVENTS}/${message.machine.id}`);
				break;
			case GatewayMessagingProtocol.MESSAGE_TYPES.LOAD_SUBSCRIBE_GRAPH_MESSAGE_TYPE:
			case GatewayMessagingProtocol.MESSAGE_TYPES.SUBSCRIBE_GRAPH_MESSAGE_TYPE:
				this.messagingClient.subscribe(`${Topics.SERVICES_GRAPHS_EVENTS}/${message.graph.machineId}`);
				break;
			default:
				break;
		}
	}

	// if request id is specified we wait for a response...
	send(message, requestId) {
		message.sender = {
			id: this.id
		};
		this._handleTopicUnsubscribe(message);
		return new Promise((resolve, reject) => {
			if (requestId) {
				this._pendingRequests.set(requestId, { resolve, reject });
				const timeoutId = setTimeout(
					() => timeoutHandler(requestId, this._pendingRequests),
					this.timeout
				);
				this._pendingRequests.set(requestId, {
					resolve,
					reject,
					timeoutId
				});
			} else {
				resolve();
			}
			logger.info(`Send message to ${this.type}: ${message.type}`);
			this.messagingClient.publish(
				`${Topics.BASE_TOPIC}/services/${this.serviceType}/input`,
				message
			);
		});
	}

	// TODO: extract this logic into separate class
	// eslint-disable-next-line
	handleMessage(message, topic) {
		try {
			const parsedMessage = JSON.parse(message);
			// 1.) Handle request response
			const request = deletePendingRequest(
				parsedMessage.requestId,
				this._pendingRequests
			);
			if (request) {
				if (parsedMessage.type === 'response') {
					this._handleTopicSubscribe(
						parsedMessage.requestType,
						parsedMessage.response
					);
					return request.resolve(parsedMessage);
				}
				return request.reject(parsedMessage);
			}
			// 2.) Handle events
			if (parsedMessage.type === 'event') {
				const { event } = parsedMessage;
				// 2.1) Ignore streamsheet steps and named_cells
				if (event.type === 'streamsheet_step' || event.type === 'named_cells') {
					// 2.2) command events coming from the graph service
				} else if (event.type === 'command') {
					// ignore if we send command...
					if (!this._requestTriggeredFromThisConnection(event.options)) {
						return this.eventHandler({
							type: 'message',
							server: this.type,
							data: message
						});
					}
				} else {
					// 2.3) all other events
					return this.eventHandler({
						type: 'message',
						server: this.type,
						data: message
					});
				}
				// 3.) All other types of messages
			} else {
				return this.eventHandler({
					type: 'message',
					server: this.type,
					data: message
				});
			}
		} catch (error) {
			// TODO: handle better
			console.error(error);
			console.log(message);
		}
	}

	_requestTriggeredFromThisConnection(options) {
		if (options && options.originalSender) {
			return options.originalSender.id === this.id;
		}
		return false;
	}
};
