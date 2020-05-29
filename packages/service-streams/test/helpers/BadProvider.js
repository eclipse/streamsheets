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
/* eslint-disable */
const sdk = require('@cedalo/sdk-streams');
const BadStream = require('./BadStream');

module.exports = class BadProvider extends sdk.Provider {

	get Consumer() {
		return BadStream;
	}

};
