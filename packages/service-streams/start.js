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
const StreamsService = require('./src/StreamsService');
const metadata = require('./meta.json');
const packageJSON = require('./package.json');
const { LoggerFactory } = require('@cedalo/logger');
const process = require('process');

const logger = LoggerFactory.createLogger(
	'Stream Service',
	process.env.STREAMSHEETS_STREAMS_SERVICE_LOG_LEVEL
);
metadata.version = packageJSON.version;

process.on('unhandledRejection', (error) => {
	// Won't execute
	logger.error('unhandledRejection');
	logger.error(error);
});

process.on('uncaughtException', (err) => {
	logger.error('uncaughtException');
	logger.error(err);
});

const service = new StreamsService(metadata);
const start = async () => {
	await service.start();
	logger.info('Streams service started');
};

process.on('SIGTERM', () => {
	logger.warn('SIGTERM signal received.');
	service.stop().then(() => {
		logger.warn('Service stopped. Exiting ...');
		process.exit(0);
	});
});

start();
