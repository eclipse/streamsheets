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
const IdGenerator = require('@cedalo/id-generator');
const BaseMessage = require('./BaseMessage');

module.exports = class RequestMessage extends BaseMessage {
	
	constructor(type, requestId = IdGenerator.generate()) {
		super(type);
		this._requestId = requestId;
	}

	toJSON() {
		return Object.assign(
			{
				id: this._id,
				type: this._type,
				requestId: this._id
			}, this._getConfig());
	}

	_getConfig() {
		return {};
	}

}
