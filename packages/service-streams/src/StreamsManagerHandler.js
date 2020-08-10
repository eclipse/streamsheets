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
const { ConsumerConfiguration } = require('@cedalo/sdk-streams');
const { LoggerFactory } = require('@cedalo/logger');
const { createAndConnect } = require('@cedalo/messaging-client');

const logger = LoggerFactory.createLogger(
	'Streams Service - Streams Manager',
	process.env.STREAMSHEETS_STREAMS_SERVICE_LOG_LEVEL
);
module.exports = class StreamsManagerHandler {
	constructor(monitor) {
		this._monitor = monitor;
		this._messagingClient = null;
		this.handleProviderError = this.handleProviderError.bind(this);
	}

	async init() {
		this._messagingClient = await createAndConnect();
	}

	handleProviderError(error, stream) {
		const messageWrapper = {
			type: 'event',
			event: {
				type: GatewayMessagingProtocol.EVENTS.STREAM_CONTROL_EVENT,
				streamEventType: 'PROVIDE_ERROR',
				data: {
					timestamp: new Date(),
					stream: {
						id: stream.id,
						name: stream.name,
						scope: stream.scope,
						state: this._monitor.getStreamState(stream.id)
					},
					error: {
						name: error.name,
						message: error.message
					}
				}
			}
		};
		this._messagingClient.publish(
			`${Topics.SERVICES_STREAMS_EVENTS}/${stream.id}/error`,
			messageWrapper
		);
		logger.error(`handle provider error${error.message} ${stream.id}`);
		logger.error(error);
	}

	handleProviderNotification(notification, stream) {
		const messageWrapper = {
			type: 'event',
			event: {
				type: GatewayMessagingProtocol.EVENTS.STREAM_CONTROL_EVENT,
				streamEventType: 'PROVIDE_WARNING',
				data: {
					timestamp: new Date(),
					stream: {
						id: stream.id,
						name: stream.name,
						scope: stream.scope,
						state: this._monitor.getStreamState(stream.id)
					},
					notification
				}
			}
		};
		this._messagingClient.publish(
			`${Topics.SERVICES_STREAMS_EVENTS}/${stream.id}/notification`,
			messageWrapper
		);
		logger.warn(
			`handle provider error${notification.message} ${stream.id}`
		);
		logger.warn(notification);
	}

	onConfigUpdate(config) {
		if (config) {
			const event = {
				type: 'event',
				event: {
					type:
						GatewayMessagingProtocol.EVENTS
							.STREAM_CONTROL_EVENT,
					streamEventType: 'UPDATE',
					timestamp: new Date(),
					data: {
						stream: {
							id: config.id,
							name: config.name,
							scope: config.scope,
							state: this._monitor.getStreamState(config.id)
						},
						isStream:
							config.className === ConsumerConfiguration.name,
						config: {...config, state: this._monitor.getStreamState(config.id)}
					}
				}
			};
			logger.debug(
				`handle provider onConfigUpdate() for ${JSON.stringify(
					config || {}
				)}`
			);
			this._messagingClient.publish(
				`${Topics.SERVICES_STREAMS_EVENTS}/${config.id}/update`,
				event
			);
		}
	}

	onConfigDelete(configId, isStream, scope) {
		const event = {
			type: 'event',
			event: {
				type: GatewayMessagingProtocol.EVENTS.STREAM_CONTROL_EVENT,
				streamEventType: 'DELETE',
				timestamp: new Date(),
				data: {
					stream: {
						id: configId,
						scope
					},
					isStream
				}
			}
		};
		logger.debug(`handle provider onConfigDelete() for ${configId}`);
		this._messagingClient.publish(
			`${Topics.SERVICES_STREAMS_EVENTS}/${configId}/delete`,
			event
		);
	}
};
