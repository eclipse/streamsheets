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
/* global FormData */
/* eslint-disable no-console */

'use strict';

const HTTPRequest = require('./HTTPRequest');

class AuthenticateHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, params) {
		super(baseEndpoint);
		this._params = params;
	}

	_getPath() {
		return '/login';
	}

	_getConfig() {
		return this._createPOSTConfig(
			{
				...this._params
			},
			{}
		);
	}
}
class AuthenticatePathHTTPRequest extends AuthenticateHTTPRequest {
	_getPath() {
		return '/pathlogin';
	}
}

class GetMetaInformationHTTPRequest extends HTTPRequest {
	_getPath() {
		return '/meta';
	}

	_getConfig() {
		return this._createGETConfig({}, this._createAuthHeader(this._token));
	}
}

class GraphQLHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, query, variables) {
		super(baseEndpoint, token);
		this._query = query;
		this._variables = variables;
	}

	_getPath() {
		return '/graphql';
	}

	_getConfig() {
		return this._createPOSTConfig(
			{
				query: this._query,
				variables: this._variables
			},
			{},
			this._createAuthHeader(this._token)
		);
	}
}

class GraphQLWithFileHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, query, variables, file) {
		super(baseEndpoint, token);
		this.formData = new FormData();
		this.formData.append('operations', JSON.stringify({query, variables}));
		this.formData.append('map', JSON.stringify({"0": ["variables.file"]}));
		this.formData.append('0', file);
	}

	_getPath() {
		return '/graphql';
	}

	_getConfig() {
		return this._createPOSTConfig(
			this.formData,
			{},
			this._createAuthHeader(this._token)
		);
	}

	_getDefaultHeaders() {
		return {
			Accept: 'application/json'
		};
	}

	_setBodyToPayloadConfig(payloadConfig, body) {
		// don't serialize to JSON because it is form data
		payloadConfig.body = body;
	}
}

class ImportMachineHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, importData, importAsNew) {
		super(baseEndpoint, token);
		this._importData = importData;
		this._importData.importAsNew = importAsNew;
	}

	_getPath() {
		return '/import';
	}

	_getConfig() {
		return this._createPOSTConfig(
			this._importData,
			{},
			this._createAuthHeader(this._token)
		);
	}
}

class BackupHTTPRequest extends HTTPRequest {
	_getPath() {
		return '/backup';
	}

	_getConfig() {
		return this._createGETConfig(
			{
				responseType: 'blob'
			},
			this._createAuthHeader(this._token)
		);
	}
}

class RestoreHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, file) {
		super(baseEndpoint, token);
		this.formData = new FormData();
		this.formData.append('restoreData', file);
		console.log(this.formData.get('restoreData'));
	}

	_getPath() {
		return '/restore';
	}

	_getConfig() {
		return this._createPOSTConfig(
			this.formData,
			{},
			this._createAuthHeader(this._token)
		);
	}

	_getDefaultHeaders() {
		return {
			Accept: 'application/json'
		};
	}

	_setBodyToPayloadConfig(payloadConfig, body) {
		// don't serialize to JSON because it is form data
		payloadConfig.body = body;
	}
}

module.exports = {
	BackupHTTPRequest,
	AuthenticateHTTPRequest,
	AuthenticatePathHTTPRequest,
	GetMetaInformationHTTPRequest,
	GraphQLHTTPRequest,
	GraphQLWithFileHTTPRequest,
	ImportMachineHTTPRequest,
	RestoreHTTPRequest
};
