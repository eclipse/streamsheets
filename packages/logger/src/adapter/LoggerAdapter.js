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
const error = method => new Error(`Method ${method}() must be implemented by subclass.`);

module.exports = class LoggerAdapter {

	info(/* message, ...optionals */) {
		throw error('info');
	}

	error(/* message, ...optionals */) {
		throw error('error');
	}

	warn(/* message, ...optionals */) {
		throw error('warn');
	}

	debug(/* message, ...optionals */) {
		throw error('debug');
	}

	trace(/* message, ...optionals */) {
		throw error('trace');
	}

	fatal(/* message, ...optionals */) {
		throw error('fatal');
	}

};
