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
const { createUserRepository } = require('./user/UserRepository');
import StreamRepositoryProxy from './StreamRepositoryProxy';
import glue, { RawAPI } from './glue';
import { Session, GlobalContext } from './streamsheets';
import { LoggerFactory } from '@cedalo/logger';
import { baseAuth } from './authorization';
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

export type GatewayPlugin = { apply: (context: GlobalContext) => GlobalContext };

const applyPlugins = async (context: GlobalContext, pluginModules: string[]) => {
	return pluginModules.reduce(async (prev, mod) => {
		const currentConfig = await prev;
		try {
			// eslint-disable-next-line
			const pluginMod: GatewayPlugin = require(mod);
			return pluginMod.apply(currentConfig);
		} catch (error) {
			logger.error(`Failed to apply plugin: ${mod}`, error.message);
		}
		return currentConfig;
	}, Promise.resolve(context));
};

export const init = async (config: any, plugins: string[]) => {
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
	RepositoryManager.userRepository = {
		connect: async () => {
			const mongoConnection = await MongoDBConnection.create();
			RepositoryManager.userRepository = createUserRepository(mongoConnection.db().collection('users'));
			// TODO: Remove after creation of admin is possible in setup
			const users = await RepositoryManager.userRepository.findAllUsers();
			if (users.length === 0) {
				const pwhash = await config.encryption.hash('1234');
				await RepositoryManager.userRepository.createUser({
					id: '00000000000000',
					username: 'admin',
					email: 'admin@cedalo.com',
					password: pwhash
				});
			}
		}
	};
	RepositoryManager.streamRepository = new StreamRepositoryProxy();
	await RepositoryManager.connectAll();
	await RepositoryManager.setupAllIndicies();

	const context = await applyPlugins(
		{
			repositories: RepositoryManager,
			encryption: encryptionContext,
			userRepo: RepositoryManager.userRepository,
			machineRepo: RepositoryManager.machineRepository,
			rawAuth: baseAuth,
			rawApi: RawAPI
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
