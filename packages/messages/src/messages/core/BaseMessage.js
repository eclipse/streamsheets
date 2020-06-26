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

const Message = require('./Message');

module.exports = class BaseMessage extends Message {

	_getConfig() {
		return {};
	}

	toJSON() {
		return Object.assign(
			{
				type: this._type,
				id: this._id
			}, this._getConfig());
	}

};
