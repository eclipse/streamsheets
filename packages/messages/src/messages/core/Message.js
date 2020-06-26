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

module.exports = class Message {

	constructor(type = 'message', id = IdGenerator.generate()) {
		this._type = type;
		this._id = id;
	}

	get id() {
		return this._id;
	}

	get type() {
		return this._type;
	}

};
