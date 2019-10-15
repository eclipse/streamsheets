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
