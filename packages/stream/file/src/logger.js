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
const { create } = require('@cedalo/logger');

// const level = process.env.STREAM_SERVICE_LOG_LEVEL || 'info';

module.exports = {
	// level,
	create: ({ name = 'File-Stream-Logger' } = {}) => create({ name })
};
