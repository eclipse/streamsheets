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
const BaseLoggerAdapter = require('./BaseLoggerAdapter');

module.exports = class ConsoleLoggerAdapter extends BaseLoggerAdapter {

	get logger() {
		return console;
	}

	debug(message, ...optionals) {
		this.info(message, ...optionals);
	}

	fatal(message, ...optionals) {
		this.error(message, ...optionals);
	}

};
