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
const { ProducerMixin, RequestResponse } = require('@cedalo/sdk-streams');
const MongoDBConnector = require('./MongoDBConnector');
const mongodb = require('mongodb');
const MongoDBFunctions = require('./MongoDBFunctions');

const keyregex = new RegExp('\\[([^\\]]*)\\]', 'g');

const parse = (str) => {
	const res = [];
	if (str && typeof str === 'string') {
		str.replace(keyregex, (g0, g1) => res.push(g1));
	}
	return res;
};

const getPath = (str) => {
	// TODO: Required to support out jsonpath. Remove when replaced with real jsonpath
	const parsed = parse(str);
	if (parsed.length > 0) {
		return parsed.join('.');
	}
	return str;
};

const buildProjection = (resultKeys) => {
	let projection = {};
	if (resultKeys && Array.isArray(resultKeys) && resultKeys.length > 0) {
		resultKeys.forEach((field) => {
			projection[getPath(field)] = 1;
		});
		if (!resultKeys.includes('_id')) {
			projection._id = 0;
		}
	}
	if (typeof resultKeys === 'string' && resultKeys.length > 0) {
		projection = {
			[getPath(resultKeys)]: 1
		};
		if (resultKeys !== '_id') {
			projection._id = 0;
		}
	}
	if (Object.keys(projection) < 1) {
		return undefined;
	}
	return projection;
};

module.exports = class MongoDBProducer extends ProducerMixin(MongoDBConnector) {
	async produce(config) {
		const { query, functionName } = config;
		if (query && query._id) {
			config.query._id = mongodb.ObjectID(query._id);
		}
		const client = await this.connect();
		const db = client.db(this.dbName);
		let result;
		switch (functionName) {
			case MongoDBFunctions.REPLACE:
				result = await this._replace(db, config);
				break;
			case MongoDBFunctions.STORE:
			default:
				result = await this._insert(db, config);
				break;
		}
		return result;
	}

	async _insert(db, config) {
		const { collection, message } = config;
		try {
			const doc = typeof message === 'string' ? JSON.parse(message) : message;
			this.logger.debug(`Publishing to ${collection}`);
			const res = await db.collection(collection || this.config.collection).insertOne(doc);
			return res;
		} catch (e) {
			return this.handleWarningOnce(e, 'PUBLISH ERROR');
		}
	}

	async _replace(db, config) {
		const { collection, message, query, upsert } = config;
		try {
			const doc = typeof message === 'string' ? JSON.parse(message) : message;
			this.logger.debug(`Replacing in ${collection} where ${JSON.stringify(query)}. Upsert: ${upsert}`);
			const res = await db.collection(collection || this.config.collection).replaceOne(query, doc, { upsert });
			return res;
		} catch (e) {
			return this.handleWarningOnce(e);
		}
	}

	async request(config_) {
		const requestId = config_.Metadata.requestId;
		const config = config_.Data;
		const { query } = config;
		if (query && query._id) {
			config.query._id = mongodb.ObjectID(query._id);
		}
		// this.logger.debug(JSON.stringify(config.Data));
		let response;
		switch (config.functionName) {
			case MongoDBFunctions.QUERY:
				response = await this._queryFindASync(config);
				break;
			case MongoDBFunctions.DELETE:
				response = await this._queryDelete(config);
				break;
			case MongoDBFunctions.AGGREGATE:
				response = await this._queryAggregate(config);
				break;
			case MongoDBFunctions.COUNT:
				response = await this._queryCount(config);
				break;

			default:
				response = await this._queryFindASync(config);
		}
		return new RequestResponse(response, requestId);
	}

	/**
	 * @param collection
	 * @param query JSON with the MongoDB Query as JSON
	 * @param (optional)  resultkeys (def=[]) - the projection fields
	 * @param (optional) targetRange Cells TargetRange (if ommited then METADATA and
	 *  DATA is included in the result, otherwise the fieldnames below DATA are returned
	 *  and placed into the Targetrange according to Resultkeys-Template. This requires result
	 * @param (optional) page - page id (if omitted or 0 then all documents are returned)
	 * @returns {Promise<Promise<*>|*>}
	 * @constructor
	 */

	async _queryDelete(config) {
		const { collection, query = {} } = config;
		const resultMessage = {
			Metadata: {
				collection
			},
			Data: []
		};
		try {
			const client = await this.connect();
			const db = client.db(this.dbName);
			const { result } = await db.collection(collection).remove(query);
			resultMessage.Data = result;
		} catch (e) {
			resultMessage.Metadata.error = e.message;
			this.handleWarningOnce(e);
		}
		return resultMessage;
	}

	async _queryCount({ collection, query }) {
		const result = {
			Metadata: {
				collection
			},
			Data: {}
		};
		try {
			const client = await this.connect();
			const db = client.db(this.dbName);
			result.Data.count = await db
				.collection(collection)
				.find(query)
				.count();
		} catch (err) {
			result.Metadata.error = err.message;
			this.handleWarningOnce(err);
		}
		return result;
	}

	async _queryAggregate({ collection, query }) {
		const result = {
			Metadata: {
				collection
			},
			Data: {}
		};
		try {
			const client = await this.connect();
			const db = client.db(this.dbName);
			result.Data = await db
				.collection(collection)
				.aggregate(query)
				.toArray();
		} catch (err) {
			result.Metadata.error = err.message;
			this.handleWarningOnce(err);
		}
		return result;
	}

	// MONGOQUERY(Connector, Collection, QueryJSON, TargetBox, [ResultKeys], [PageSize], [Page])
	async _queryFindASync(config) {
		const { collection, query = {}, resultKeys = [], pageSize = 0, page = 0 } = config;
		const result = {
			Metadata: {
				collection,
				page
			},
			Data: []
		};
		try {
			const projection = buildProjection(resultKeys);
			result.Metadata.projection = projection;
			const limit = pageSize;
			const skip = page === 0 ? 0 : (page - 1) * limit;
			const sort = config.sort === '-1' || config.sort === '1' ? { _id: parseInt(config.sort, 10) } : config.sort;
			result.Data = await this._doQueryFind(collection, query, projection, skip, limit, sort);
		} catch (e) {
			result.Metadata.error = e.message;
			this.handleWarningOnce(e);
		}
		return result;
	}

	async _doQueryFind(collection, query, projection, skip, limit, sort) {
		const client = await this.connect();
		const db = client.db(this.dbName);

		return db
			.collection(collection)
			.find(query, {
				sort,
				projection,
				limit,
				skip
			})
			.toArray();
	}
};
