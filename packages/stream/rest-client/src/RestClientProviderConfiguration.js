const { ProviderConfiguration } = require('@cedalo/sdk-streams');

module.exports = class RestClientProviderConfiguration extends ProviderConfiguration {
	constructor() {
		super({
			name: 'REST Client Provider'
		});

		this.canConsume = false;
		this.canProduce = true;


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

		this.addFunctionDefinition(
			this.requestFunction((target, resultKeys, timeout) => ({
				name: 'REST.REQUEST',
				baseFunction: 'request',
				parameters: [
					{
						id: 'url',
						label: 'URL',
						description: '',
						type: {
							name: 'string'
						}
					},
					{
						id: 'method',
						label: {
							en: 'Method',
							de: 'Methode'
						},
						description: '',
						type: {
							name: 'enum',
							values: [
								'GET',
								'POST',
								'PATCH',
								'DELETE',
								'PUT',
								'HEAD'
							]
						}
					},
					target,
					resultKeys,
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
						optional: true
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
					},
					timeout
				]
			}))
		);
	}
};
