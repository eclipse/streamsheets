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
const convict = require('convict');
const path = require('path');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'Gateway - Config',
);
const env = process.env.NODE_ENV;
let APP_URL = process.env.STREAMSHEETS_APP_URL || 'http://localhost:3000';
if (env === 'production') {
	APP_URL = process.env.STREAMSHEETS_APP_URL || 'http://localhost:8081';
}

const config = convict({
	app: {
		appUrl: {
			format: 'url',
			default: APP_URL,
			env: 'STREAMSHEETS_APP_URL',
			arg: 'STREAMSHEETS_APP_URL'
		}
	},
	http: {
		port: {
			doc: 'The port to bind.',
			format: 'port',
			default: 8080,
			env: 'GATEWAY_HTTP_PORT',
			arg: 'GATEWAY_HTTP_PORT'
		},
		ipaddress: {
			doc: 'The port to bind.',
			format: 'url',
			default: 'localhost',
			env: 'GATEWAY_HTTP_HOST',
			arg: 'GATEWAY_HTTP_HOST'
		},
		secure: {
			format: 'Boolean',
			default: false
		}
	},
	auth: {
		jwtSecret: {
			format: String,
			default: '',
			env: 'JWT_SECRET',
			arg: 'JWT_SECRET'
		},
		redirectSuccessUrl: `${APP_URL}/login`,
		redirectLogoutUrl: `${APP_URL}/logout`,
		redirectFailUrl: `${APP_URL}/login`
	}
});

// Load environment dependent configuration
let filePath = '';
try {
	if (env === 'production') {
		filePath = process.env.STREAMSHEETS_GATEWAY_CONFIGURATION_PATH || 'config/config-production.json';
	} else {
		filePath = process.env.STREAMSHEETS_GATEWAY_CONFIGURATION_PATH ||
			path.join(__dirname, '..', '..', 'config', `config-development.json`);
	}
	config.loadFile(filePath);
	config.validate({ allowed: 'strict' });
	logger.info('Config loaded.')
} catch (e) {
	logger.warn(e.message);
}
module.exports = config;
