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
const sdk = require('../..');

module.exports = class SimpleProviderConfiguration extends sdk.ProviderConfiguration {

	constructor() {
		super({
			name: 'Simple Provider'
		});
		this.addConnectorDefinition({
			id: 'baseTopic',
			label: 'Base Topic',
			onUpdate: 'connect'
		});
		this.addConsumerDefinition({
			id: 'topics',
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXTLIST,
			label: 'List of Topics extending base'
		});
		this.addProducerDefinition({
			id: 'pubTopic',
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXT,
			label: 'Topic to publish'
		});
	}

};
