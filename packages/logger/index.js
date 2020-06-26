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

const Logger = require('./src/Logger');
const LoggerFactory = require('./src/LoggerFactory');
// TODO: revise to be able to create different loggers
const logger = new Logger();

module.exports = {
	create: options => new Logger(options),
	logger,
	LoggerFactory
};
