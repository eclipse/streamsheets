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

describe('MongoDBConnector', () => {
	it('should create a new MongoDBConnector and test() for local db', async () => {
		const config = {
			className: 'ConsumerConfiguration',
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
			collections: ['collection']
		};

		const feeder = await TestHelper.createConnectorAndConnect(streamModule, config);
		expect(feeder.connected).toBe(true);
	});
});
