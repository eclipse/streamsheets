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

class ConsoleLogger {
	info(message, ...optionals) {
		console.info(message, ...optionals);
	}

	error(message, ...optionals) {
		console.error(message, ...optionals);
	}

	warn(message, ...optionals) {
		console.warn(message, ...optionals);
	}

	debug(message, ...optionals) {
		console.info(message, ...optionals);
	}

	trace(message, ...optionals) {
		console.trace(message, ...optionals);
	}

	fatal(message, ...optionals) {
		console.info(message, ...optionals);
	}
}
module.exports = ConsoleLogger;
