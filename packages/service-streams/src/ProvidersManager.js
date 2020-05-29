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
const { LoggerFactory } = require('@cedalo/logger');
const { Provider } = require('@cedalo/sdk-streams');

const logger = LoggerFactory.createLogger(
	'Streams Service - Providers Manager',
	process.env.STREAMSHEETS_STREAMS_SERVICE_LOG_LEVEL
);

const createLogger = (provider) =>
	LoggerFactory.createLogger(
		`Streams Service - ${provider}`,
		process.env.STREAMSHEETS_STREAMS_SERVICE_LOG_LEVEL
	);

const ERRORS = {
	DEFINE_PROVIDER: 'DEFINE_PROVIDER_FAIL'
};

class ProvidersManager {
	constructor({ repo, managerHandler }) {
		this.repo = repo;
		this.managerHandler = managerHandler;
		this.providers = new Map();
	}

	async defineProviders(providers, save = true) {
		logger.info('Start defining providers');
		return Promise.all(
			providers.map(async (streamModule) => {
				try {
					const p = await this.defineProvider(streamModule);
					if (p && save) return this.saveProvider(p);
				} catch (error) {
					logger.error('error defining provider');
					return this.managerHandler.handleProviderError(
						error,
						ERRORS.DEFINE_PROVIDER,
						streamModule
					);
				}
				return false;
			})
		);
	}

	async saveProvider(p) {
		return this.repo.saveConfiguration(p.config.toJSON());
	}

	async defineProvider(streamModule) {
		if (streamModule) {
			try {
				// eslint-disable-next-line
				const mod = require(streamModule);
				const streamModuleId = streamModule;// .replace(/^@cedalo\//, '');
				if (mod && mod.Provider) {
					const provider = new mod.Provider();
					provider.setLogger(createLogger(streamModuleId));
					provider.on(
						Provider.EVENTS.ERROR,
						this.managerHandler.handleProviderError
					);
					provider.config.id = streamModuleId;
					provider.config._id = streamModuleId;
					provider._id = streamModuleId;
					provider._name = provider.config.name;
					logger.info(`Defining provider: ${streamModule}`);
					this.providers.set(streamModuleId, provider);
					return provider;
				}
				logger.error(`No provider to load for: ${streamModule}`);
			} catch (err) {
				logger.error(`Failed to load provider: ${streamModule}`, err);
			}
			return null;
		}
		return null;
	}

	get providersList() {
		return Array.from(this.providers.values());
	}
}
ProvidersManager.ERRORS = ERRORS;

module.exports = ProvidersManager;
