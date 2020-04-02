import bcrypt from 'bcryptjs';
const {
	RepositoryManager,
	MongoDBGraphRepository,
	MongoDBMachineRepository,
	MongoDBBackupRestoreManager,
	MongoDBConfigurationRepository,
	MongoDBConnection
} = require('@cedalo/repository');
const { MongoDBStreamsRepository } = require('@cedalo/service-streams');
import { User } from './user/types';
const { createUserRepository } = require('./user/UserRepository');
import { StreamRepositoryProxy } from './stream';
import glue, { RawAPI } from './glue';
import { Session, GlobalContext } from './streamsheets';
import { LoggerFactory } from '@cedalo/logger';
import { baseAuth } from './authorization';
import { MachineServiceProxy } from './machine';
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

export type GatewayPlugin = { apply: (context: GlobalContext) => Promise<GlobalContext> };

const applyPlugins = async (context: GlobalContext, pluginModules: string[]) => {
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
	const mongoConnection = await MongoDBConnection.create();
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
	
	RepositoryManager.userRepository = createUserRepository(mongoConnection.db().collection('users'));
	// TODO: Remove after creation of admin is possible in setup
	const users = await RepositoryManager.userRepository.findAllUsers();
	if (users.length === 0) {
		const pwhash = await encryptionContext.hash('1234');
		await RepositoryManager.userRepository.createUser({
			id: '00000000000000',
			username: 'admin',
			email: 'admin@cedalo.com',
			password: pwhash,
			scope: { id: 'root' },
			role: 'developer'
		});
	}

	// create an internal viewer user if not present:
	if(users.filter((user: User) => user.username === 'sharedmachine').length === 0) {
		const pwhash = await encryptionContext.hash(`${Math.random()}`);
		await RepositoryManager.userRepository.createUser({
			id: '00000000000001',
			username: 'sharedmachine',
			email: 'info@cedalo.com',
			password: pwhash,
			scope: { id: 'viewer' },
			role: 'developer'
		});
	}

	RepositoryManager.streamRepository = new StreamRepositoryProxy();
	await RepositoryManager.connectAll(mongoConnection);
	await RepositoryManager.setupAllIndicies();
	const machineServiceProxy = new MachineServiceProxy();

	const context = await applyPlugins(
		{
			repositories: RepositoryManager,
			encryption: encryptionContext,
			userRepo: RepositoryManager.userRepository,
			machineRepo: RepositoryManager.machineRepository,
			streamRepo: RepositoryManager.streamRepository,
			rawAuth: baseAuth,
			rawApi: RawAPI,
			machineServiceProxy
		},
		plugins
	);
	return context;
};

export const getRequestContext = async (globalContext: GlobalContext, session: Session) => {
	const { repositories } = globalContext;
	const actor = await repositories.userRepository.findUser(session.user.id);
	return glue(globalContext, actor);
};
