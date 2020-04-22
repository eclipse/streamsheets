const { ProviderConfiguration } = require('@cedalo/sdk-streams');

module.exports = class RestServerProviderConfiguration extends ProviderConfiguration {
	constructor() {
		super({
			name: 'REST Server Provider'
		});

		this.canConsume = true;
		this.canProduce = false;

		this.addConnectorDefinition({
			id: 'baseUrl',
			label: 'REST URL'
		});

		this.addConsumerDefinition({
			id: 'topics',
			label: 'URL Topics',
			type: ProviderConfiguration.FIELDTYPES.TEXTLIST
		});
	}
};
