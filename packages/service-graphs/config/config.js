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
module.exports = {
	mongodb: {
		MONGO_HOST: process.env.MONGO_HOST || 'localhost',
		MONGO_PORT: parseInt(process.env.MONGO_PORT, 10) || 27017,
		MONGO_DATABASE: process.env.MONGO_DATABASE || 'migration'
	}
};
