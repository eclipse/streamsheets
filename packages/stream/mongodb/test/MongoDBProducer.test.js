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
/* eslint-disable max-len */
const { TestHelper } = require('@cedalo/sdk-streams');
const streamModule = require('../index');
const { MongoMemoryServer } = require('mongodb-memory-server');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 80000;

let mongoServer;

beforeAll(async () => {
	mongoServer = new MongoMemoryServer();
	await mongoServer.getConnectionString();
});
afterAll(() => mongoServer.stop());

describe('MongoDBProduce', () => {
	it('should create a new MongoDBConnector and test() for local db', async (done) => {
		const config = {
			className: 'ProducerConfiguration',
			connector: {
				_id: 'CONNECTOR_MONGODB',
				id: 'CONNECTOR_MONGODB',
				name: 'MongoDB Connector ',
				className: 'ConnectorConfiguration',
				provider: {
					_id: 'stream-mongodb',
					id: 'stream-mongodb',
					className: 'ProviderConfiguration',
					isRef: true
				},
				host: `localhost:${await mongoServer.getPort()}`,
				dbName: 'testdb1'
			}
		};

		const producer = await TestHelper.createConnectorAndConnect(streamModule, config);
		const res = await producer._produce({
			collection: 'testCol1',
			message: {
				test: 'test'
			}
		});
		expect(res).toBeDefined();
		done();
	});
});
