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
'use strict';

const GatewayAPI = require('./GatewayAPI');
const {
	BackupHTTPRequest,
	GetMetaInformationHTTPRequest,
	GraphQLHTTPRequest,
	GraphQLWithFileHTTPRequest,
	ImportMachineHTTPRequest,
	RestoreHTTPRequest,
	AuthenticateHTTPRequest,
	AuthenticatePathHTTPRequest
} = require('../../requests/http/HTTPRequests');

module.exports = class HTTPGatewayAPI extends GatewayAPI {
	constructor(restEndpointURL, token, logger) {
		super(logger);
		this._restEndpointURL = restEndpointURL;
		this._token = token;
	}

	set token(token) {
		this._token = token;
	}

	/**
	 * ******************************************************************************************
	 * High Level API: REST API
	 * ******************************************************************************************
	 */

	authenticate(authRequest) {
		const Request = authRequest.pathname != null ? AuthenticatePathHTTPRequest : AuthenticateHTTPRequest;
		return this.sendRequest(new Request(this._restEndpointURL, authRequest));
	}

	getMetaInformation() {
		return this.sendRequest(
			new GetMetaInformationHTTPRequest(
				this._restEndpointURL,
				this._token
			)
		);
	}

	graphql(query, variables, file) {
		if(file){
			return this.sendRequest(
				new GraphQLWithFileHTTPRequest(
					this._restEndpointURL,
					this._token,
					query,
					variables,
					file
				)
			);
		}
		return this.sendRequest(
			new GraphQLHTTPRequest(
				this._restEndpointURL,
				this._token,
				query,
				variables
			)
		);
	}

	importMachine(importData, importAsNew) {
		return this.sendRequest(
			new ImportMachineHTTPRequest(
				this._restEndpointURL,
				this._token,
				importData,
				importAsNew
			)
		);
	}

	backup() {
		return this.sendRequest(
			new BackupHTTPRequest(this._restEndpointURL, this._token)
		);
	}

	restore(file) {
		return this.sendRequest(
			new RestoreHTTPRequest(this._restEndpointURL, this._token, file)
		);
	}

	/**
	 * ******************************************************************************************
	 * Low Level API
	 * ******************************************************************************************
	 */

	sendRequest(request) {
		/* eslint-disable */
		this.logger.debug('Sending request to Gateway', request);
		return request
			.send()
			.then((response) => {
				this.logger.debug('Got response from Gateway', response);
				if (request instanceof GraphQLHTTPRequest) {
					if (response.errors) {
						const error = {
							message: 'GraphQL Error',
							errors: response.errors
						};
						throw error;
					}
					return response.data;
				}
				return response;
			})
			.catch((error) => {
				this.logger.error(
					'Sending request to Gateway',
					request._getPath()
				);
				this.logger.error(
					'Sending request to Gateway',
					request._getConfig()
				);
				this.logger.error(
					`Error while communicating with Gateway while executing request '${
						request.constructor.name
					}'`,
					error
				);
				throw error;
			});
		/* eslint-enable */
	}
};
