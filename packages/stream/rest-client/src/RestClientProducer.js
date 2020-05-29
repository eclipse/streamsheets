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
const RestClientConnector = require('./RestClientConnector');
const { ProducerMixin, Connector, RequestResponse } = require('@cedalo/sdk-streams');

const errorResponse = (metadata, error, requestId) =>
	new RequestResponse(
		{
			Metadata: {
				...metadata,
				error: error.name || error
			},
			Data: {
				error
			}
		},
		requestId
	);

const dataResponse = (metadata, data, requestId) =>
	new RequestResponse(
		{
			Metadata: metadata,
			Data: data
		},
		requestId
	);

module.exports = class RestClientProducer extends ProducerMixin(
	RestClientConnector
) {
	constructor(config) {
		super({ ...config, type: Connector.TYPE.PRODUCER });
	}

	async request(config) {
		const connectorConfig = {
			user: this.config.connector.userName,
			pass: this.config.connector.password,
			baseUrl: this.config.connector.baseUrl
		};
		const { requestId } = config.Metadata;
		const metadata = { url: config.Data.url, method: config.Data.method };
		try {
			const response = await this._restClient.send(
				config.Data,
				connectorConfig
			);
			return this.handleResponse(
				dataResponse(metadata, response, requestId)
			);
		} catch (error) {
			return this.handleResponse(
				errorResponse(metadata, error.message, requestId)
			);
		}
	}

	async dispose() {
		// Discard all open requests
		this.handleResponse = () => null;
	}

	handleResponse(response) {
		return response;
	}
};
