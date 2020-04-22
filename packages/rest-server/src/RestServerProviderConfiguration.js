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
