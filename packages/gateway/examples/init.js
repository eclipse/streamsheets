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
const config = require('../src/config');
const fs = require('fs');
const path = require('path');

const INIT_DIRECTORY = path.join(__dirname, '..', 'config');

const files = fs.readdirSync(INIT_DIRECTORY);
const initJSON = {
	machines: [],
	streams: []
};
files.forEach(file => {
	const json = JSON.parse(fs.readFileSync(path.join(INIT_DIRECTORY, file)).toString());
	if (json.machines) {
		initJSON.machines = [...initJSON.machines, ...json.machines];
	}
	if (json.streams) {
		initJSON.streams = [...initJSON.streams, ...json.streams];
	}
});

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
