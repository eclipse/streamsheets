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
const { RequestHandler } = require('@cedalo/service-core');
const {
	StreamsMessagingProtocol: { MESSAGE_TYPES }
} = require('@cedalo/protocols');
const { logger } = require('@cedalo/logger');

const VERSION = require('../../package.json').version;
const BUILD_NUMBER = require('../../meta.json').buildNumber;

class StreamCommandRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_COMMAND_MESSAGE_TYPE);
	}

	handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const { cmd } = message;
		return new Promise(async (resolve, reject) => {
			try {
				const { streamId } = cmd;
				if (streamId) {
					const stream =
						streamsManager.findStream(streamId) ||
						streamsManager.configsManager.findConnector(streamId);
					if (stream) {
						const result = await streamsManager.executeCommand(cmd);
						return resolve(
							this.confirm(message, {
								result
							})
						);
					}
					return resolve(
						this.confirm(message, {
							result: {
								error: 'NO_STREAM'
							}
						})
					);
				}
				const result = await streamsManager.executeCommand(cmd);
				return resolve(
					this.confirm(message, {
						result
					})
				);
			} catch (e) {
				return reject(
					this.reject(
						cmd,
						`Failed to execute command for stream'${cmd.streamId}'!`
					)
				);
			}
		});
	}
}

class SaveConfigurationRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_CONFIG_SAVE);
	}

	handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const { configuration } = message;
		return new Promise(async (resolve) => {
			const existingConf = streamsManager.findConfiguration(configuration.id);
			try {
				const result = await streamsManager.saveConfiguration(
					configuration
				);
				if (result) {
					return resolve(
						this.confirm(message, {
							id: configuration.id,
							result,
							inserted: !existingConf ? configuration : undefined
						})
					);
				}
				return resolve(
					this.reject(message, {
						id: configuration.id,
						error: result
					})
				);
			} catch (e) {
				return resolve(
					this.reject(message, {
						id: configuration.id,
						error: e
					})
				);
			}
		});
	}
}

class ValidateConfigurationRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_CONFIG_VALIDATE);
	}

	async handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const { provider, streamType, configuration } = message;
		try {
			const result = streamsManager.validateConfiguration(provider, streamType, configuration);
			return this.confirm(message, { ...result})
		} catch (e) {
			return this.reject(message, {valid: false, error: e})
		}
	}
}

class DeleteConfigurationRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_CONFIG_DELETE);
	}

	handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const { configId } = message;
		return new Promise(async (resolve, reject) => {
			const result = await streamsManager.deleteConfiguration(configId);
			if (result) {
				resolve(
					this.confirm(message, {
						id: configId,
						result
					})
				);
			} else {
				reject(
					this.reject(
						configId,
						`Failed to save config with id '${configId}'!`
					)
				);
			}
		});
	}
}

class LoadAllConfigurationsRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAMS_CONFIG_LOAD_ALL);
	}

	async handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		try {
			const streams = await streamsManager.configsManager.loadConfigurations();
			const streamsWithStatus = streams.map((stream) => {
				stream.state = streamsManager.streamsMonitor.getStreamState(stream.id);
				return stream;
			});
			const result = {
				streams: streamsWithStatus
				// queueStrategies,
			};
			return this.confirm(message, result);
		} catch (error) {
			logger.error('Failed to retrieve all Stream configurations!', error);
			return this.reject(message, 'Failed to retrieve all Stream configurations!');
		}
	}
}

class LoadConfigurationRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_CONFIG_LOAD);
	}

	handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const { configId } = message;

		return new Promise(async (resolve, reject) => {
			const result = await streamsManager.configsManager.getConfigurationById(
				configId
			);
			if (result) {
				resolve(
					this.confirm(message, {
						result
					})
				);
			} else {
				reject(
					this.reject(
						configId,
						`Failed to load config with id '${configId}'!`
					)
				);
			}
		});
	}
}

class LoadConfigurationByNameRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_CONFIG_LOAD_BY_NAME);
	}

	async handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const { name } = message;
		const result = await streamsManager.configsManager.getConfigurationsByName(name);
		return this.confirm(message, { result });
	}
}

class GetProvidersRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_GET_PROVIDERS);
	}

	async handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const result = await streamsManager.configsManager.providers;
		return this.confirm(message, {
			result
		});
	}
}

class ReloadAllRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_RELOAD);
	}

	handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const { sources = [] } = message;
		return new Promise(async (resolve, reject) => {
			let result = {};
			const errors = [];
			await streamsManager.configsManager.loadConfigurations();
			const streams = sources
				.map(streamsManager.findConfiguration.bind(streamsManager))
				.map((stream) => stream.id);
			try {
				result = await streamsManager.reloadAll(streams);
				resolve(
					this.confirm(message, {
						streamsReloaded: true,
						result,
						streamsErrors: errors
					})
				);
			} catch (error) {
				errors.push(error);
				reject(
					this.reject(sources, {
						streamsReloaded: true,
						result: 'Failed to reload all streams!',
						streamsErrors: errors
					})
				);
			}
		});
	}
}

// not used so far:
class LookUpRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_LOOKUP_REQUEST);
	}

	handle(message, streamsManager) {
		const { name } = message;
		return new Promise(async (resolve, reject) => {
			const result = await streamsManager.getStreamOrQueue(name);
			if (result) {
				resolve(
					this.confirm(message, {
						result
					})
				);
			} else {
				reject(
					this.reject(
						name,
						`Failed to lookup stream by name '${name}'!`
					)
				);
			}
		});
	}
}

class UpdateRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_UPDATE);
	}

	handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const { config } = message;
		return new Promise(async (resolve, reject) => {
			const result = await streamsManager.updateStream(config);
			if (result) {
				resolve(
					this.confirm(message, {
						result
					})
				);
			} else {
				reject(
					this.reject(
						config,
						`Failed to update stream with '${JSON.stringify(
							config
						)}'!`
					)
				);
			}
		});
	}
}

class MetaInformationRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.META_INFORMATION_MESSAGE_TYPE);
	}

	handle(request /* , machineserver */) {
		return new Promise((resolve /* , reject */) => {
			const meta = {
				version: VERSION,
				buildNumber: BUILD_NUMBER
			};
			resolve(this.confirm(request, meta));
		});
	}
}

module.exports = {
	SaveConfigurationRequestHandler,
	DeleteConfigurationRequestHandler,
	LoadConfigurationRequestHandler,
	LoadConfigurationByNameRequestHandler,
	LoadAllConfigurationsRequestHandler,
	GetProvidersRequestHandler,
	ReloadAllRequestHandler,
	UpdateRequestHandler,
	LookUpRequestHandler,
	StreamCommandRequestHandler,
	ValidateConfigurationRequestHandler,
	MetaInformationRequestHandler
};
