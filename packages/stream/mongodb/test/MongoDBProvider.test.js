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

describe('MongoDBProvider', () => {
	it('should create a new MongoDBProvider and test() for local db', async (done) => {
		const config = {
			name: 'testConfig',
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
			},
			collections: ['test1']
		};

		const stream = await TestHelper.provideStream(streamModule, config);
		try {
			await stream._connect();
			await stream._produce({
				collection: 'testdb',
				message: {
					test: 'msg'
				}
			});
			setTimeout(async () => {
				const res = await stream._request({
					Data: {
						functionName: 'MONGO.QUERY',
						collection: 'testdb'
					},
					Metadata: {}
				});
				expect(res.response.Data.length === 1);
				done();
			}, 3000);
		} catch (e) {
			console.error(e);
		}
	});
});
