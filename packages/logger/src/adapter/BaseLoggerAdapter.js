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
const LoggerAdapter = require('./LoggerAdapter');

module.exports = class BaseLoggerAdapter extends LoggerAdapter {

	info(message, ...optionals) {
		this.logger.info(message, ...optionals);
	}

	error(message, ...optionals) {
		this.logger.error(message, ...optionals);
	}

	warn(message, ...optionals) {
		this.logger.warn(message, ...optionals);
	}

	debug(message, ...optionals) {
		this.logger.debug(message, ...optionals);
	}

	trace(message, ...optionals) {
		this.logger.trace(message, ...optionals);
	}

	fatal(message, ...optionals) {
		this.logger.fatal(message, ...optionals);
	}

	get logger() {
		throw new Error('Method logger() must be implemented by subclass.');
	}
};
