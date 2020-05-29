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
const pop3 = require('./pop3');

module.exports = class PopConnector extends Connector {

	constructor(config) {
		super(config);
		this._pop3 = null;
		this.currentConfig = null;
	}

	async connect() {
		try {
			if (!this.config.connector.host) {
				throw new Error('No host specified');
			}
			this._pop3 = await pop3.create(this.config);
			this.setConnected();
		} catch (e) {
			this.handleError(e);
			await this.dispose();
		}
	}

	async dispose() {
		if (this._pop3) {
			this._pop3.dispose();
			this._pop3 = null;
		}
	}

};
