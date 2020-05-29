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
const logger = require('@cedalo/logger').create({ name: 'Internal' });

const unexpected = (error) => {
	logger.error('Unexpected Error', error);
	error.type = 'INTERNAL';
	return error;
};

const isInternal = (error) => (error && error.type === 'INTERNAL') || !error.code;

const catchUnexpected = (func) => async (...args) => {
	try {
		const result = await func(...args);
		return result;
	} catch (error) {
		if (error.own) {
			throw error;
		}
		throw unexpected(error);
	}
};

module.exports = {
	unexpected,
	isInternal,
	catchUnexpected
};
