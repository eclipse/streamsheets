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

module.exports = class Utils {
	static checkRequestBody(response) {
		['_topic', '_messages', '_messageReceivers'].forEach((property) => {
			if (!(property in response.body)) {
				throw new Error(`Missing property '${property}' in response`);
			}
		});
	}
};
