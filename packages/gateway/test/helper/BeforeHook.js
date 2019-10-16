'use strict';

const http = require('http');

const {
	RepositoryManager,
	MongoDBGraphRepository,
	MongoDBMachineRepository
} = require('@cedalo/repository');


const config = require('../config/config');
const pkg = require('../../package.json');
const DefaultApp = require('../../src/rest/DefaultApp');

const graphRepository = new MongoDBGraphRepository(config.mongodb);
const machineRepository = new MongoDBMachineRepository(config.mongodb);

RepositoryManager.init({
	graphRepository,
	machineRepository,
});

config.RepositoryManager = RepositoryManager;

config.port = 8082;
config.basedir = __dirname;


http.globalAgent.maxSockets = 16384;
http.globalAgent.options.agent = false;

module.exports = {
	getApp: () => {
		const defaultApp = new DefaultApp(pkg, config);
		return defaultApp.installMiddlewares().then(() => defaultApp.start()).then(server => ({ server, defaultApp }));
	}
};