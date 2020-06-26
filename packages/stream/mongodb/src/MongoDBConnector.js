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
const { Connector } = require('@cedalo/sdk-streams');
const mongodb = require('mongodb');

module.exports = class MongoDBConnector extends Connector {
	constructor(config) {
		super(config);
		this._client = null;
	}

	get client() {
		return this._client;
	}

	get dbName() {
		return this.config.dbName || (this.config.connector && this.config.connector.dbName);
	}

	async connect() {
		if (!this.connected) {
			try {
				const authMechanism = this.config.connector.authType
					? `authMechanism=${this.config.connector.authType || 'DEFAULT'}`
					: '';
				const username = this.config.connector.userName
					? encodeURIComponent(this.config.connector.userName)
					: undefined;
				const password = this.config.connector.password
					? encodeURIComponent(this.config.connector.password)
					: undefined;
				const auth = authMechanism.length > 0 && username ? `${username}:${password}@` : '';
				let replicaSet = this.config.connector.clusterName
					? `replicaSet=${this.config.connector.clusterName}`
					: '';
				if (replicaSet.length > 0) {
					replicaSet = authMechanism === '' ? replicaSet : `&${replicaSet}`;
				}
				const database = this.dbName && this.dbName.length > 0 ? `${this.dbName}` : '';
				const options = !!authMechanism || !!replicaSet ? `?${authMechanism}${replicaSet}` : '';
				const dbAndOpts = database || options ? `/${database}${options}` : '';
				// mongodb://[username:password@]host1[:port1][,host2[:port2],
				// ...[,hostN[:portN]]][/[database][?options]]
				const endPoint = `mongodb://${auth}${this.config.connector.host}${dbAndOpts}`;
				this.logger.debug(`Connecting to MongoDB ${endPoint}`);
				this._client = await mongodb.connect(endPoint);
				if (this.client) {
					this.setConnected();
					return this._client;
				}
				return this.handleError('MONGODB_CANNOT_CONNECT');
			} catch (error) {
				return this.handleError(error);
			}
		}
		return this.client;
	}

	async dispose() {
		if (this._client) {
			this._client.close();
		}
	}

	// async test(config = { payload: { testme: 'testme' } }) {
	// 	const collectionName = this.config.collections[0];
	// 	return new Promise(async (resolve) => {
	// 		const fn = (topic, message) => {
	// 			this.logger.debug(`receiving at: ${topic}`);
	// 			if (topic === collectionName) {
	// 				const msg = message ? JSON.parse(message) : null;
	// 				resolve(msg.testme === config.payload.testme);
	// 			}
	// 		};
	// 		this.on('message', fn);
	// 		try {
	// 			await this._produce({
	// 				collectionName,
	// 				message: config.payload
	// 			});
	// 			setTimeout(async () => resolve(false), 20000);
	// 		} catch (e) {
	// 			resolve(false);
	// 		}
	// 	});
	// }
};
