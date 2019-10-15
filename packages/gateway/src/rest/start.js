'use strict';

const http = require('http');
const bcrypt = require('bcryptjs');

const config = require('../config');
const DefaultApp = require('./DefaultApp');

const pkg = require('../../package.json');

process.title = pkg.name;

config.basedir = __dirname;

const {
	RepositoryManager,
	MongoDBGraphRepository,
	MongoDBMachineRepository,
	MongoDBBackupRestoreManager,
	MongoDBConfigurationRepository,
	MongoDBConnection
} = require('@cedalo/repository');

const { createUserRepository } = require('@cedalo/graphql');

const StreamRepositoryProxy = require('./StreamRepositoryProxy');

const graphRepository = new MongoDBGraphRepository(config.mongodb);
const machineRepository = new MongoDBMachineRepository(config.mongodb);
const backupRestoreManager = new MongoDBBackupRestoreManager(config.mongodb);
const configurationRepository = new MongoDBConfigurationRepository(config.mongodb);

RepositoryManager.init({
	graphRepository,
	machineRepository,
	backupRestoreManager,
	configurationRepository
});
config.RepositoryManager = RepositoryManager;

config.encryption = {
	hash: async (string) => {
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(string, salt);
		return hash;
	},
	verify: async (hash, string) => {
		const match = await bcrypt.compare(string, hash);
		return match;
	}
};

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

http.globalAgent.maxSockets = 16384;
http.globalAgent.options.agent = false;

function start(gatewayService) {
	config.gatewayService = gatewayService;
	const app = new DefaultApp(pkg, config);
	return app.installMiddlewares().then(() => app.start());
}

module.exports = start;
