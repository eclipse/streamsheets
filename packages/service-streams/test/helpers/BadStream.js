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
/* eslint-disable */
const sdk = require('@cedalo/sdk-streams');

module.exports = class BadStream extends sdk.Consumer {

	constructor(consumerConfig) {
		super(consumerConfig);
	}

	async connect() {
		setTimeout(() => {
			throw new Error();
		}, 200);
		this.setConnected();
	}

	async initialize() {
	}

	async publish(config) {

	}

	async request(config) {

	}

};
