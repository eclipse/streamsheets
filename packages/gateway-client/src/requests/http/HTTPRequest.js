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
/* eslint-disable no-console */

'use strict';

const fetch = require('isomorphic-fetch');

const Request = require('../Request');

class HTTPError {
	constructor({ status, statusText, url, error }) {
		this.status = status;
		this.statusText = statusText;
		this.url = url;
		this.error = error;
	}
}

module.exports = class HTTPRequest extends Request {
	constructor(baseEndpoint, token) {
		super();
		this._baseEndpoint = baseEndpoint;
		this._token = token;
	}

	async send() {
		 const response = await fetch(
			`${this._baseEndpoint}${this._getPath()}${this._getQueryString()}`,
			this._getConfig()
		);
		const contentType = response.headers.get('content-type');
		if (response.status >= 400) {
			if (contentType && contentType.indexOf('application/json') >= 0) {
				const body = await response.json();
				response.error = body.error ? body.error : body;
				console.error('HttpRequest failed: ', response.error);
			}
			throw new HTTPError(response);
		}
		try {
			let data;
			if (contentType) {
				if (contentType.indexOf('application/json') >= 0) {
					data = await response.json();
				} else if (contentType.indexOf('application/gzip') >= 0) {
					data = await response.blob();
				}
			}
			return this._handleResponse(data);
		} catch(error) {
			console.error(error);
			throw new Error(error);
		}
	}

	_getPath() {
		throw new Error('Method _getPath() must be implemented by subclass.');
	}

	_getConfig() {
		throw new Error('Method _getConfig() must be implemented by subclass.');
	}

	_getQueryString() {
		return '';
	}

	_handleResponse(response) {
		return response;
	}

	_createAuthHeader(optionalToken) {
		const optionalAuthHeader = {};
		if (optionalToken) {
			optionalAuthHeader.Authorization = `JWT ${optionalToken}`;
		}
		return optionalAuthHeader;
	}

	_createGETConfig(optionalHeaders = {}, optionalAuthHeader) {
		const headers = Object.assign(
			{
				Accept: 'application/json'
			},
			optionalHeaders,
			optionalAuthHeader
		);
		// TODO: enable
		/*
		const headers = {
			Accept: 'application/json',
			...optionalHeaders,
			...optionalAuthHeader,
		}
		*/
		const result = {
			method: 'get',
			headers
		};
		return result;
	}

	_createPOSTConfig(
		optionalBodyObject,
		optionalHeaders = {},
		optionalAuthHeader
	) {
		const headers = Object.assign(
			{
				Accept: 'application/json'
			},
			optionalHeaders,
			optionalAuthHeader
		);
		return this._createPayloadConfig('post', optionalBodyObject, headers);
	}

	_createPayloadConfig(method, optionalBody, optionalHeaders = {}) {
		const optionalAuthHeader = this._createAuthHeader();
		const headers = Object.assign(
			this._getDefaultHeaders(),
			optionalHeaders,
			optionalAuthHeader
		);
		const payloadConfig = {
			method,
			headers
			// TODO: enable
			/*
			headers: {
				'Content-type': 'application/json; charset=UTF-8',
				Accept: 'application/json',
				...optionalHeaders,
				...optionalAuthHeader,
			},
			*/
		};
		if (optionalBody) {
			this._setBodyToPayloadConfig(payloadConfig, optionalBody);
		}
		return payloadConfig;
	}

	_getDefaultHeaders() {
		return {
			Accept: 'application/json',
			'Content-type': 'application/json; charset=UTF-8'
		};
	}

	_setBodyToPayloadConfig(payloadConfig, body) {
		payloadConfig.body = JSON.stringify(body);
	}

	_createDELETEConfig(optionalHeaders) {
		const optionalAuthHeader = this._createAuthHeader();
		const headers = Object.assign(
			{
				Accept: 'application/json'
			},
			optionalHeaders,
			optionalAuthHeader
		);
		return {
			method: 'delete',
			headers
			// TODO: enable
			/*
			headers: {
				Accept: 'application/json',
				...optionalHeaders,
				...optionalAuthHeader,
			},
			*/
		};
	}

	_createPUTConfig(optionalBodyObject, headers) {
		return this._createPayloadConfig('put', optionalBodyObject, headers);
	}
};
