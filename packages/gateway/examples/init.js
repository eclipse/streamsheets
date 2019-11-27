const config = require('../src/config');
const fs = require('fs');
const path = require('path');

const INIT_FILE = path.join(__dirname, '..', 'config', 'init.json');
const initJSON = JSON.parse(fs.readFileSync(INIT_FILE).toString());

// eslint-disable-next-line
process.env.MONGO_PORT = 27018;
process.env.MONGO_DATABASE = 'streamsheets-development';

const {
	RepositoryManager,
	MongoDBGraphRepository,
	MongoDBMachineRepository,
	MongoDBBackupRestoreManager,
	MongoDBConfigurationRepository
} = require('@cedalo/repository');

const {
	MongoDBStreamsRepository
} = require('@cedalo/service-streams');

const graphRepository = new MongoDBGraphRepository(config.mongodb);
const machineRepository = new MongoDBMachineRepository(config.mongodb);
const streamRepositoryLegcay = new MongoDBStreamsRepository(config.mongodb);
const backupRestoreManager = new MongoDBBackupRestoreManager(config.mongodb);
const configurationRepository = new MongoDBConfigurationRepository(config.mongodb);

RepositoryManager.init({
	graphRepository,
	machineRepository,
	streamRepositoryLegcay,
	backupRestoreManager,
	configurationRepository
});

const connectDatabases = async () => RepositoryManager.connectAll().then(() =>
	RepositoryManager.setupAllIndicies()
);

(async () => {
	await connectDatabases();
	await RepositoryManager.populateDatabases(initJSON);
	process.exit(0);
})();
