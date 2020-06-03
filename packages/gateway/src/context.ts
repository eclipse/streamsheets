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
import { LoggerFactory } from '@cedalo/logger';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import { baseAuth, BaseAuth } from './authorization';
import { glue, RawAPI } from './glue';
import { MachineServiceProxy } from './machine';
import { StreamRepositoryProxy } from './stream';
import { GenericGlobalContext, GlobalContext, RequestContext, Session } from './streamsheets';
import { createUserRepository } from './user';
const {
	RepositoryManager,
	MongoDBGraphRepository,
	MongoDBMachineRepository,
	MongoDBBackupRestoreManager,
	MongoDBConfigurationRepository,
	MongoDBConnection
} = require('@cedalo/repository');
const { MongoDBStreamsRepository } = require('@cedalo/service-streams');
const logger = LoggerFactory.createLogger('gateway - context', process.env.STREAMSHEETS_LOG_LEVEL || 'info');

const encryptionContext = {
	hash: async (string: string) => {
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(string, salt);
		return hash;
	},
	verify: async (hash: string, string: string) => {
		const match = await bcrypt.compare(string, hash);
		return match;
	}
};

export type GatewayPlugin = { apply: (context: GenericGlobalContext<RawAPI, BaseAuth>) => Promise<GlobalContext> };

const getActor = async (context: RequestContext, session: Session) => {
	const actor = await context.rawApi.user.findUserBySession(context as RequestContext, session);
	if (!actor) {
		throw new Error('User not found!');
	}
	return actor;
};

const getRequestContext = async (globalContext: GlobalContext, session: Session): Promise<RequestContext> => {
	const actor = await globalContext.getActor(globalContext, session);
	return (<unknown>glue(globalContext, actor)) as RequestContext;
};

const applyPlugins = async (context: GenericGlobalContext<RawAPI, BaseAuth>, pluginModules: string[]) => {
	return pluginModules.reduce(async (prev, mod) => {
		const currentConfig = await prev;
		try {
			// eslint-disable-next-line
			logger.info(`Loading plugin: ${mod}`);
			const pluginMod: GatewayPlugin = require(mod);
			const appliedPlugin = await pluginMod.apply(currentConfig);
			logger.info(`Successfully loaded plugin: ${mod}`);
			return appliedPlugin;
		} catch (error) {
			logger.error(`Failed load plugin: ${mod}`, error.message);
		}
		return currentConfig;
	}, Promise.resolve(context));
};

export const init = async (config: any, plugins: string[]) => {
	const mongoClient: MongoClient = await MongoDBConnection.create();
	const graphRepository = new MongoDBGraphRepository(config.mongodb);
	const machineRepository = new MongoDBMachineRepository(config.mongodb);
	const streamRepositoryLegacy = new MongoDBStreamsRepository(config.mongodb);
	const backupRestoreManager = new MongoDBBackupRestoreManager(config.mongodb);
	const configurationRepository = new MongoDBConfigurationRepository(config.mongodb);
	RepositoryManager.init({
		graphRepository,
		machineRepository,
		streamRepositoryLegacy,
		backupRestoreManager,
		configurationRepository
	});

	RepositoryManager.streamRepository = new StreamRepositoryProxy();
	RepositoryManager.userRepository = createUserRepository(mongoClient.db().collection('users'));
	await RepositoryManager.connectAll(mongoClient);
	await RepositoryManager.setupAllIndicies();

	const machineServiceProxy = new MachineServiceProxy();
	// TODO: Remove after creation of admin is possible in setup
	const users = await RepositoryManager.userRepository.findAllUsers();
	if (users.length === 0) {
		const pwhash = await encryptionContext.hash('1234');
		await RepositoryManager.userRepository.createUser({
			id: '00000000000000',
			username: 'admin',
			password: pwhash,
			settings: { locale: 'en' },
			admin: true
		});
	}

	const context = await applyPlugins(
		{
			mongoClient,
			interceptors: {},
			repositories: RepositoryManager,
			encryption: encryptionContext,
			machineRepo: RepositoryManager.machineRepository,
			userRepo: RepositoryManager.userRepository,
			streamRepo: RepositoryManager.streamRepository,
			rawAuth: baseAuth,
			authStrategies: {},
			middleware: {},
			rawApi: RawAPI,
			machineServiceProxy,
			getActor,
			getRequestContext,
			login: async (context: GlobalContext, username: string, password: string) => {
				try {
					const hash = await context.userRepo.getPassword(username);
					const valid = await context.encryption.verify(hash, password);
					if (!valid) {
						throw new Error('INVALID_CREDENTIALS');
					}
					const user = await context.userRepo.findUserByUsername(username);
					if (!user) {
						throw new Error('INVALID_CREDENTIALS');
					}
					return user;
				} catch (e) {
					if (e.code === 'USER_NOT_FOUND') {
						throw new Error('INVALID_CREDENTIALS');
					}
					throw e;
				}
			}
		} as GlobalContext,
		plugins
	);

	return context;
};
