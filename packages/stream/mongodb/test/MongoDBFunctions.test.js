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
let connectorConfig;
let producerConfig;
let connector;

beforeAll(async () => {
	mongoServer = new MongoMemoryServer();
	await mongoServer.getConnectionString();
	connectorConfig = {
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
	};
	producerConfig = {
		name: 'Local mongo feeder',
		className: 'ProducerConfiguration',
		connector: connectorConfig
	};
	connector = await TestHelper.createConnectorAndConnect(streamModule, producerConfig);
});

afterAll(() => mongoServer.stop());

const sample1 = {
	id: 1,
	name: 'test',
	nested: {
		other: 'value'
	}
};
const sample2 = {
	id: 2,
	name: 'test2',
	nested: {
		other: 'other'
	}
};

const MONGOSTORE = async (connector_, collection, message) => {
	const commandResult = await connector_.produce({
		message,
		collection,
		functionName: 'MONGO.STORE'
	});
	return commandResult;
};

const MONGOREPLACE = async (connector_, collection, query, message, upsert = false) => {
	const commandResult = await connector_.produce({
		message,
		collection,
		query,
		upsert,
		functionName: 'MONGO.REPLACE'
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
const MONGOQUERY = async (connector_, collection, query = {}, resultKeys = [], pageSize = 0, page = 0, sort) => {
	const config = {
		collection,
		query,
		resultKeys,
		pageSize,
		page,
		sort,
		functionName: 'MONGO.QUERY'
	};
	return connector_.request({
		Data: config,
		Metadata: {
			requestId: 1
		}
	});
};

const MONGODELETE = async (connector_, collection, query = {}) => {
	const config = {
		functionName: 'MONGO.DELETE',
		collection,
		query
	};
	return connector_.request({
		Data: config,
		Metadata: {
			requestId: 1
		}
	});
};

const newCollection = () => Math.random().toString();

describe('MongoDBFunctions', () => {
	describe('MONGO.STORE', () => {
		it('store without optional args', async () => {
			const collection = newCollection();
			const storeResult = await MONGOSTORE(connector, collection, sample1);
			const { insertedId } = storeResult;
			expect(storeResult.result.ok).toEqual(1);
			const result = await MONGOQUERY(connector, collection, {});
			expect(result.message.data).toHaveLength(1);
			expect(result.message.data[0]).toEqual({ _id: insertedId, ...sample1 });
		});
	});
	describe('MONGO.REPLACE', () => {
		const REPLACEMENT = {
			id: 3,
			name: 'replacemnt'
		};
		test('replace with match', async () => {
			const collection = newCollection();
			await MONGOSTORE(connector, collection, sample1);

			const storeResult = await MONGOREPLACE(connector, collection, { id: 1 }, REPLACEMENT);
			expect(storeResult.result.ok).toEqual(1);
			const result = await MONGOQUERY(connector, collection, {});
			expect(result.message.data).toHaveLength(1);
			expect(result.message.data[0]).toMatchObject(REPLACEMENT);
		});
		test('replace with match and upsert', async () => {
			const collection = newCollection();
			await MONGOSTORE(connector, collection, sample1);

			const storeResult = await MONGOREPLACE(connector, collection, { id: 1 }, REPLACEMENT, true);
			expect(storeResult.result.ok).toEqual(1);
			const result = await MONGOQUERY(connector, collection, {});
			expect(result.message.data).toHaveLength(1);
			expect(result.message.data[0]).toMatchObject(REPLACEMENT);
		});
		test('replace with no match', async () => {
			const collection = newCollection();

			const storeResult = await MONGOREPLACE(connector, collection, { id: 1 }, REPLACEMENT);
			expect(storeResult.result.ok).toEqual(1);
			expect(storeResult.result.n).toEqual(0);
			const result = await MONGOQUERY(connector, collection, {});
			expect(result.message.data).toHaveLength(0);
		});

		test('replace with no match and upsert', async () => {
			const collection = newCollection();

			const storeResult = await MONGOREPLACE(connector, collection, { id: 1 }, REPLACEMENT, true);
			expect(storeResult.result.ok).toEqual(1);
			expect(storeResult.result.n).toEqual(1);
			const result = await MONGOQUERY(connector, collection, {});
			expect(result.message.data).toHaveLength(1);
			expect(result.message.data[0]).toMatchObject(REPLACEMENT);
		});
	});
	describe('MONGO.QUERY', () => {
		const collection = newCollection();
		beforeAll(async () => {
			await MONGOSTORE(connector, collection, sample1);
			await MONGOSTORE(connector, collection, sample2);
		});
		test('query with empty query returns all docuements', async () => {
			const result = await MONGOQUERY(connector, collection, {});
			expect(result.message.data).toHaveLength(2);
			expect(result.message.data[0]).toMatchObject(sample1);
			expect(result.message.data[1]).toMatchObject(sample2);
		});
		test('query by field returns matching documents', async () => {
			const result = await MONGOQUERY(connector, collection, { id: 1 });
			expect(result.message.data).toHaveLength(1);
			expect(result.message.data[0]).toEqual(sample1);
		});
		test('query with simple resultKeys returns only specified keys', async () => {
			const result = await MONGOQUERY(connector, collection, { id: 1 }, ['id']);
			expect(result.message.data).toHaveLength(1);
			expect(result.message.data[0]).toEqual({ id: 1 });
		});
		test('query with resultKeys path returns only specified keys', async () => {
			const result = await MONGOQUERY(connector, collection, { id: 1 }, ['[nested][other]']);
			expect(result.message.data).toHaveLength(1);
			expect(result.message.data[0]).toEqual({ nested: { other: 'value' } });
		});
		test('query with page returns specified page with page index starting at 1', async () => {
			const resultPage1 = await MONGOQUERY(connector, collection, {}, undefined, 1, 1);
			expect(resultPage1.message.data).toHaveLength(1);
			expect(resultPage1.message.data[0]).toMatchObject(sample1);
			const resultPage2 = await MONGOQUERY(connector, collection, {}, undefined, 1, 2);
			expect(resultPage2.message.data).toHaveLength(1);
			expect(resultPage2.message.data[0]).toMatchObject(sample2);
		});
		test('query with simple sort by _id', async () => {
			const result1 = await MONGOQUERY(connector, collection, {}, undefined, undefined, undefined, '1');
			expect(result1.message.data).toHaveLength(2);
			expect(result1.message.data[0]).toMatchObject(sample1);
			const result2 = await MONGOQUERY(connector, collection, {}, undefined, undefined, undefined, '-1');
			expect(result2.message.data).toHaveLength(2);
			expect(result2.message.data[0]).toMatchObject(sample2);
		});
		test('query with sort by id', async () => {
			const result1 = await MONGOQUERY(connector, collection, {}, undefined, undefined, undefined, { id: 1 });
			expect(result1.message.data).toHaveLength(2);
			expect(result1.message.data[0]).toMatchObject(sample1);
			const result2 = await MONGOQUERY(connector, collection, {}, undefined, undefined, undefined, { id: -1 });
			expect(result2.message.data).toHaveLength(2);
			expect(result2.message.data[0]).toMatchObject(sample2);
		});
	});
	describe('MONGO.DELETE', () => {
		test('should delete all documents matching the query', async () => {
			const collection = newCollection();
			await MONGOSTORE(connector, collection, sample1);
			await MONGOSTORE(connector, collection, sample2);

			const result = await MONGODELETE(connector, collection, { id: 1 });
			expect(result.message.data.n).toBe(1);
			expect(result.message.data.ok).toBe(1);

			const queryResult = await MONGOQUERY(connector, collection, { id: 1 });
			expect(queryResult.message.data).toHaveLength(0);
		});
		test('should delete no document if query has no match', async () => {
			const collection = newCollection();
			await MONGOSTORE(connector, collection, sample1);
			await MONGOSTORE(connector, collection, sample2);

			const result = await MONGODELETE(connector, collection, { id: 3 });
			expect(result.message.data.n).toBe(0);
			expect(result.message.data.ok).toBe(1);
		});
		test('should delete all documents with empty query', async () => {
			const collection = newCollection();
			await MONGOSTORE(connector, collection, sample1);
			await MONGOSTORE(connector, collection, sample2);

			const result = await MONGODELETE(connector, collection, {});
			expect(result.message.data.n).toBe(2);
			expect(result.message.data.ok).toBe(1);
			console.log(result.message.data);

			const queryResult = await MONGOQUERY(connector, collection, {});
			expect(queryResult.message.data).toHaveLength(0);
		});
	});
});
