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
module.exports = class Reader {
	constructor() {
		this._version = 0;
	}

	set version(version) {
		this._version = version;
	}

	get version() {
		return this._version;
	}

	getDocument() {}

	getObject(/* object, key */) {}

	getAttribute(/* object, key */) {}

	iterateObjects(/* object, callback */) {}

	iterateAttributes(/* object, callback */) {}
};
