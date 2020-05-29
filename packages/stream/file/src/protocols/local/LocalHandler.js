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
const LocalClient = require('./LocalClient');

module.exports = class LocalConsumerHandler {
	constructor(consumer, encoding) {
		this.consumer = consumer;
		this.encoding = encoding;
	}

	async connect() {
		this._client = new LocalClient(this.encoding);
	}

	async dispose() {
		this._client = null;
	}
};
