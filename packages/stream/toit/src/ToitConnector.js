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
const grpc = require("@grpc/grpc-js")
const sdk = require('@cedalo/sdk-streams');

module.exports = class ToitConnector extends sdk.Connector {
	constructor(consumerConfig) {
		super(consumerConfig);
		this._channel = null;
	}

	get channel() {
		return this._channel;
	}

	hasUserProperties(userProperties) {
		return typeof userProperties === 'object' && Object.keys(userProperties).length > 0;
	}

	async connect() {
		if (this._channel) {
			return;
		}
		try {
			const credentials = grpc.credentials.createSsl();

			const token = this.config.connector.apikey;

			const channel = new grpc.Channel("api.toit.io",
				grpc.credentials.combineChannelCredentials(credentials,
					grpc.credentials.createFromMetadataGenerator((_, cb) => {
						const metadata = new grpc.Metadata();
						metadata.set("Authorization", `Bearer ${token}`);
						cb(null, metadata);
					})), {});

			this._channel = channel;
			this.setConnected();
			this.registerDefaultListeners();
		} catch (e) {
			this.handleError(e);
		}
	}

	registerDefaultListeners() {
		// TODO(florian): maybe something like this._channel.watchConnectivityState ?
	}

	async dispose() {
		if (this.channel) {
			const channel = this.channel;
			this._channel = null
			channel.close();
		}
	}
};
