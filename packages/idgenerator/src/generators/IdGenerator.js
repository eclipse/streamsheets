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
const uuidv1 = require('uuid/v1');
const shortid = require('shortid');

module.exports = class IdGenerator {

	generate() {
		return this.generateShortId();
	}

	generateUUID() {
		return uuidv1();
	}

	generateShortId() {
		return shortid.generate();
	}

}