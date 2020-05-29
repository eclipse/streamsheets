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
const sdk = require('@cedalo/sdk-streams');
const SmtpProducer = require('./SmtpProducer');
const SmtpProviderConfiguration = require('./SmtpProviderConfiguration');

module.exports = class SmtpProvider extends sdk.Provider {
	constructor() {
		super(new SmtpProviderConfiguration());
	}

	get canConsume() {
		return false;
	}

	get Producer() {
		return SmtpProducer;
	}
};
