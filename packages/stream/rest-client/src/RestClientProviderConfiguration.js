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

module.exports = class RestClientProviderConfiguration extends ProviderConfiguration {
	constructor() {
		super({
			name: 'HTTP Client Provider'
		});

		this.canConsume = false;
		this.canProduce = true;


		this.addConnectorDefinition({
			id: 'baseUrl',
			label: 'Base URL'
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

		const functionDefinition = this.requestFunction((target, resultKeys, timeout) => ({
			name: 'HTTP.REQUEST',
			displayName: true,
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
		}));
		this.addFunctionDefinition(functionDefinition);

		this.addFunctionDefinition(
			Object.assign({}, functionDefinition, {
				name: 'REST.REQUEST',
				displayName: true,
				deprecated: true
			})
		);
	}
};
