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
'use strict';

const http = require('http');

const { RepositoryManager, MongoDBGraphRepository, MongoDBMachineRepository } = require('@cedalo/repository');

const config = require('../config/config');
const pkg = require('../../package.json');
const DefaultApp = require('../../src/rest/DefaultApp');
const Auth = require('../../src/Auth.ts').default;

Auth.jwtSecret = 'superSecret';

const graphRepository = new MongoDBGraphRepository(config.mongodb);
const machineRepository = new MongoDBMachineRepository(config.mongodb);

RepositoryManager.init({
	graphRepository,
	machineRepository
});

config.port = 8082;
config.basedir = __dirname;

http.globalAgent.maxSockets = 16384;
http.globalAgent.options.agent = false;

module.exports = {
	getApp: () => {
		const defaultApp = new DefaultApp(pkg, config, { RepositoryManager });
		return defaultApp
			.installMiddlewares()
			.then(() => defaultApp.start())
			.then((server) => ({ server, defaultApp }));
	}
};
