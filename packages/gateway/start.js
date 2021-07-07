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
/* eslint-disable no-console */
const { proc, moduleResolver: { resolve } } = require('@cedalo/commons');
const { LoggerFactory } = require('@cedalo/logger');
const GatewayService = require('./src/services/gateway/GatewayService');
const initializer = require('./src/initializer');
// eslint-disable-next-line
const metadata = require('../meta.json');
// eslint-disable-next-line
const packageJSON = require('../package.json');
const initContext = require('./src/context').init;
const config = require('./src/config');
const path = require('path');
const process = require('process');

const logger = LoggerFactory.createLogger('Gateway Service', process.env.GATEWAY_SERVICE_LOG_LEVEL);

metadata.version = packageJSON.version;

process.on('unhandledRejection', error => {
	console.log('unhandledRejection', error.message);
});
// change process title:
proc.setProcessTitle(`Gateway_${metadata.version}`);


const resolvePlugins = async () => {
	const moduleDir = path.resolve(process.env.PLUGINS_MODULE_DIR || 'plugins');
	logger.info(`Looking for plugins in ${moduleDir}`);
	const modules = await resolve(moduleDir);
	return modules;
};

const run = async () => {
	const plugins = await resolvePlugins();

	const globalContext = await initContext(config, plugins);
	const service = new GatewayService(metadata, globalContext);
	await service.start();
	initializer.setup(service);
	logger.info('Gateway service started');

	process.on('SIGTERM', () => {
		logger.warn('SIGTERM signal received.');
		service.stop().then(() => {
			logger.warn('Service stopped. Exiting ...');
			process.exit(0);
		});
	});

};

run();
