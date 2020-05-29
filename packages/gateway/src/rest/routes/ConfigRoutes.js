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
const CONFIG = require('../../config').get('app');

module.exports = class ConfigRoutes {
	static async config(request, response) {
		response.status(200).json(CONFIG);
	}
};
