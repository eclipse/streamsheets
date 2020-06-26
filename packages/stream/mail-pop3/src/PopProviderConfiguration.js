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

module.exports = class PopProviderConfiguration extends sdk.ProviderConfiguration {
	constructor() {
		super({
			name: 'POP3 Provider'
		});
		this.canProduce = false;

		this.addConnectorDefinition({
			id: 'host',
			label: 'Host'
		});
		this.addConnectorDefinition({
			id: 'port',
			label: 'Port',
			defaultValue: 995
		});
		this.addConnectorDefinition({
			id: 'security',
			label: 'SSL/TLS',
			defaultValue: true,
			type: sdk.ProviderConfiguration.FIELDTYPES.CHECKBOX
		});
		this.addConnectorDefinition({
			id: 'pollInterval',
			label: {
				de: 'Intervall (s)',
				en: 'Fetch Interval (s)'
			},
			defaultValue: 300
		});


		this.addConsumerDefinition({
			id: 'username',
			label: {
				en: 'User Name',
				de: 'Benutzername'
			}
		});
		this.addConsumerDefinition({
			id: 'password',
			label: {
				en: 'Password',
				de: 'Kennwort'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.PASSWORD
		});
	}

};
