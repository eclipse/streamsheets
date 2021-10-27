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

module.exports = class ToitProviderConfiguration extends sdk.ProviderConfiguration {
	constructor() {
		super({
			name: 'Toit Provider'
		});
		this.addConnectorDefinition({
			id: 'userName',
			label: {
				en: 'User Name',
				de: 'Benutzername'
			},
			help: {
				en: 'User or client name to connect to the Toit server',
				de: 'Benutzer- oder Klientenname, um sich beim Toit server anzumelden!'
			},
		});
		this.addConnectorDefinition({
			id: 'password',
			label: {
				en: 'Password',
				de: 'Kennwort'
			},
			help: {
				en: 'User or client password to connect to the Toit server',
				de: 'Benutzer- oder Klientenkennwort, um sich beim Toit server anzumelden!'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.PASSWORD
		});
		this.addConsumerDefinition({
			id: 'topic',
			label: {
				en: 'Toit Topic',
				de: 'Toit Topic'
			},
			help: {
				en: 'Topic to listen to. Typically starts with "cloud:"',
				de: 'Topic, dass abgehört werden soll. Ein Topic beginnt üblicherweise mit "cloud:".'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXT
		});
	}
};
