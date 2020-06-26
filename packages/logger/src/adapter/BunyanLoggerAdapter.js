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
const bunyan = require('bunyan');
const LoggerAdapter = require('./LoggerAdapter');

module.exports = class BunyanLoggerAdapter extends LoggerAdapter {
	constructor({ name = 'Bunyan Logger Adapter', level = 'debug' } = {}) {
		super();
		this._logger = bunyan.createLogger({
			name,
			level
		});
	}

	info(message, ...optionals) {
		this._logger.info(message, ...optionals);
	}

	error(message, ...optionals) {
		this._logger.error(message, ...optionals);
	}

	warn(message, ...optionals) {
		this._logger.warn(message, ...optionals);
	}

	debug(message, ...optionals) {
		this._logger.debug(message, ...optionals);
	}

	trace(message, ...optionals) {
		this._logger.trace(message, ...optionals);
	}

	fatal(message, ...optionals) {
		this._logger.fatal(message, ...optionals);
	}

	get logger() {
		return this._logger;
	}

};
