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

// https://cedalo.atlassian.net/browse/DL-665
const connectorConfig = {
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
};
const producerConfig = {
	name: 'Local mongo feeder',
	className: 'ProducerConfiguration',
	connector: connectorConfig,
	collection: 'testcol'
};

const sample = {
	test: 'test',
	test1: 'test1'
};

const MONGOSTORE = async (connector, message, collection) => {
	const commandResult = await connector.produce({
		message,
		collection
	});
	return commandResult;
};

/**
 * MONGOQUERY() query
 * @param connector
 * @param collection
 * @param query JSON with the MongoDB Query as JSON
 * @param (optional)  resultkeys (def=[]) - A range of cells defining the projection fields
 * @param (optional) targetRange Cells TargetRange (if ommited then METADATA and
 *  DATA is included in the result, otherwise the fieldnames below DATA are returned
 *  and placed into the Targetrange according to Resultkeys-Template
 * @param (optional) pageSelector - page id (if omitted or 0 then all documents are returned)
 * @returns {Promise<Promise<*>|*>}
 * @constructor
 */
const MONGOQUERY = async (
		connector, collection, query = {}, resultKeys = [], pageSize = 0,
		page = 0) => {
	const config = {
		collection,
		query,
		resultKeys,
		pageSize,
		page
	};
	return connector.request({
		Data: config,
		Metadata: {
			requestId: 1
		}
	});
};

const MONGODELETE = async (
		connector, collection, query = {}) => {
	const config = {
		type: 'DELETE',
		collection,
		query
	};
	return connector.request({
		Data: config,
		Metadata: {
			requestId: 1
		}
	});
};

describe('MongoDBFunctions', () => {
	it('should STORE and QUERY without no optional args', async (done) => {
		try {
			const connector = await TestHelper.createConnectorAndConnect(streamModule,
					producerConfig);
			const storeResult = await MONGOSTORE(connector, sample, producerConfig.collection);
			expect(storeResult.result.ok).toEqual(1);
			const _id = storeResult.insertedId;
			const result = await MONGOQUERY(connector, producerConfig.collection,
					{ _id });
			expect(result.response.DATA.length).toEqual(2); // including keys
		} catch (e) {
			console.error(e);
		}
		done();
	});
	it('should STORE, QUERY and DELETE with resultKeys defined', async (done) => {
		try {
			const connector = await TestHelper.createConnectorAndConnect(streamModule,
					producerConfig);
			const storeResult = await MONGOSTORE(connector, sample, producerConfig.collection);
			expect(storeResult.result.ok).toEqual(1);
			const _id = storeResult.insertedId;
			const result = await MONGOQUERY(connector, producerConfig.collection,
					{ _id }, ['test']);
			expect(result.response.DATA.length).toEqual(2); // including keys
			expect(Array.isArray(result.response.DATA[0])).toEqual(true);
			expect(result.response.DATA[0].length).toEqual(1);
			const r = await MONGODELETE(connector, producerConfig.collection, {
				_id
			});
			expect(r.response.DATA.result.ok).toEqual(1); // including keys
		} catch (e) {
			console.error(e);
		}
		done();
	});
	it('should STORE and QUERY with resultKeys && page defined', async (done) => {
		try {
			const connector = await TestHelper.createConnectorAndConnect(streamModule,
					producerConfig);
			const id = new Date().getMilliseconds();
			await MONGOSTORE(connector, { ...sample, id });
			await MONGOSTORE(connector, { ...sample, id });
			await MONGOSTORE(connector, { ...sample, id });
			await MONGOSTORE(connector, { ...sample, id });
			const result = await MONGOQUERY(connector, producerConfig.collection,
					{ id }, ['test', 'test1'], 2, 1);
			expect(result.response.DATA.length).toEqual(3); // including keys
			const result1 = await MONGOQUERY(connector, producerConfig.collection,
					{ id }, ['test', 'test1'], 2, 2);
			expect(result1.response.DATA.length).toEqual(3); // including keys
		} catch (e) {
			console.error(e);
		}
		done();
	});
});

