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
const { ProviderConfiguration } = require('@cedalo/sdk-streams');

module.exports = class RestServerProviderConfiguration extends ProviderConfiguration {
	constructor() {
		super({
			name: 'HTTP Server Provider'
		});

		this.canConsume = true;
		this.canProduce = false;

		this.addConnectorDefinition({
			id: 'baseUrl',
			label: 'Base URL'
		});

		this.addConsumerDefinition({
			id: 'topics',
			label: 'URL Paths',
			type: ProviderConfiguration.FIELDTYPES.TEXTLIST
		});
	}
};
