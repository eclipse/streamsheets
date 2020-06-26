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
const mongodb = require('mongodb');
const logger = require('@cedalo/logger').create({ name: 'MongoDBConnection' });

const defaultOptions = {
	host: process.env.MONGO_HOST || 'localhost',
	port: parseInt(process.env.MONGO_PORT, 10) || 27017,
	database: process.env.MONGO_DATABASE || 'test',
	username: process.env.MONGO_USERNAME,
	password: process.env.MONGO_PASSWORD
};

const mapLegacyOptions = ({
	MONGO_HOST,
	MONGO_PORT,
	MONGO_DATABASE,
	MONGO_USERNAME,
	MONGO_PASSWORD
} = {}) => {
	const options = {};
	if (MONGO_HOST) {
		options.host = MONGO_HOST;
	}
	if (MONGO_PORT) {
		options.port = MONGO_PORT;
	}
	if (MONGO_DATABASE) {
		options.database = MONGO_DATABASE;
	}
	if (MONGO_USERNAME) {
		options.username = MONGO_USERNAME;
	}
	if (MONGO_PASSWORD) {
		options.password = MONGO_PASSWORD;
	}
	return options;
};

const authMechanism = `authMechanism=SCRAM-SHA-1`;

const buildUrl = ({ host, port, database }, auth) =>
	auth
		? `mongodb://${auth}@${host}:${port}/${database}?${authMechanism}`
		: `mongodb://${host}:${port}/${database}`;

const buildAuth = (username, password) =>
	username && password ? `${username}:${password}` : undefined;

const create = async (legacyOptions) => {
	const options = mapLegacyOptions(legacyOptions);
	const config = Object.assign({}, defaultOptions, options);

	const username = config.username
		? encodeURIComponent(config.username)
		: undefined;
	const password = config.password
		? encodeURIComponent(config.password)
		: undefined;
	const auth = buildAuth(username, password);
	const endpoint = buildUrl(config, auth);

	const redactedPassword = password ? '********' : undefined;
	const redactedAuth = buildAuth(username, redactedPassword);
	const redactedEndpoint = buildUrl(config, redactedAuth);

	try {
		logger.debug(`Connecting to MongoDB ${redactedEndpoint}`);
		const client = await mongodb.connect(endpoint);
		logger.debug(`Connected to MongoDB ${redactedEndpoint}`);
		return client;
	} catch (error) {
		logger.error(`Failed to connect to MongoDB at ${redactedEndpoint}`);
		throw error;
	}
};

module.exports = { create };
