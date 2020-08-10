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
const { Topics, GatewayMessagingProtocol } = require('@cedalo/protocols');
const {
	Events,
} = require('@cedalo/sdk-streams');
const { LoggerFactory } = require('@cedalo/logger');
const { createAndConnect } = require('@cedalo/messaging-client');
const { redis, streamSubscribersKey } = require('./redis');

const logger = LoggerFactory.createLogger(
	'Streams Service - Streams Manager',
	process.env.STREAMSHEETS_STREAMS_SERVICE_LOG_LEVEL
);

const getStreamType = (stream) => {
	let type = '';
	switch (stream.config.className) {
		case 'ConsumerConfiguration':
			type = 'stream';
			break;
		case 'ProducerConfiguration':
			type = 'producer';
			break;
		case 'ConnectorConfiguration':
			type = 'connector';
			break;
		default:
			type = ''
	}
	return type;
};

const MAXIMUM_MESSAGE_SIZE =
	parseInt(process.env.STREAMSHEET_MAX_MESSAGE_SIZE, 10) || 100000;

const transformMessage = (message) => {
	const jsonMessage = JSON.stringify(message);
	const messageSize = Buffer.byteLength(jsonMessage, 'utf8');
	if (messageSize > MAXIMUM_MESSAGE_SIZE) {
		const maxSizeErrorMessage = message.copy({
			data: {
				error: {
					message: `Maximum message size of ${MAXIMUM_MESSAGE_SIZE} bytes exceeded`,
					size: messageSize
				}
			}
		});
		return JSON.stringify(maxSizeErrorMessage);
	}
	return jsonMessage;
};

module.exports = class StreamsMonitor {
	constructor() {
		this.streams = new Map();
		this.streamsStatusMap = new Map();
	}

	getStreamState(streamId) {
		const status = this.streamsStatusMap.get(streamId);
		const signal = status ? status.streamEventType.toLowerCase() : '';
		switch (signal) {
			case 'connect':
				return 'connected';
			case 'dispose':
				return 'disconnected';
			case 'warning':
				return 'connected'; // 'connected with warning'
			default:
				return 'disconnected';
		}
	};

	async init() {
		this._messagingClient = await createAndConnect();
		this._messagingClient.subscribe(
			`${Topics.SERVICES_STREAMS_INPUT}/+/action/+`
		);
		this._messagingClient.on('message', async (topic, message) => {
			try {
				const msg = JSON.parse(message);
				const { streamId } = msg;
				if (streamId) {
					const stream_ = this.streams.get(streamId);
					if (!stream_) {
						logger.warn(`no stream found with id${streamId}`);
						return;
					}
					delete msg.streamId;
					if (topic.endsWith('/publish') && stream_._produce) {
						stream_._produce(msg);
					} else if (topic.endsWith('/respond') && stream_._respond) {
						stream_._respond(msg);
					} else if (topic.endsWith('/request')) {
						try {
							const response = await stream_._request(msg);
							this._messagingClient.publish(
								`${Topics.SERVICES_STREAMS_EVENTS}/${
									stream_.id
								}/response`,
								response
							);
						} catch (error) {
							logger.error(
								'Unhandled stream request error: ',
								error
							);
						}
					}
				}
			} catch (e) {
				logger.error(e); // FIXME
			}
		});
	}

	addStream(stream) {
		if(this.streams.has(stream.id)) {
			this.removeStream(this.streams.get(stream.id));
		}
		stream.on(Events.CONNECTOR.CONNECT, () => this.onConnect(stream));
		stream.on(Events.CONNECTOR.ERROR, (error) =>
			this.onError(error, stream)
		);
		stream.on(Events.CONNECTOR.WARNING, (warning) =>
			this.onWarning(warning, stream)
		);
		stream.on(Events.CONNECTOR.DISPOSED, () => this.onDisposed(stream));
		if (stream.config.className !== 'ProducerConfiguration') {
			stream.on(Events.CONSUMER.MESSAGE, (topic, message) =>
				this.onMessage(topic, message, stream)
			);
		}
		this.streams.set(stream.id, stream);
	}

	removeStream(stream) {
		stream.removeAllListeners();
		this.streams.delete(stream.id);
	}

	disposeAll() {
		Array.from(this.streams.values()).map((stream) =>
			this.removeStream(stream)
		);
	}

	async onMessage(topic, message, stream) {
		const jsonMessage = transformMessage(message);
		redis.queueAll(streamSubscribersKey(stream.id, stream.config.scope.id), jsonMessage);
	}

	onError(error, stream) {
		if (this.streams.has(stream.id)) {
			const err = error
				? {
						name: error.name,
						message: error.message
				  }
				: {};
			const messageWrapper = this._wrapMessage(
				stream,
				Events.CONNECTOR.ERROR,
				{ error: err }
			);
			this._messagingClient.publish(
				`${Topics.SERVICES_STREAMS_EVENTS}/${stream.id}/error`,
				messageWrapper
			);
		}
	}

	onWarning(warning, stream) {
		if (this.streams.has(stream.id)) {
			const messageWrapper = this._wrapMessage(
				stream,
				Events.CONNECTOR.WARNING,
				{
					warning: {
						name: warning.name || warning,
						message: warning.message || warning
					}
				}
			);
			this._messagingClient.publish(
				`${Topics.SERVICES_STREAMS_EVENTS}/${stream.id}/warning`,
				messageWrapper
			);
		}
	}

	onConnect(stream) {
		const messageWrapper = this._wrapMessage(
			stream,
			Events.CONNECTOR.CONNECT
		);
		this._messagingClient.publish(
			`${Topics.SERVICES_STREAMS_EVENTS}/${stream.id}/connect`,
			messageWrapper
		);
	}

	onDisposed(stream) {
		logger.debug(`${stream.id || stream.config.id} onDisposed()`);
		const messageWrapper = this._wrapMessage(
			stream,
			Events.CONNECTOR.DISPOSED,
			{}
		);
		this._messagingClient.publish(
			`${Topics.SERVICES_STREAMS_EVENTS}/${stream.id}/dispose`,
			messageWrapper
		);
	}

	_wrapMessage(stream, streamEventType, payload = {}) {
		this.streamsStatusMap.set(stream.id, { streamEventType, payload });
		const type = getStreamType(stream);
		const state = this.getStreamState(stream.id);
		return {
			type: 'event',
			event: {
				type: GatewayMessagingProtocol.EVENTS.STREAM_CONTROL_EVENT,
				streamEventType,
				data: {
					timestamp: new Date(),
					stream: {
						scope: stream.config.scope,
						id: stream.config.id,
						name: stream.config.name,
						className: stream.config.className,
						type,
						state,
					},
					...payload
				}
			}
		};
	}
};
