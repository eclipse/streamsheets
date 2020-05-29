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
const { ConsumerMixin } = require('@cedalo/sdk-streams');
const MongoDBConnector = require('./MongoDBConnector');

module.exports = class MongoDBConsumer extends ConsumerMixin(MongoDBConnector) {

	constructor(config) {
		super(config);
		this._client = null;
		this._changeStreamsMap = new Map();
	}

	async initialize() {
		return this._subscribeAll(this.config.collections);
	}

	async _subscribeAll(cols) {
		return Promise.all(cols.map(async col => this._subscribeOne(col)));
	}

	async _subscribeOne(collectionName) {
		try {
			const db = await this.client.db(this.dbName);
			const res = await db.collection(collectionName).find({});
			if (!res) {
				throw new Error(`Database ${this.dbName} does not exist`);
			}
			this.logger.debug(`Subscribing to ${collectionName}`);
			const collection = await db.collection(collectionName);
			const changeStream = collection.watch();
			changeStream.on('change', (change) => {
				this.logger.debug(`changestream change${JSON.stringify(change)}`);
				return this.onMessage(collectionName, change);
			});
			changeStream.on('error', (err) => {
				err.message = `Failed watching to ${this.dbName}/${collectionName}: ${err.message}`;
				this.handleError(err);
			});
			changeStream.on('close', () => {
				this.logger.debug('changestream closed');
			});
			changeStream.on('end', () => {
				this.logger.debug('changestream ended');
			});
			this._changeStreamsMap.set(collectionName, changeStream);
			return changeStream;
		} catch (e) {
			this.logger.warn(`Failed registering collection listener for collection ${collectionName}`);
			return this.handleError(e);
		}
	}

	async _unsubscribeOne(collectionName) {
		const changeStream = this._changeStreamsMap.get(collectionName);
		if (changeStream) {
			try {
				this._changeStreamsMap.delete(collectionName);
				changeStream.close();
			} catch (e) {
				const message = `Failed to unsubscribe collection ${collectionName}`;
				this.handleError({ message, warning: e });
			}
		}
	}

};
