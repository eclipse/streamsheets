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
const toitAuthModels = require("@toit/api/src/toit/api/auth_pb");
const toitAuthStub = require("@toit/api/src/toit/api/auth_grpc_pb");
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

	login(credentials, username, password) {
		return new Promise((resolve, reject) => {
			let channel = new grpc.Channel("api.toit.io", credentials, {});
			let client = new toitAuthStub.AuthClient("", null, { channelOverride: channel });
			let loginRequest = new toitAuthModels.LoginRequest();
			loginRequest.setUsername(username);
			loginRequest.setPassword(password);
			client.login(loginRequest, function (err, response) {
				channel.close();
				if (err) {
					reject(err);
				} else if (!response) {
					reject("Empty response was returned from login")
				} else {
					resolve(response);
				};
			});
		});
	}

	async connect() {
		if (this._channel) {
			return;
		}
		try {
			const credentials = grpc.credentials.createSsl();
			const auth = await this.login(credentials, this.config.connector.userName, this.config.connector.password);

			const token = Buffer.from(auth.getAccessToken_asU8(),  "utf-8");

			const channel = new grpc.Channel("api.toit.io",
				grpc.credentials.combineChannelCredentials(credentials,
					grpc.credentials.createFromMetadataGenerator((_, cb) => {
						const metadata = new grpc.Metadata();
						metadata.set("Authorization", "Bearer " + token);
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
