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
			id: 'apikey',
			label: {
				en: 'API Key',
				de: 'API Schlüssel'
			},
			help: {
				en: 'API Key to connect to the Toit server',
				de: 'API Schlüssel, um sich beim Toit server anzumelden!'
			},
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
