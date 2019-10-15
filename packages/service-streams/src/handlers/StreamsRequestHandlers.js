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
						logger.debug(result);
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
				logger.debug(result);
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
			const existingConf = streamsManager.configurations.find(
				(c) => c.id === configuration.id
			);
			try {
				const result = await streamsManager.saveConfiguration(
					configuration
				);
				logger.debug(result);
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

class DeleteConfigurationRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_CONFIG_DELETE);
	}

	handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const { configId } = message;
		return new Promise(async (resolve, reject) => {
			const result = await streamsManager.deleteConfiguration(configId);
			logger.debug(result);
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

	handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		return new Promise(async (resolve, reject) => {
			const streams = await streamsManager.configsManager.loadConfigurations();
			const streamsWithStatus = streams.map((stream) => {
				stream.status = streamsManager.streamsMonitor.streamsStatusMap.get(
					stream.id
				);
				return stream;
			});
			const result = {
				streams: streamsWithStatus
				// queueStrategies,
			};
			if (result) {
				resolve(this.confirm(message, result));
			} else {
				reject(
					this.reject({}, 'Failed to retrieve all DS configurations!')
				);
			}
		});
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
				.map((stream) => stream.name);
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
			logger.debug(result);
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

class TestRequestHandler extends RequestHandler {
	constructor() {
		super(MESSAGE_TYPES.STREAM_TEST);
	}

	handle(handlerArgs) {
		const { message, streamsManager } = handlerArgs;
		const { config } = message;
		return new Promise(async (resolve, reject) => {
			const result = await streamsManager.test(config);
			logger.debug(result);
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
						`Failed to test() with config '${JSON.stringify(
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
	LoadAllConfigurationsRequestHandler,
	ReloadAllRequestHandler,
	UpdateRequestHandler,
	TestRequestHandler,
	LookUpRequestHandler,
	StreamCommandRequestHandler,
	MetaInformationRequestHandler
};
