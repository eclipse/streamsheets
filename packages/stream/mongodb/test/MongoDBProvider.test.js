/* eslint-disable max-len */
const { TestHelper } = require('@cedalo/sdk-streams');
const streamModule = require('../index');
const MongoTestServer = require('./helpers/MongoTestServer');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 80000;

process.env.MONGO_HOST = 'localhost';
process.env.MONGO_PORT = '27018';
process.env.MONGO_USER_DB_URI = 'mongodb://localhost:27018/userDB';
process.env.MONGO_DB_USERNAME = '';
process.env.MONGO_DB_PASSWORD = '';
process.env.MONGO_USER_DATABASE = 'userdb';

const testServer = new MongoTestServer({
	instance: {
		port: Number(process.env.MONGO_PORT),
		ip: process.env.MONGO_HOST,
		dbName : process.env.MONGO_USER_DATABASE,
		debug: false
	},
});

beforeEach(() => testServer.start());
afterEach(() => testServer.stop());


describe('MongoDBProvider', () => {
	it('should create a new MongoDBProvider and test() for local db', async (done) => {

		const config = {
			name: "testConfig",
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
				externalHost: false
			},
			collections: [
				'test1'
			],
			dbName: 'testdb1'
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
					Metadata: {

					}
				});
				expect(res.response.Data.length === 1);
				done();
			}, 3000);
		} catch (e) {
			console.error(e);
		}
	});
});

