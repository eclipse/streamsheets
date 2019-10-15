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

		this.addConnectorDefinition({
			id: 'userName',
			label: {
				en: 'User Name',
				de: 'Benutzername'
			}
		});

		this.addConnectorDefinition({
			id: 'password',
			label: {
				en: 'Password',
				de: 'Kennwort'
			},
			type: ProviderConfiguration.FIELDTYPES.PASSWORD
		});

		this.addConsumerDefinition({
			id: 'expectResponse',
			label: {
				en: 'Expect Response',
				de: 'Antwort erwarten'
			},
			type: ProviderConfiguration.FIELDTYPES.CHECKBOX,
			defaultValue: false
		});

		this.addConsumerDefinition({
			id: 'responseTimeout',
			label: {
				en: 'Response Timeout',
				de: 'Wartezeit auf Antwort'
			},
			dependsOnPath: 'expectResponse',
			defaultValue: 5000
		});

		this.addConsumerDefinition({
			id: 'topics',
			label: 'URL Topics',
			type: ProviderConfiguration.FIELDTYPES.TEXTLIST
		});

		this.addFunctionDefinition(this.respondFunction(requestId => ({
			name: 'REST.RESPOND',
			baseFunction: 'respond',
			parameters: [
				requestId,
				{
					id: 'body',
					label: {
						en: 'Body',
						de: 'Body'
					},
					description: '',
					type: {
						name: 'json'
					},
					defaultValue: {}
				},
				{
					id: 'statusCode',
					label: {
						en: 'Status Code',
						de: 'Status Code'
					},
					description: '',
					type: {
						name: 'integer',
						min: 100,
						max: 599
					},
					defaultValue: 200
				},
				{
					id: 'headers',
					label: {
						en: 'Headers',
						de: 'Headers'
					},
					description: '',
					type: {
						name: 'json',
						fieldType: {
							name: 'string'
						}
					},
					optional: true
				}
			]
		})));
	}
};
