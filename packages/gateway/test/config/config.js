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
	socketserver: {
		// the port this server will listen on
		port: 0,
		host: process.env.WS_HOST || '0.0.0.0',
		// the port this server will connect to (machine server)
		serverport: parseInt(process.env.WS_PORT, 10) || 8087,
		// the host this server will connect to (machine server)
		serverhost: process.env.WS_HOST || 'localhost'
	},
	scaffolds: {
		defaultNode: {
			title: 'Default node',
			index: 0,
			type: 'node'
		}
	},
	mongodb: {
		MONGO_HOST: process.env.MONGO_HOST || 'localhost',
		MONGO_PORT: parseInt(process.env.MONGO_PORT, 10) || 27017,
		MONGO_DATABASE: process.env.MONGO_DATABASE || 'unit-tests-gateway'
	},
	gateway: {
		host: process.env.GATEWAY_HOST || 'localhost',
		port: parseInt(process.env.GATEWAY_HTTP_PORT, 10) || 8091,
		path: '/machineserver-proxy',
		// eslint-disable-next-line
		jwtToken: process.env.GATEWAY_JWTTOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJtYWNoaW5lc2VydmVyIiwiaWF0IjoxNDk0NDA3NzY5fQ.8Colz53DqouU4P4rERvzRK7Tkin4hkkGb7PMtLLg_74'
	}
};
