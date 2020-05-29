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
const MongoDBConnection = require('./MongoDBConnection');
const logger = require('@cedalo/logger').create({ name: 'MongoDBMixin' });

const COLLECTIONS = {
	USERS: 'users',
	GRAPHS: 'graphs',
	NODES: 'nodes',
	SCENARIOS: 'scenarios',
	MACHINE_SETTINGS: 'machine_settings',
	PROCESS_SETTINGS: 'process_settings',
	CONFIGURATIONS: 'configurations'
};

const isString = (val) => typeof val === 'string';

/**
 * An mixin that provides an API for common MongoDB functions.
 *
 * @class FileDBMixin
 * @public
 */
const MongoDBMixin = (superclass) =>
	class extends superclass {
		constructor(config) {
			super(config);
			this.config = config;
			this.db = null;
			this.COLLECTIONS = COLLECTIONS;
		}

		// sets _id property: otherwise it will be automatically set by mongo-driver...
		// and MongoDBMixin uses _id to find a document by id => actually it can work with id too...
		setMongoId(obj) {
			obj._id = obj.id;
			return obj;
		}
		//
		// delMongoId(obj) {
		// 	delete obj._id;
		// 	return obj;
		// }

		count(collection) {
			return this.db.collection(collection).count();
		}

		exists(collection, id) {
			return this.db
				.collection(collection)
				.find({ _id: id })
				.limit(-1)
				.toArray()
				.then((result) => !!result.length)
				.then((exists) =>
					exists
						? true
						: Promise.reject({
								isSemantic: true,
								message: `entity with id ${id} does not exist`
						  })
				);
		}

		insertDocument(collection, doc) {
			return this.db.collection(collection).insertOne(doc);
		}

		insertDocuments(collection, docs) {
			return this.db.collection(collection).insertMany(docs);
		}

		upsertDocument(collection, query, document) {
			return this.db
				.collection(collection)
				.replaceOne(query, document, { upsert: true });
		}

		updateDocument(collection, docId, update) {
			if (update._id) {
				logger.warn(
					'Updating a documents _id is not allowed, removing it to continue'
				);
				delete update._id;
			}

			const updateObject = {
				$set: update
			};
			return this.db
				.collection(collection)
				.updateOne({ _id: docId }, updateObject)
				.then((resp) => resp.result && resp.result.ok);
		}

		replaceDocument(collection, docId, newdoc) {
			if (newdoc._id) {
				logger.warn(
					'Updating a documents _id is not allowed, removing it to continue'
				);
				delete newdoc._id;
			}
			return this.db
				.collection(collection)
				.replaceOne({ _id: docId }, newdoc)
				.then((resp) => resp.result && resp.result.ok);
		}

		getDocument(
			collection,
			docId,
			optionalFilter = {},
			optionalProjection = {}
		) {
			const filter = Object.assign(optionalFilter, { _id: docId });
			const projection = Object.assign({ _id: 0 }, optionalProjection);
			return this.db
				.collection(collection)
				.findOne(filter, { projection });
		}

		findDocument(collection, docId, options = {}) {
			return this.db
				.collection(collection)
				.findOne({ _id: docId }, options);
		}

		getDocuments(
			collection,
			filter = {},
			optionalProjection = {},
			sortCriteria = {}
		) {
			const projection = Object.assign({ _id: 0 }, optionalProjection);
			return this.db
				.collection(collection)
				.find(filter)
				.project(projection)
				.sort(sortCriteria)
				.toArray();
		}

		deleteDocument(collection, idOrCond = {}) {
			const match = isString(idOrCond) ? { _id: idOrCond } : idOrCond;
			return this.db
				.collection(collection)
				.deleteOne(match)
				.then((resp) => resp.result && resp.result.ok);
		}
		deleteAllDocuments(collection) {
			return this.db
				.collection(collection)
				.deleteMany()
				.then((resp) => resp.result && resp.result.ok);
		}

		async connect() {
			// already connected?
			if (this.db) {
				return;
			}
			const client = await MongoDBConnection.create(this.config);
			this.db = client.db();
		}
	};
module.exports = MongoDBMixin;
