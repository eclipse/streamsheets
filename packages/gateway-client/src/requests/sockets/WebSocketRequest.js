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

const uuid = require('uuid/v1');

const Request = require('../Request');

module.exports = class WebSocketRequest extends Request {
	constructor(ws, type) {
		super();
		this._ws = ws;
		this._id = uuid();
		this._type = type;
	}

	get id() {
		return this._id;
	}

	send() {
		return new Promise((resolve /* , reject */) => {
			this._ws.send(JSON.stringify(this.toJSON()));
			resolve();
		});
	}

	_getConfig() {
		return {};
	}

	toJSON() {
		return Object.assign(
			{
				type: this._type,
				requestId: this._id
			},
			this._getConfig()
		);
	}
};
