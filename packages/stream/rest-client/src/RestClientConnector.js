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
const { Connector } = require('@cedalo/sdk-streams');
const { RESTClient } = require('@cedalo/rest-server-core');

module.exports = class RestClientConnector extends Connector {
	constructor(config) {
		super(config);
		this._restClient = new RESTClient();
	}

	async connect() {
		this.setConnected();
	}

	async dispose() {
		// do nothing
	}
	
};
