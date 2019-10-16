'use strict';

const FileDBMachineRepository = require('./src/machines/FileDBMachineRepository');
const InMemoryMachineRepository = require('./src/machines/InMemoryMachineRepository');
const MongoDBMachineRepository = require('./src/machines/MongoDBMachineRepository');
const MongoDBGraphRepository = require('./src/graphs/MongoDBGraphRepository');
const FileDBMessageContainerRepository = require('./src/messagecontainer/FileDBMessageContainerRepository');
const MongoDBConfigurationRepository = require('./src/configuration/MongoDBConfigurationRepository');
const MongoDBBackupRestoreManager = require('./src/mongoDB/MongoDBBackupRestoreManager');
const RepositoryManager = require('./src/RepositoryManager');
const MongoDBMixin = require('./src/mongoDB/MongoDBMixin');
const MongoDBConnection = require('./src/mongoDB/MongoDBConnection');

module.exports = {
	FileDBMachineRepository,
	InMemoryMachineRepository,
	MongoDBMachineRepository,
	FileDBMessageContainerRepository,
	MongoDBGraphRepository,
	MongoDBBackupRestoreManager,
	MongoDBConfigurationRepository,
	RepositoryManager,
	MongoDBMixin,
	MongoDBConnection
};
