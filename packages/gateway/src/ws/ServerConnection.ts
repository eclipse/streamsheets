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
import { MessagingClient } from '@cedalo/messaging-client';
import { Topics } from '@cedalo/protocols';
import { PropType } from '../common';
import {
	IWSEvent,
	ServiceResponse,
	UnsubscribeGraphRequest,
	UnsubscribeMachineRequest,
	WSRequest
} from '../streamsheets';
import LoggerFactory from '../utils/logger';
import RedisConnection from './RedisConnection';

const logger = LoggerFactory.create({ name: 'ServerConnection' });

const LOG_EV_HANDLER = (event: PropType<IWSEvent, 'event'>) =>
	logger.info(`${event.type}-event from server ${event.server}: ${event.data}`);

const deletePendingRequest = (requestId: number, requests: PendingRequestMap<ServiceResponse>) => {
	const request = requests.get(requestId);
	if (request) {
		request.timeoutId && clearTimeout(request.timeoutId);
		requests.delete(requestId);
	}
	return request;
};
const timeoutHandler = (requestId: number, requests: PendingRequestMap<ServiceResponse>) => {
	const pending = deletePendingRequest(requestId, requests);
	if (pending) {
		pending.reject({
			message: 'ServerConnection: Timeout'
		});
	}
};

type PendingRequestMap<T> = Map<number, PendingRequest<T>>;

type PendingRequest<T> = {
	resolve: (value?: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
	timeoutId?: NodeJS.Timeout;
};

export default class ServerConnection {
	private id: string;
	private type: string;
	private serviceType: string;
	private timeout: number;
	private _pendingRequests: PendingRequestMap<ServiceResponse>;
	private messagingClient: MessagingClient;
	private _redisConnection?: RedisConnection;
	private _evHandler: null | ((event: any) => any);

	constructor(type: string, serviceType: string) {
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
		this.messagingClient.connect(process.env.MESSAGE_BROKER_URL || 'mqtt://localhost:1883');
	}

	set eventHandler(handler) {
		this._evHandler = handler;
	}

	get eventHandler() {
		return this._evHandler || LOG_EV_HANDLER;
	}

	confirmMachineStep(machineId: string) {
		if (this._redisConnection) this._redisConnection.confirmMachineStep(machineId);
	}

	stepEventHandler(stepEvent: string | object) {
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
			const request = (machineId: string, type: PropType<WSRequest, 'type'>) => ({
				machineId,
				type
			});
			this._redisConnection.subscriptions.forEach((subscription) => {
				const { machineId } = subscription;
				this.send(request(machineId, 'machine_unsubscribe') as UnsubscribeMachineRequest, Math.random());
				this.send(request(machineId, 'graph_unsubscribe') as UnsubscribeGraphRequest, Math.random());
			});
			// finally
			this._redisConnection.close();
		}
		this.messagingClient.end();
	}

	// TODO: improve this, because this way one instance of this class
	// handles both messages from the machine service and the graph service
	_handleTopicUnsubscribe(message: WSRequest) {
		switch (message.type) {
			case 'machine_unsubscribe':
				if (this._redisConnection) {
					this._redisConnection.unsubscribe(message.machineId);
				}
				this.messagingClient.unsubscribe(`${Topics.SERVICES_MACHINES_EVENTS}/${message.machineId}`);
				break;
			case 'graph_unsubscribe':
				this.messagingClient.unsubscribe(`${Topics.SERVICES_GRAPHS_EVENTS}/${message.machineId}`);
				break;
			default:
				break;
		}
	}

	// TODO: improve this, because this way one instance of this class
	// handles both messages from the machine service and the graph service
	_handleTopicSubscribe(message: ServiceResponse) {
		switch (message.requestType) {
			case 'machine_subscribe':
			case 'machine_load_subscribe':
				this._redisConnection?.subscribe(message.response.machine.id, this.stepEventHandler);
				this.messagingClient.subscribe(`${Topics.SERVICES_MACHINES_EVENTS}/${message.response.machine.id}`);
				break;
			case 'graph_load_subscribe':
			case 'graph_subscribe':
				this.messagingClient.subscribe(`${Topics.SERVICES_GRAPHS_EVENTS}/${message.response.graph.machineId}`);
				break;
			default:
				break;
		}
	}

	// if request id is specified we wait for a response...
	async send(message: WSRequest, requestId?: number): Promise<ServiceResponse> {
		message.sender = {
			id: this.id
		};
		this._handleTopicUnsubscribe(message);
		return new Promise((resolve, reject) => {
			if (requestId) {
				this._pendingRequests.set(requestId, { resolve, reject });
				const timeoutId = setTimeout(() => timeoutHandler(requestId, this._pendingRequests), this.timeout);
				this._pendingRequests.set(requestId, {
					resolve,
					reject,
					timeoutId
				});
			} else {
				resolve();
			}
			logger.info(`Send message to ${this.type}: ${message.type}`);
			this.messagingClient.publish(`${Topics.BASE_TOPIC}/services/${this.serviceType}/input`, message);
		});
	}

	// TODO: extract this logic into separate class
	// eslint-disable-next-line
	handleMessage(message: string, topic: string) {
		try {
			const parsedMessage = JSON.parse(message);
			// 1.) Handle request response
			const request = deletePendingRequest(parsedMessage.requestId, this._pendingRequests);
			if (request) {
				if (parsedMessage.type === 'response') {
					this._handleTopicSubscribe(parsedMessage);
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

	_requestTriggeredFromThisConnection(options: any) {
		if (options && options.originalSender) {
			return options.originalSender.id === this.id;
		}
		return false;
	}
}
