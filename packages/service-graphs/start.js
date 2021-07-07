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
const { proc } = require('@cedalo/commons');
const { LoggerFactory } = require('@cedalo/logger');
const GraphService = require('./src/services/graphs/GraphService');
const metadata = require('./meta.json');
const packageJSON = require('./package.json');
const { LoggerFactory } = require('@cedalo/logger');
const process = require('process');

const logger = LoggerFactory.createLogger(
	'Graph Service',
);

metadata.version = packageJSON.version;
process.on('unhandledRejection', (error) => {
	logger.error('unhandledRejection', error);
});
// change process title:
proc.setProcessTitle(`GraphService_${metadata.version}`);

const service = new GraphService(metadata);
service
	.start()
	.then(() => {
		logger.info('Graph service started');
	});

process.on('SIGTERM', () => {
	logger.warn('SIGTERM signal received.');
	service.stop().then(() => {
		logger.warn('Service stopped. Exiting ...');
		process.exit(0);
	});
});
