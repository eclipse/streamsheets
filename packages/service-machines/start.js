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
const MachineService = require('./src/machines/MachineService');
const metadata = require('./meta.json');
const packageJSON = require('./package.json');
const logger = require('./src/utils/logger').create({ name: 'Machine Service' });
const process = require('process');


metadata.version = packageJSON.version;
process.env.STREAMSHEETS_VERSION = metadata.version;

process.on('unhandledRejection', (error) => {
	logger.error('unhandledRejection', error);
	logger.error(error);
});

const service = new MachineService(metadata);
service
	.start()
	.then(() => {
		logger.info('Machine service started');
	});

process.on('SIGTERM', () => {
	logger.warn('SIGTERM signal received.');
	service.stop().then(() => {
		logger.warn('Service stopped. Exiting ...');
		process.exit(0);
	});
});
